"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { Suspense, type ReactNode } from "react";

import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { InstallAppPrompt } from "@/components/student/InstallAppPrompt";

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
  // The studio page is a two-column layout on desktop; the other screens are single
  // task-focused columns that would look stretched at full width.
  const isWide = pathname === `${base}/estudio`;

  const navItems = [
    { href: base, label: "Reservar", icon: CalendarIcon },
    ...(user ? [{ href: `${base}/mis-clases`, label: "Mis clases", icon: TicketIcon }] : []),
    { href: `${base}/precios`, label: "Precios", icon: TagIcon },
    { href: `${base}/estudio`, label: "Estudio", icon: PinIcon },
    ...(user ? [{ href: `${base}/perfil`, label: "Perfil", icon: UserIcon }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas pb-28 min-[900px]:pb-0">
      <header className="sticky top-0 z-20 border-b border-ink/[0.07] bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between gap-6 px-5">
          <Link href={base} className="flex min-w-0 items-center gap-2.5">
            {tenant.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.branding.logoUrl}
                alt={tenant.name}
                className="h-[30px] w-auto mix-blend-multiply"
              />
            ) : (
              <span className="truncate font-display text-lg font-semibold tracking-tight text-ink">
                {tenant.name}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 min-[900px]:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-10 items-center rounded-full px-3.5 text-sm font-semibold transition-colors ${
                    isActive ? "bg-[#EDEBE6] text-ink" : "text-ink-soft hover:text-brand-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => signOut(auth)}
                className="flex h-10 items-center rounded-full border border-ink/[0.18] bg-white px-4 text-sm font-semibold text-ink"
              >
                Salir
              </button>
            ) : (
              <Link
                href={`${base}/login`}
                className="flex h-10 items-center rounded-full border border-ink/[0.18] bg-white px-4 text-sm font-semibold text-ink"
              >
                Ingresar
              </Link>
            )}
            <Link
              href={base}
              className="hidden h-10 items-center rounded-full bg-ink px-[18px] text-sm font-semibold text-white min-[900px]:flex"
            >
              Reservar clase
            </Link>
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 px-5 ${isWide ? "max-w-[1160px]" : "max-w-3xl"}`}>
        <div className={isWide ? "pt-6 min-[900px]:pt-10 min-[900px]:pb-16" : "py-5"}>
          <Suspense fallback={null}>
            <InstallAppPrompt />
          </Suspense>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-canvas from-60% to-transparent px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 min-[900px]:hidden">
        <div className="flex gap-1 rounded-[22px] border border-ink/[0.08] bg-white p-1.5 shadow-[0_10px_30px_-10px_rgba(22,24,29,0.25)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl text-[11px] font-semibold ${
                  isActive ? "bg-ink text-white" : "text-[#6b6e76]"
                }`}
              >
                <Icon active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
