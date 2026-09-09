import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AdminShell } from "@/components/admin/AdminShell";

// Every admin screen is auth-gated, tenant-scoped, live data — never static marketing
// content — so it must render per-request rather than be prerendered at build time
// (which would also try to initialize the Firebase client SDK with no real config).
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
