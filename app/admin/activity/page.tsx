import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Navbar from "@/components/Navbar";
import { authOptions } from "@/lib/auth";
import { getAdminActivityFeed } from "@/lib/admin-data";

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toLocaleDateString("zh-TW")} ${date
    .toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })
    .replace("上午", "上午 ")
    .replace("下午", "下午 ")}`;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  enrollment: { label: "報名", color: "text-blue-600 bg-blue-100" },
  course: { label: "課程", color: "text-green-600 bg-green-100" },
  user: { label: "使用者", color: "text-purple-600 bg-purple-100" },
};

export default async function AdminActivityPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/test");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const activities = await getAdminActivityFeed(40);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">活動紀錄</h1>
          <p className="text-sm text-gray-600">
            查看平台最新動態，包含課程更新、報名資訊以及新使用者加入。
          </p>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
              目前尚無活動紀錄。
            </div>
          ) : (
            <ol className="relative space-y-4 border-l border-gray-200 pl-6">
              {activities.map((item) => {
                const typeMeta = TYPE_LABEL[item.type] ?? TYPE_LABEL.course;
                return (
                  <li key={item.id} className="ml-4">
                    <div className="absolute -left-2 mt-1 h-3 w-3 rounded-full bg-blue-500" />
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta.color}`}
                        >
                          {typeMeta.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
