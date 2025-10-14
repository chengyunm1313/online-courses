import { DefaultSession } from "next-auth";

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
