import { cache } from "react";
import { Role } from "@socialmarka/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@socialmarka/db";

/** Aynı istekte layout + sayfa tek auth() çağırır */
export const getSession = cache(() => auth());

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
});

export const requireWorkspace = cache(async () => {
  const session = await requireSession();
  let workspaceId = session.user.workspaceId;
  let role = session.user.role ?? Role.MEMBER;

  if (!workspaceId) {
    let membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true, role: true },
    });

    if (!membership) {
      const workspace = await prisma.workspace.create({
        data: {
          name: `${session.user.name || "Yeni"} Çalışma Alanı`,
          members: {
            create: { userId: session.user.id, role: Role.ADMIN },
          },
        },
      });
      membership = { workspaceId: workspace.id, role: Role.ADMIN };
    }

    workspaceId = membership.workspaceId;
    role = membership.role;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { isActive: true },
  });
  if (!workspace?.isActive && role !== Role.SYSTEM_ADMIN) {
    redirect("/login?error=workspace_inactive");
  }

  return { session, workspaceId, role, userId: session.user.id };
});

/** API routes: returns null instead of redirect */
export async function getWorkspaceContext() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  let workspaceId = session.user.workspaceId;
  let role = session.user.role ?? Role.MEMBER;

  if (!workspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true, role: true },
    });
    if (!membership) return null;
    workspaceId = membership.workspaceId;
    role = membership.role;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { isActive: true },
  });
  if (!workspace?.isActive && role !== Role.SYSTEM_ADMIN) {
    return null;
  }

  return { session, workspaceId, role, userId: session.user.id };
}

export function canManageAccounts(role: Role) {
  return role === Role.SYSTEM_ADMIN || role === Role.ADMIN;
}

export function canEditContent(role: Role) {
  return role === Role.SYSTEM_ADMIN || role === Role.ADMIN || role === Role.MEMBER;
}

export function canPublish(role: Role) {
  return role === Role.SYSTEM_ADMIN || role === Role.ADMIN;
}

export function canAccessAdmin(role: Role) {
  return role === Role.SYSTEM_ADMIN || role === Role.ADMIN;
}

export function canViewOnly(role: Role) {
  return role === Role.VIEWER;
}
