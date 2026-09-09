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
  const [navOpen, setNavOpen] = useState(false);

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

  // Close the mobile drawer automatically on every navigation.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (loading || !user || !claims) {
    return <div className="p-10 text-sm text-gray-500">Cargando…</div>;
  }

  if (!claims.tenantId || !tenant) {
    return <div className="p-10 text-sm text-gray-500">Cargando estudio…</div>;
  }

  return (
    <TenantProvider tenantId={claims.tenantId} tenant={tenant}>
      <div className="min-h-screen md:flex">
        {/* Mobile top bar — hidden on desktop, where the sidebar is always visible instead. */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white p-4 md:hidden">
          <p className="truncate font-semibold">{tenant.name}</p>
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Backdrop for the mobile drawer. */}
        {navOpen && (
          <div
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            aria-hidden
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-gray-50 p-4 transition-transform duration-200 ease-out md:relative md:z-auto md:w-56 md:shrink-0 md:translate-x-0 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="truncate font-semibold">{tenant.name}</p>
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

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

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </TenantProvider>
  );
}
