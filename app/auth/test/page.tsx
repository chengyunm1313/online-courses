import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";

/**
 * 驗證測試頁面
 * 展示項目：
 * - Google OAuth 登入流程
 * - 使用者會話資訊
 * - 登出按鈕
 */

export default async function AuthTestPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          身份驗證測試
        </h1>

        {session?.user ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-green-700 font-semibold mb-4">
                您已成功登入！
              </p>

              {session.user.image && (
                <div className="flex justify-center mb-4">
                  <Image
                    src={session.user.image}
                    alt="User avatar"
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                <div>
                  <span className="font-semibold text-gray-900">姓名:</span>{" "}
                  <span className="text-gray-900">{session.user.name || "無"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">電子郵件:</span>{" "}
                  <span className="text-gray-900">{session.user.email || "無"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">使用者 ID:</span>{" "}
                  <span className="text-gray-900">{session.user.id || "無"}</span>
                </div>
              </div>
            </div>

            <SignOutButton />
            <Link
              href="/"
              className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              返回首頁
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-900 text-center mb-6">
              您尚未登入。
            </p>

            <SignInButton />
          </div>
        )}
      </div>
    </div>
  );
}
