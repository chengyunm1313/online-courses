import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">退款政策</h1>
          <div className="mt-6 space-y-5 text-sm leading-7 text-gray-700">
            <p>
              本平台販售之商品為數位課程。付款成功後系統會立即開通課程，因此退款申請將採人工審核。
            </p>
            <p>
              若您遇到重複購買、課程內容與頁面描述明顯不符，或付款成功但系統未開通，請於 7 日內聯絡客服並提供訂單編號。
            </p>
            <p>
              已觀看大量內容、下載完整教材，或超過合理審查期間的案件，平台得視實際使用情況拒絕退款。
            </p>
            <p>
              退款通過後，訂單將標記為退款中，並於完成撥回後更新為已退款。實際入帳時間依付款機構作業為準。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              聯絡客服
            </Link>
            <Link href="/purchase-guide" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">
              查看購買須知
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
