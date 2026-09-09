"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import type { TenantDoc } from "@/lib/types/firestore";
import { StudentAppLink } from "@/components/admin/StudentAppLink";

const NAV_ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/sedes", label: "Sedes" },
  { href: "/admin/tipos-de-clase", label: "Tipos de clase" },
  { href: "/admin/instructores", label: "Instructores" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/paquetes", label: "Paquetes" },
  { href: "/admin/alumnos", label: "Alumnos" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, claims, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState<TenantDoc | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user || !claims || claims.role === "student") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!claims.tenantId) {
      // A superadmin with no tenantId manages the platform, not a single studio.
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "tenants", claims.tenantId), (snap) => {
      setTenant(snap.exists() ? (snap.data() as TenantDoc) : null);
    });
    return unsubscribe;
  }, [loading, user, claims, router, pathname]);

  if (loading || !user || !claims) {
    return <div className="p-10 text-sm text-gray-500">Cargando…</div>;
  }

  if (!claims.tenantId || !tenant) {
    return <div className="p-10 text-sm text-gray-500">Cargando estudio…</div>;
  }

  return (
    <TenantProvider tenantId={claims.tenantId} tenant={tenant}>
      <div className="flex min-h-screen">
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
          <p className="mb-6 truncate font-semibold">{tenant.name}</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  pathname === item.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <StudentAppLink slug={tenant.slug} compact />

          <button
            onClick={() => signOut(auth)}
            className="mt-8 text-sm text-gray-500 hover:text-gray-800"
          >
            Cerrar sesión
          </button>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </TenantProvider>
  );
}
