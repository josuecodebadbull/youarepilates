"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  Ellipsis,
  FilePen,
  Layers,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { initials, usePendingIntents } from "@/lib/admin/data";
import type { TenantDoc, UserRole } from "@/lib/types/firestore";
import { Modal, ModalStyleProvider } from "@/components/ui/Modal";
import { StudentAppLink } from "@/components/admin/StudentAppLink";
import { ToastProvider } from "@/components/admin/Toast";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Operación",
    items: [
      { href: "/admin", label: "Resumen", icon: LayoutGrid },
      { href: "/admin/horarios", label: "Horarios", icon: CalendarDays },
      { href: "/admin/alumnos", label: "Alumnos", icon: Users },
      { href: "/admin/pagos", label: "Pagos", icon: Wallet },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/sedes", label: "Sedes", icon: MapPin },
      { href: "/admin/tipos-de-clase", label: "Tipos de clase", icon: Layers },
      { href: "/admin/instructores", label: "Instructores", icon: UserRound },
      { href: "/admin/paquetes", label: "Paquetes", icon: Package },
    ],
  },
  {
    title: "Estudio",
    items: [
      { href: "/admin/perfil-estudio", label: "Perfil del estudio", icon: Store },
      { href: "/admin/responsiva", label: "Responsiva", icon: FilePen },
      { href: "/admin/configuracion", label: "Configuración", icon: SlidersHorizontal },
    ],
  },
];

const TABS: NavItem[] = [
  { href: "/admin", label: "Hoy", icon: LayoutGrid },
  { href: "/admin/horarios", label: "Horarios", icon: CalendarDays },
  { href: "/admin/alumnos", label: "Alumnos", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
];

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  tenant_owner: "Dueño(a)",
  staff: "Staff",
  instructor: "Instructor(a)",
  student: "Alumno",
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

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
    return <div className="p-10 text-sm text-ink-soft">Cargando…</div>;
  }

  if (!claims.tenantId || !tenant) {
    return <div className="p-10 text-sm text-ink-soft">Cargando estudio…</div>;
  }

  const userName = user.displayName || user.email || tenant.name;

  return (
    <TenantProvider tenantId={claims.tenantId} tenant={tenant}>
      <ModalStyleProvider value="sheet">
        <ToastProvider>
          <AdminFrame
            tenantId={claims.tenantId}
            tenant={tenant}
            userName={userName}
            roleLabel={ROLE_LABELS[claims.role]}
          >
            {children}
          </AdminFrame>
        </ToastProvider>
      </ModalStyleProvider>
    </TenantProvider>
  );
}

