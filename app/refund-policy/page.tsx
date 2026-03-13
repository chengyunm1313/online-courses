import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getSiteSettings } from "@/lib/site-settings";

export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const summaryLines = settings.refundSummary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">退款政策</h1>
          <div className="mt-6 space-y-5 text-sm leading-7 text-gray-700">
            {summaryLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
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
