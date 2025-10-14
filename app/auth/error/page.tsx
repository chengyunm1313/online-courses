import Link from "next/link";

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    Configuration: "伺服器配置錯誤，請聯絡管理員。",
    AccessDenied: "存取被拒絕，您沒有權限登入。",
    Verification: "驗證連結已過期或已被使用。",
    OAuthSignin: "OAuth 登入初始化失敗。",
    OAuthCallback: "OAuth 回調處理失敗。",
    OAuthCreateAccount: "無法創建 OAuth 帳戶。",
    EmailCreateAccount: "無法創建電子郵件帳戶。",
    Callback: "回調 URL 處理失敗。",
    OAuthAccountNotLinked: "此電子郵件已使用其他登入方式註冊。",
    EmailSignin: "無法發送電子郵件。",
    CredentialsSignin: "登入失敗，請檢查您的憑證。",
    SessionRequired: "請先登入才能訪問此頁面。",
    Default: "發生未知錯誤，請稍後再試。",
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登入錯誤
          </h2>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-center text-sm text-red-600">{message}</p>
            {error && (
              <p className="text-center text-xs text-gray-500 mt-2">
                錯誤代碼: {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <Link
            href="/auth/test"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回登入頁面
          </Link>
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
