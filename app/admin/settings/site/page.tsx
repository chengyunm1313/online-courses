import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { authOptions } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminSiteSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-950">全站設定</h1>
        <p className="text-sm leading-6 text-slate-700">
          將客服信箱、聯絡文案、頁尾與政策摘要集中管理，讓前台與通知信使用一致資料。
        </p>
      </div>

      <SiteSettingsForm initialValues={settings} />
    </div>
  );
}
