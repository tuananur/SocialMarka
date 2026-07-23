import { getSession, canAccessAdmin } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (!canAccessAdmin(session.user.role || "MEMBER")) redirect("/dashboard");

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        workspaceName: session.user.workspaceName || "Çalışma Alanı",
        role: session.user.role || "ADMIN",
      }}
    >
      {children}
    </AdminShell>
  );
}