function AdminFrame({
  tenantId,
  tenant,
  userName,
  roleLabel,
  children,
}: {
  tenantId: string;
  tenant: TenantDoc;
  userName: string;
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { intents } = usePendingIntents(tenantId);
  const pendingBadge = intents.length > 0 ? String(intents.length) : "";
  const [sheet, setSheet] = useState<"quick" | "more" | null>(null);

  // Close the "Crear"/"Más" sheets on every navigation.
  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  const moreActive = NAV_GROUPS.slice(1).some((g) => g.items.some((i) => isActive(pathname, i.href)));

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-[264px] shrink-0 flex-col overflow-y-auto border-r border-ink/[0.08] bg-white lg:flex">
        <div className="flex flex-col gap-2.5 border-b border-ink/[0.06] px-5 pb-[18px] pt-[22px]">
          <StudioLogo tenant={tenant} className="h-7" />
          <p className="text-xs text-ink-faint">{tenant.name} · Panel</p>
        </div>
        <nav className="flex flex-col gap-[18px] px-3 py-3.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-sm transition-colors ${
                      active
                        ? "bg-brand-50 font-semibold text-brand-800"
                        : "font-medium text-ink-soft hover:bg-[#F7F6F3] hover:text-ink"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/pagos" && pendingBadge && <CountBadge>{pendingBadge}</CountBadge>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-4 pb-[18px] pt-3.5">
          <StudentAppLink slug={tenant.slug} variant="sidebar" />
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              {initials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{userName}</p>
              <p className="text-xs text-ink-faint">{roleLabel}</p>
            </div>
            <button
              onClick={() => signOut(auth)}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-ink-soft hover:bg-[#F3F2EE] hover:text-ink"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile / tablet header */}
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-ink/[0.07] bg-canvas/90 px-4 backdrop-blur-md lg:hidden">
          <Link href="/admin" className="min-w-0">
            <StudioLogo tenant={tenant} className="h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSheet("quick")}
              aria-label="Crear"
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-ink text-white"
            >
              <Plus className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDEBE6] text-[13px] font-bold text-ink">
              {initials(userName)}
            </span>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden h-[68px] shrink-0 items-center justify-between gap-4 border-b border-ink/[0.07] bg-canvas px-10 lg:flex">
          <HeaderSearch />
          <div className="flex gap-2">
            <Link
              href="/admin/alumnos?nuevo=1"
              className="flex h-[42px] items-center rounded-xl border border-ink/[0.14] bg-white px-4 text-sm font-semibold text-ink hover:bg-[#F7F6F3]"
            >
              Nuevo alumno
            </Link>
            <Link
              href="/admin/horarios?nuevo=1"
              className="flex h-[42px] items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-black"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Programar clase
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto box-border max-w-[1200px] px-4 pb-8 pt-[22px] md:px-7 md:pb-10 md:pt-7 lg:px-10 lg:pb-14 lg:pt-8">
            {children}
          </div>
        </main>

        {/* Mobile / tablet bottom tabs */}
        <nav className="flex shrink-0 gap-0.5 border-t border-ink/[0.08] bg-white px-2.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 lg:hidden">
          {TABS.map((tab) => (
            <TabButton
              key={tab.href}
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              active={isActive(pathname, tab.href)}
              badge={tab.href === "/admin/pagos" ? pendingBadge : ""}
            />
          ))}
          <TabButton label="Más" icon={Ellipsis} active={moreActive} onClick={() => setSheet("more")} />
        </nav>
      </div>

      {sheet === "quick" && (
        <Modal title="Crear" subtitle="Acciones rápidas" onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-2">
            {[
              { href: "/admin/horarios?nuevo=1", label: "Programar clase", sub: "Agenda una clase o una serie semanal" },
              { href: "/admin/alumnos?nuevo=1", label: "Nuevo alumno", sub: "Registra a alguien en mostrador" },
              { href: "/admin/alumnos", label: "Dar créditos", sub: "Venta en efectivo o cortesía" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setSheet(null)}
                className="flex min-h-[60px] flex-col justify-center gap-0.5 rounded-2xl bg-[#F3F2EE] px-4 text-ink hover:bg-[#EAE8E3]"
              >
                <span className="text-[15px] font-semibold">{action.label}</span>
                <span className="text-xs text-ink-soft">{action.sub}</span>
              </Link>
            ))}
          </div>
        </Modal>
      )}

      {sheet === "more" && (
        <Modal title="Más" subtitle={tenant.name} onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-4">
            {NAV_GROUPS.slice(1).map((group) => (
              <div key={group.title} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{group.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheet(null)}
                        className={`flex min-h-[76px] flex-col items-start justify-between gap-2 rounded-2xl px-3.5 py-3 ${
                          active ? "bg-brand-50 text-brand-800" : "bg-[#F3F2EE] text-ink hover:bg-[#EAE8E3]"
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <StudentAppLink slug={tenant.slug} variant="row" />
            <button
              onClick={() => signOut(auth)}
              className="h-12 rounded-[14px] border border-ink/[0.12] bg-white text-sm font-semibold text-[#B42318]"
            >
              Cerrar sesión
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StudioLogo({ tenant, className }: { tenant: TenantDoc; className: string }) {
  if (tenant.branding.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tenant.branding.logoUrl} alt={tenant.name} className={`${className} w-auto self-start mix-blend-multiply`} />;
  }
  return <p className="truncate font-display text-lg font-semibold leading-tight text-ink">{tenant.name}</p>;
}

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-[11px] font-bold text-white">
      {children}
    </span>
  );
}

function TabButton({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  const className = `flex min-h-14 flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] text-[11px] font-semibold ${
    active ? "bg-brand-50 text-brand-800" : "text-[#6B6E76]"
  }`;
  const content = (
    <>
      <span className="relative flex">
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.8} />
        {badge && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/** Jumps to Alumnos filtered by the query. ⌘K / Ctrl+K focuses it. */
function HeaderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/admin/alumnos?q=${encodeURIComponent(q)}` : "/admin/alumnos");
    setValue("");
    inputRef.current?.blur();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[42px] max-w-[420px] flex-1 items-center gap-2.5 rounded-xl border border-ink/10 bg-white px-3.5 text-ink-faint focus-within:border-brand-600"
    >
      <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar alumno por nombre, email o teléfono…"
        aria-label="Buscar alumno"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
      />
      <span className="rounded-md bg-[#F3F2EE] px-[7px] py-0.5 text-[11px] font-semibold text-ink-soft">⌘K</span>
    </form>
  );
}
