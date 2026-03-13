import Link from "next/link";

export const metadata = {
  title: "使用條款",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="mx-auto max-w-3xl rounded-xl bg-white px-6 py-10 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">TERMS</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">使用條款</h1>
        <div className="mt-6 space-y-4 text-gray-600">
          <p>
            這是示範站的暫時性條款頁，用來承接 footer 導覽與避免正式站出現 404。
          </p>
          <p>
            若日後作為實際商業站點，請補上完整的會員權利義務、退款規則、內容授權與責任限制條款。
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
