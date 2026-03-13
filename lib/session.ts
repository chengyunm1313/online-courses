import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { AppRole } from "@/lib/d1-repository";

export interface SessionContext {
  userId: string;
  role: AppRole;
  email?: string | null;
  name?: string | null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return null;
  }

  return {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function requireRole(
  roles: AppRole[],
): Promise<{ context: SessionContext } | { error: NextResponse }> {
  const context = await getSessionContext();
  if (!context) {
    return {
      error: NextResponse.json({ error: "未授權" }, { status: 401 }),
    };
  }

  if (!roles.includes(context.role)) {
    return {
      error: NextResponse.json({ error: "沒有權限" }, { status: 403 }),
    };
  }

  return { context };
}
