import Link from "next/link";
import { getServerSession } from "next-auth";
import ContactForm from "@/components/support/ContactForm";
import { authOptions } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "聯絡我們",
};

export default async function ContactPage() {
  const session = await getServerSession(authOptions);
  const settings = await getSiteSettings();
  const supportGuidelines = settings.supportGuidelines
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="py-16">
        <div className="mx-auto max-w-5xl grid gap-6 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-white px-6 py-10 shadow-sm">
            <p className="text-sm font-semibold text-blue-600">CONTACT</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">聯絡我們</h1>
            <p className="mt-4 text-gray-600">
              {settings.contactIntro}
            </p>
            <div className="mt-8">
              <ContactForm
                defaultName={session?.user?.name ?? ""}
                defaultEmail={session?.user?.email ?? ""}
              />
            </div>
          </div>

          <aside className="rounded-xl bg-slate-900 px-6 py-10 text-slate-100 shadow-sm">
            <h2 className="text-xl font-semibold">客服處理說明</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              {supportGuidelines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">其他聯絡方式</p>
              <p className="mt-2">Email：{settings.supportEmail}</p>
              <p>服務時間：{settings.supportHours}</p>
              <p>如需查詢政策，請先閱讀退款政策與購買須知。</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/refund-policy" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                退款政策
              </Link>
              <Link href="/purchase-guide" className="rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-white">
                購買須知
              </Link>
            </div>
            <div className="mt-8">
              <Link href="/" className="text-sm font-semibold text-blue-300 hover:text-blue-200">
                返回首頁
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
