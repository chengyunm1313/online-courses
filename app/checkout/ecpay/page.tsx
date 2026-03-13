'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CheckoutItem {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  price: number;
  instructor: string;
}

interface CheckoutFormData {
  courseIds?: string[];
  discountCode?: string;
  items: CheckoutItem[];
  paymentMethod: 'CREDIT' | 'ATM';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

/**
 * 綠界 ECPay 結帳頁面
 * 用戶在此頁面選擇付款方式並確認數位課程購買資訊
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT' | 'ATM'>('CREDIT');
  const [notes, setNotes] = useState('');

  // 從 sessionStorage 取得購物車資料（由前端頁面存儲）
  const [cartData, setCartData] = useState<CheckoutFormData | null>(null);

  // 初始化購物車資料
  useEffect(() => {
    const storedCart = sessionStorage.getItem('checkoutCart');
    if (storedCart) {
      try {
        setCartData(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart data:', e);
        setError('購物車資料有誤，請重新選擇商品');
      }
    }
  }, []);

  // 檢查登入狀態
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">請先登入</h2>
          <p className="text-gray-600 mb-6">
            您需要登入才能繼續結帳
          </p>
          <Link
            href="/api/auth/signin"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!cartData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">購物車為空</h2>
          <p className="text-gray-600 mb-6">
            請先選擇課程進行結帳
          </p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            瀏覽課程
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/ecpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: cartData.courseIds ?? cartData.items.map((item) => item.courseId),
          paymentMethod,
          discountCode: cartData.discountCode,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.detailedError ? `${data.error}: ${data.detailedError}` : (data.error || '結帳失敗');
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.form?.action && data.form?.fields) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.form.action;
        form.style.display = 'none';

        Object.entries(data.form.fields as Record<string, string | number>).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        sessionStorage.removeItem('checkoutCart');
        form.submit();
      } else if (data.redirectUrl) {
        sessionStorage.removeItem('checkoutCart');
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('支付流程回應格式錯誤');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error ? err.message : '結帳時發生錯誤，請重試'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">結帳</h1>
          <p className="text-gray-600 mt-2">確認您的訂單並選擇付款方式</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 訂單摘要 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>

            {/* 商品列表 */}
            <div className="space-y-4 mb-6">
              {cartData.items.map((item) => (
                <div
                  key={item.courseId}
                  className="flex justify-between items-start pb-4 border-b"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.courseTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      講師：{item.instructor}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    NT${item.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* 金額明細 */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-gray-700">
                <span>小計：</span>
                <span>NT${cartData.subtotal.toLocaleString()}</span>
              </div>
              {cartData.tax > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>稅額：</span>
                  <span>NT${cartData.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>合計：</span>
                <span>NT${cartData.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 付款方式 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">付款方式</h2>
            <div className="space-y-4">
              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-blue-50"
                style={{ borderColor: paymentMethod === 'CREDIT' ? '#3b82f6' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="payment"
                  value="CREDIT"
                  checked={paymentMethod === 'CREDIT'}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'CREDIT' | 'ATM')
                  }
                  className="w-4 h-4 mt-1"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">信用卡</p>
                  <p className="text-sm text-gray-600">
                    支援 VISA、MasterCard、JCB 等信用卡，並可分期付款
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-blue-50"
                style={{ borderColor: paymentMethod === 'ATM' ? '#3b82f6' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="payment"
                  value="ATM"
                  checked={paymentMethod === 'ATM'}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'CREDIT' | 'ATM')
                  }
                  className="w-4 h-4 mt-1"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">ATM 轉帳</p>
                  <p className="text-sm text-gray-600">
                    使用銀行帳號進行轉帳，我們會為您提供轉帳帳號資訊
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 訂單備註 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">訂單備註（選填）</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="有任何特殊需求或備註？"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900">
            <h2 className="text-xl font-semibold">購買說明</h2>
            <ul className="mt-3 space-y-2">
              <li>付款成功後將立即開通課程，您可從「我的學習」開始觀看。</li>
              <li>若需申請人工退款，請先閱讀退款政策並透過客服頁提交需求。</li>
              <li>所有交易透過綠界金流處理，課程為數位內容，不涉及配送流程。</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/refund-policy" className="rounded-full bg-white px-3 py-1.5 text-blue-700">
                退款政策
              </Link>
              <Link href="/purchase-guide" className="rounded-full bg-white px-3 py-1.5 text-blue-700">
                購買須知
              </Link>
              <Link href="/contact" className="rounded-full bg-white px-3 py-1.5 text-blue-700">
                客服聯絡
              </Link>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? '處理中...' : '前往付款'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
            >
              返回
            </button>
          </div>

          {/* 安全提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">🔒 安全提示</p>
            <p>
              本網站使用 HTTPS 加密所有通訊。您的付款資訊將由綠界金流安全處理，我們不會存儲您的信用卡資訊。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
