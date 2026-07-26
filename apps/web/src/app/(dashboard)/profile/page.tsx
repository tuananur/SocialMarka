import { requireWorkspace } from "@/lib/rbac";
import { prisma } from "@socialmarka/db";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const { session, workspaceId } = await requireWorkspace();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  // Fetch workspace details
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: session.user.role || "MEMBER",
        workspaceName: workspace?.name || "Çalışma Alanı",
      }}
    />
  );
}
