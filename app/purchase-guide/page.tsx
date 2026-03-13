import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PurchaseGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">購買須知</h1>
          <div className="mt-6 space-y-5 text-sm leading-7 text-gray-700">
            <p>購買流程為：課程頁確認資訊、登入後結帳、完成付款、課程立即開通。</p>
            <p>本平台目前支援信用卡與 ATM 付款，交易將透過綠界金流安全處理。</p>
            <p>課程為數位內容，不提供配送。付款完成後請至「我的學習」查看開通狀態與進度。</p>
            <p>若您持有折扣碼，請於課程購買頁先行套用，進入結帳後將以折扣後金額成立訂單。</p>
            <p>如發生付款異常、課程未開通或需申請退款，請透過客服頁提供訂單編號，我們會協助處理。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              返回課程列表
            </Link>
            <Link href="/refund-policy" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
              查看退款政策
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
