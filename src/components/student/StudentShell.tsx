"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import type { ReactNode } from "react";

import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x={3.5} y={5} width={17} height={15} rx={2} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function TicketIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx={12} cy={8} r={3.5} />
      <path d="M4.5 20c1.4-3.6 4.5-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12.5 3.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-.3.7l-9 9a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 .7-.3Z" />
      <circle cx={16.5} cy={7.5} r={1.2} fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx={12} cy={9} r={2.5} />
    </svg>
  );
}

export function StudentShell({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const pathname = usePathname();
  const base = pathname.split("/").slice(0, 3).join("/");

  const navItems = [
    { href: base, label: "Reservar", icon: CalendarIcon },
    { href: `${base}/mis-clases`, label: "Mis clases", icon: TicketIcon },
    { href: `${base}/precios`, label: "Precios", icon: TagIcon },
    { href: `${base}/estudio`, label: "Estudio", icon: PinIcon },
    { href: `${base}/perfil`, label: "Perfil", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      <main className="px-4 py-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs"
              style={{ color: isActive ? "var(--tenant-primary)" : "#6b7280" }}
            >
              <Icon active={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
