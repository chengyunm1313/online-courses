"use client";

import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignOutButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <button
      onClick={() => signOut({ callbackUrl })}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
    >
      登出
    </button>
  );
}
