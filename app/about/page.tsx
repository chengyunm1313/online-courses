import Link from "next/link";

export const metadata = {
  title: "關於平台",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">ABOUT</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">關於平台</h1>
        <div className="mt-6 space-y-4 text-gray-600">
          <p>
            這是線上課程平台的示範站，展示課程瀏覽、Google 登入、結帳流程、D1
            資料讀寫與 Gmail 通知等功能。
          </p>
          <p>
            目前內容以產品流程驗證與系統整合測試為主，不代表真實商業服務條款或正式營運資訊。
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
