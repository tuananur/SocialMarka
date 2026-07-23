import { getSession } from "@/lib/rbac";
import { DashboardShell } from "@/components/dashboard/shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        workspaceName: session.user.workspaceName || "Çalışma Alanı",
        role: session.user.role || "MEMBER",
      }}
    >
      {children}
    </DashboardShell>
  );
}
