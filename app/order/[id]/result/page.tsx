'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface OrderData {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: Array<{
    courseId: string;
    courseTitle: string;
    courseThumbnail: string;
    price: number;
    instructor: string;
  }>;
  paymentMethod: string;
  shippingMethod: string;
  merchantTradeNo?: string;
  ecpayData?: {
    RtnCode?: number;
    RtnMsg?: string;
    TradeNo?: string;
    TradeAmt?: number;
    PaymentDate?: string;
    PaymentType?: string;
    card4no?: string;
  };
  paidAt?: string;
  createdAt: string;
  notes?: string;
}

/**
 * 訂單結果頁面
 * 顯示訂單詳情和支付結果
 */
export default function OrderResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const orderId = params.id as string;
  const paymentType = searchParams.get('payment');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得訂單詳情
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError('訂單 ID 不存在');
          return;
        }

        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('無法取得訂單詳情');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError(
          err instanceof Error ? err.message : '載入訂單時發生錯誤'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // 載入中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg text-gray-600">載入訂單詳情中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            ❌ 訂單載入失敗
          </h2>
          <p className="text-gray-600 mb-6">{error || '訂單不存在'}</p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            返回課程列表
          </Link>
        </div>
      </div>
    );
  }

  // 根據訂單狀態確定顯示內容
  const isPaid = order.status === 'PAID';
  const isFailed = order.status === 'FAILED';
  const isCreated = order.status === 'CREATED' || paymentType === 'atm';
  const isATM = order.paymentMethod === 'ATM' || paymentType === 'atm';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 訂單狀態卡 */}
        <div
          className={`rounded-lg shadow p-8 text-center ${
            isPaid ? 'bg-green-50 border-2 border-green-200' :
            isFailed ? 'bg-red-50 border-2 border-red-200' :
            'bg-blue-50 border-2 border-blue-200'
          }`}
        >
          {isPaid && (
            <>
              <div className="text-5xl mb-4">✓</div>
              <h1 className="text-3xl font-bold text-green-700 mb-2">
                付款成功！
              </h1>
              <p className="text-gray-600 mb-6">
                感謝您的購買，課程已加入您的學習清單
              </p>
              <div className="text-lg font-semibold text-gray-800">
                交易編號：{order.ecpayData?.TradeNo || order.merchantTradeNo}
              </div>
              {order.paidAt && (
                <div className="text-sm text-gray-600 mt-2">
                  付款時間：{new Date(order.paidAt).toLocaleString('zh-TW')}
                </div>
              )}
            </>
          )}

          {isFailed && (
            <>
              <div className="text-5xl mb-4">✗</div>
              <h1 className="text-3xl font-bold text-red-700 mb-2">
                付款失敗
              </h1>
              <p className="text-gray-600 mb-6">
                很抱歉，您的付款未能完成。請檢查以下信息或重試。
              </p>
              {order.ecpayData?.RtnMsg && (
                <div className="text-gray-800 mb-6 bg-white rounded p-3">
                  <p className="text-sm">失敗原因：{order.ecpayData.RtnMsg}</p>
                </div>
              )}
            </>
          )}

          {isCreated && isATM && (
            <>
              <div className="text-5xl mb-4">⏳</div>
              <h1 className="text-3xl font-bold text-blue-700 mb-2">
                等待匯款
              </h1>
              <p className="text-gray-600 mb-6">
                請於下方提供的時間內，將款項轉帳至指定帳戶。確認收款後，課程將自動加入您的學習清單。
              </p>
            </>
          )}

          {isCreated && !isATM && (
            <>
              <div className="text-5xl mb-4">⏳</div>
              <h1 className="text-3xl font-bold text-blue-700 mb-2">
                訂單待處理
              </h1>
              <p className="text-gray-600 mb-6">
                我們正在處理您的訂單。請稍候...
              </p>
            </>
          )}
        </div>

        {/* ATM 轉帳資訊 */}
        {isATM && isCreated && (
          <div className="bg-white rounded-lg shadow p-8 border-l-4 border-orange-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🏦 銀行轉帳資訊
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">銀行</p>
                  <p className="text-lg font-semibold text-gray-900">
                    台灣銀行
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">分行代號</p>
                  <p className="text-lg font-semibold text-gray-900">004</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">帳號</p>
                <p className="text-2xl font-mono font-bold text-gray-900 break-all">
                  1234567890
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('1234567890');
                    alert('帳號已複製到剪貼板');
                  }}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  複製帳號
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">帳戶名稱</p>
                  <p className="font-semibold text-gray-900">
                    線上課程平台
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">轉帳金額</p>
                  <p className="text-lg font-semibold text-gray-900">
                    NT${order.total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ 轉帳後，請保留轉帳憑證。如帳款未於 7 天內入帳，請聯繫客服。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 信用卡資訊 */}
        {order.paymentMethod === 'CREDIT' && order.ecpayData && (
          <div className="bg-white rounded-lg shadow p-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              💳 信用卡支付詳情
            </h2>
            <div className="space-y-4">
              {order.ecpayData.card4no && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">卡別</p>
                    <p className="font-semibold text-gray-900">
                      {order.ecpayData.PaymentType || '信用卡'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">末四碼</p>
                    <p className="text-lg font-mono font-semibold text-gray-900">
                      ****{order.ecpayData.card4no}
                    </p>
                  </div>
                </div>
              )}
              {order.ecpayData.PaymentDate && (
                <div>
                  <p className="text-sm text-gray-600">付款時間</p>
                  <p className="font-semibold text-gray-900">
                    {order.ecpayData.PaymentDate}
                  </p>
                </div>
              )}
              {order.ecpayData.TradeNo && (
                <div>
                  <p className="text-sm text-gray-600">綠界交易編號</p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {order.ecpayData.TradeNo}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 訂單詳情 */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 訂單詳情
          </h2>

          {/* 商品列表 */}
          <div className="space-y-4 mb-6 pb-6 border-b">
            {order.items.map((item) => (
              <div
                key={item.courseId}
                className="flex gap-4 items-start"
              >
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={item.courseThumbnail}
                    alt={item.courseTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.courseTitle}
                  </h3>
                  <p className="text-sm text-gray-600">
                    講師：{item.instructor}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    NT${item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 金額明細 */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-gray-700">
              <span>小計：</span>
              <span>NT${order.items.reduce((sum, item) => sum + item.price, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>合計：</span>
              <span>NT${order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* 配送方式 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">配送方式</p>
              <p className="font-semibold text-gray-900">
                {order.shippingMethod === 'HOME' ? '宅配送到府' : '超商取貨'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">付款方式</p>
              <p className="font-semibold text-gray-900">
                {order.paymentMethod === 'CREDIT' ? '信用卡' : 'ATM 轉帳'}
              </p>
            </div>
          </div>

          {/* 訂單編號和建立時間 */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">訂單編號</p>
              <p className="font-mono text-sm font-semibold text-gray-900">
                {order.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">建立時間</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleString('zh-TW')}
              </p>
            </div>
          </div>

          {/* 訂單備註 */}
          {order.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">訂單備註</p>
              <p className="text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>

        {/* 下一步建議 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            下一步建議
          </h3>
          <ul className="space-y-2 text-blue-800">
            {isPaid && (
              <>
                <li>✓ 課程已成功加入您的學習清單</li>
                <li>
                  <Link href="/learning" className="underline hover:no-underline">
                    → 查看我的學習進度
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="underline hover:no-underline">
                    → 查看我的個人資料
                  </Link>
                </li>
              </>
            )}
            {isFailed && (
              <>
                <li>請檢查您的付款資訊</li>
                <li>
                  <button
                    onClick={() => window.history.back()}
                    className="text-blue-600 underline hover:no-underline"
                  >
                    ← 返回重新結帳
                  </button>
                </li>
              </>
            )}
            {isCreated && isATM && (
              <>
                <li>⏳ 請在規定時間內完成轉帳</li>
                <li>我們將在確認收款後更新您的訂單狀態</li>
                <li>
                  <Link href="/learning" className="underline hover:no-underline">
                    → 查看我的學習
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link href="/courses" className="underline hover:no-underline">
                → 繼續瀏覽課程
              </Link>
            </li>
          </ul>
        </div>

        {/* 聯繫客服 */}
        <div className="text-center py-4">
          <p className="text-gray-600">
            有任何問題？
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline ml-2">
              聯繫客服
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
