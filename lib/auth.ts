import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "./firebase-admin";

/**
 * Auth.js (NextAuth.js) 設定
 * - 透過 Firestore Adapter 儲存會話資料
 * - 所有驗證流程皆在伺服器側處理
 */

const INSTRUCTOR_EMAILS = new Set([
  "skypassion5000@gmail.com",
  "chengyunm1313@gmail.com"
]);

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter(adminDb),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  pages: {
    signIn: '/auth/test',
    error: '/auth/error',
  },

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async session({ session, user }) {
      // 將使用者 ID 與角色資訊放入會話物件
      if (session.user) {
        session.user.id = user.id;
        const storedRole = (user as { role?: string }).role;
        const email = session.user.email?.toLowerCase();
        const isInstructor = email ? INSTRUCTOR_EMAILS.has(email) : false;

        // 確保 role 是正確的類型
        if (isInstructor) {
          session.user.role = "admin";
        } else if (storedRole === "student" || storedRole === "instructor" || storedRole === "admin") {
          session.user.role = storedRole;
        } else {
          session.user.role = "student";
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
