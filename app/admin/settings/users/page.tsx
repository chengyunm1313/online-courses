import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import UserRoleManager from "@/components/admin/UserRoleManager";
import { authOptions } from "@/lib/auth";
import { listAppUsers } from "@/lib/d1-repository";

export default async function AdminUserSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const users = await listAppUsers();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-950">帳號與權限管理</h1>
        <p className="text-sm leading-6 text-slate-700">
          將管理員、講師與學生的權限集中在設定頁維護，避免首頁承擔過多系統操作。
        </p>
      </div>

      <UserRoleManager
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
