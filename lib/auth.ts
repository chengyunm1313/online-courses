import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureAppUser } from "@/lib/d1-repository";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  pages: {
    signIn: "/auth/test",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, profile }) {
      const email =
        user?.email ??
        token.email ??
        (typeof profile?.email === "string" ? profile.email : undefined);

      if (!token.sub || !email) {
        return token;
      }

      const appUser = await ensureAppUser({
        id: token.sub,
        email,
        name:
          user?.name ??
          token.name ??
          (typeof profile?.name === "string" ? profile.name : undefined),
        image:
          user?.image ??
          (typeof token.picture === "string" ? token.picture : undefined),
      });

      token.role = appUser.role;
      token.email = appUser.email;
      token.name = appUser.name;
      if (appUser.image) {
        token.picture = appUser.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role =
          token.role === "admin" || token.role === "instructor" || token.role === "student"
            ? token.role
            : "student";
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
