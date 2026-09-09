"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import type { ReactNode } from "react";

import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";

export function StudentShell({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const pathname = usePathname();
  const base = pathname.split("/").slice(0, 3).join("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: "var(--tenant-primary)" }}
      >
        <span className="font-semibold">{tenant.name}</span>
        {user ? (
          <button onClick={() => signOut(auth)} className="text-sm underline">
            Salir
          </button>
        ) : (
          <Link href={`${base}/login`} className="text-sm underline">
            Ingresar
          </Link>
        )}
      </header>

      <main className="px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-gray-200 bg-white py-2">
        <Link href={base} className="text-sm">
          Clases
        </Link>
        <Link href={`${base}/clases`} className="text-sm">
          Mi ticket
        </Link>
        <Link href={`${base}/perfil`} className="text-sm">
          Perfil
        </Link>
      </nav>
    </div>
  );
}
