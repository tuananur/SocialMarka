import { DefaultSession, DefaultJWT } from "next-auth";
import { Role } from "@socialmarka/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
      workspaceId?: string;
      workspaceName?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: Role;
    workspaceId?: string;
    workspaceName?: string;
  }
}
