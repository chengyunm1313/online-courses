import Link from "next/link";

export const metadata = {
  title: "聯絡我們",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">CONTACT</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">聯絡我們</h1>
        <div className="mt-6 space-y-4 text-gray-600">
          <p>若你正在測試這個 demo 平台，可透過下列方式聯絡維護者。</p>
          <p>Email：contact@example.com</p>
          <p>電話：(02) 1234-5678</p>
          <p>服務時間：週一至週五 10:00 - 18:00</p>
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
