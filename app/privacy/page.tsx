import Link from "next/link";

export const metadata = {
  title: "隱私政策",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">PRIVACY</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">隱私政策</h1>
        <div className="mt-6 space-y-4 text-gray-600">
          <p>
            本頁內容僅供示範用途。平台在測試流程中可能使用登入資訊、訂單資料與通知紀錄來驗證系統功能。
          </p>
          <p>
            若要作為正式服務上線，請改寫為實際的個資蒐集目的、保存期限、使用方式與第三方共享政策。
          </p>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            返回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
