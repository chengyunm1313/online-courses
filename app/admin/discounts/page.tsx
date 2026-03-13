import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DiscountManagement from "@/components/admin/DiscountManagement";

export default async function AdminDiscountsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">折扣碼管理</h1>
          <p className="text-sm text-gray-600">
            管理招商活動與促銷策略，避免商務規則寫死在程式裡。
          </p>
        </div>
        <DiscountManagement />
      </div>
  );
}
