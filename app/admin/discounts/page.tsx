import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">折扣碼管理</h1>
          <p className="text-sm text-gray-600">
            管理招商活動與促銷策略，避免商務規則寫死在程式裡。
          </p>
        </div>
        <DiscountManagement />
      </div>
    </div>
  );
}
