import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma, Role } from "@socialmarka/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      const userId = token.sub;
      if (!userId) return token;

      // Giriş / update / workspace eksikse membership yükle
      if (user || trigger === "update" || !token.workspaceId) {
        try {
          let membership = await prisma.workspaceMember.findFirst({
            where: { userId },
            select: {
              role: true,
              workspaceId: true,
              workspace: { select: { name: true, isActive: true } },
            },
            orderBy: { workspace: { createdAt: "asc" } },
          });

          // Temiz kurulum / kayıt sonrası workspace yoksa oluştur
          if (!membership && user) {
            const workspace = await prisma.workspace.create({
              data: {
                name: `${user.name || "Yeni"} Çalışma Alanı`,
                members: {
                  create: { userId, role: Role.ADMIN },
                },
              },
            });
            membership = {
              role: Role.ADMIN,
              workspaceId: workspace.id,
              workspace: { name: workspace.name, isActive: true },
            };
          }

          if (membership) {
            token.role = membership.role;
            token.workspaceId = membership.workspaceId;
            token.workspaceName = membership.workspace.name;
          }
        } catch (err) {
          console.error("[auth] jwt workspace yüklenemedi", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || "";
        session.user.role = (token.role as Role) ?? Role.MEMBER;
        session.user.workspaceId = token.workspaceId as string | undefined;
        session.user.workspaceName = token.workspaceName as string | undefined;
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const existing = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
      });
      if (existing) return;

      const workspace = await prisma.workspace.create({
        data: {
          name: `${user.name || "Yeni"} Çalışma Alanı`,
          members: {
            create: {
              userId: user.id,
              role: Role.ADMIN,
            },
          },
        },
      });
      await prisma.auditLog.create({
        data: {
          action: "WORKSPACE_CREATED",
          details: { workspaceId: workspace.id, via: "oauth_signup" },
          userId: user.id,
          workspaceId: workspace.id,
        },
      });
    },
  },
});
