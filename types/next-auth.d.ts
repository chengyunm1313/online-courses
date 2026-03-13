import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "student" | "instructor" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "student" | "instructor" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "instructor" | "admin";
  }
}
