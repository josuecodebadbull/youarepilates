"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Tag as TagIcon,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Static, illustrative previews of the admin panel and the student app for the landing
 * page. They use sample data (never a real studio's) and are drawn at their native size
 * then scaled down to fit, so they look like screenshots but stay crisp at any width.
 */

export function ScaledFrame({
  width,
  height,
  className = "",
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry!.contentRect.width / width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ height: height * scale }} aria-hidden>
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{ width, height, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}

/** A phone bezel around a 390×800 screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[800px] w-[390px] rounded-[52px] bg-ink p-3">
      <div className="h-full w-full overflow-hidden rounded-[40px] bg-canvas">{children}</div>
    </div>
  );
}

const LOGO = "/landing/logo-estudio.png";
const PHOTO = "/landing/sala.png";

// ─── Sample data ──────────────────────────────────────────────────────────────

const LEVELS = {
  basico: { label: "Básico", badge: "bg-gray-100 text-gray-700" },
  intermedio: { label: "Intermedio", badge: "bg-blue-100 text-blue-700" },
  avanzado: { label: "Avanzado", badge: "bg-purple-100 text-purple-700" },
  embarazo: { label: "Pre y postnatal", badge: "bg-pink-100 text-pink-700" },
} as const;

const TODAY = [
  { time: "07:00", name: "Reformer Básico", level: "basico", instr: "Ana Ruiz", booked: 8, cap: 8, live: true },
  { time: "08:00", name: "Reformer Intermedio", level: "intermedio", instr: "Mariana López", booked: 6, cap: 8 },
  { time: "09:30", name: "Reformer Básico", level: "basico", instr: "Ana Ruiz", booked: 3, cap: 8 },
  { time: "18:00", name: "Pre y Postnatal", level: "embarazo", instr: "Sofía Hernández", booked: 5, cap: 6 },
  { time: "19:00", name: "Reformer Intermedio", level: "intermedio", instr: "Mariana López", booked: 8, cap: 8, wait: 1 },
] as const;

const PENDING = [
  { name: "Daniela Torres", pkg: "8 clases", price: "$1,450" },
  { name: "Renata Vega", pkg: "Clase suelta", price: "$220" },
  { name: "Jorge Méndez", pkg: "12 clases", price: "$1,950" },
];

const KPIS = [
  { label: "Reservas hoy", value: "34", sub: "74% de ocupación", color: "text-brand-700" },
  { label: "Por confirmar", value: "3", sub: "$3,620 en caja", color: "text-amber-800" },
  { label: "Lista de espera", value: "3", sub: "En 2 clases llenas", color: "text-ink-soft" },
  { label: "Sin créditos", value: "3", sub: "Ofréceles un paquete", color: "text-[#B42318]" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function Badge({ level }: { level: keyof typeof LEVELS }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVELS[level].badge}`}>{LEVELS[level].label}</span>;
}

function ClassLine({ c, card }: { c: (typeof TODAY)[number]; card?: boolean }) {
  const full = c.booked >= c.cap;
  const wait = "wait" in c ? c.wait : 0;
  return (
    <div
      className={`flex gap-3.5 text-ink ${
        card ? "rounded-[20px] border border-ink/[0.08] bg-white p-4" : "border-b border-ink/[0.06] px-[18px] py-4"
      } ${"live" in c && c.live && !card ? "bg-[#F6FAF9]" : ""}`}
    >
      <div className="flex w-[52px] shrink-0 flex-col gap-0.5">
        <span className="text-[15px] font-bold tabular-nums">{c.time}</span>
        <span className="text-xs text-ink-faint">50 min</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold">{c.name}</span>
          <Badge level={c.level} />
          {"live" in c && c.live && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">En curso</span>
          )}
        </div>
        <span className="text-[13px] text-ink-soft">{c.instr}</span>
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0EEE9]">
            <div className={`h-full rounded-full ${full ? "bg-ink" : "bg-brand-500"}`} style={{ width: `${(c.booked / c.cap) * 100}%` }} />
          </div>
          <span className={`whitespace-nowrap text-xs font-semibold ${full ? "text-ink" : "text-ink-soft"}`}>
            {full ? (wait ? `Llena · ${wait} en espera` : "Llena") : `${c.booked}/${c.cap}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function NextClassCard() {
  return (
    <div className="flex min-w-0 flex-col gap-[18px] rounded-3xl bg-ink p-[22px] text-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-200">
          <span className="h-[7px] w-[7px] rounded-full bg-brand-400" />
          Siguiente · en 15 min
        </span>
        <span className="text-[13px] font-semibold text-white/70">Sala Principal</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-display text-[34px] font-semibold leading-none tracking-[-0.02em]">08:00</span>
        <span className="text-[17px] font-semibold">Reformer Intermedio</span>
        <span className="text-sm text-white/70">Mariana López · 50 min</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className={`flex h-[26px] items-center justify-center rounded-lg text-[11px] font-bold ${
                i < 6 ? "bg-brand-400 text-[#0F2E28]" : "bg-white/10 text-white/60"
              }`}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-white/80">
            <strong className="text-white">6 de 8</strong> camas reservadas
          </span>
          <span className="flex h-[34px] items-center rounded-full bg-white px-3.5 font-semibold text-ink">Ver lista</span>
        </div>
      </div>
    </div>
  );
}

function KpiGrid() {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3">
      {KPIS.map((k) => (
        <div key={k.label} className="flex min-w-0 flex-col gap-1.5 rounded-[20px] border border-ink/[0.08] bg-white p-4">
          <span className="text-[13px] text-ink-soft">{k.label}</span>
          <span className="font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em]">{k.value}</span>
          <span className={`text-xs font-semibold ${k.color}`}>{k.sub}</span>
        </div>
      ))}
    </div>
  );
}

function Greeting({ big }: { big?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Miércoles 23 de septiembre</span>
      <span className={`font-display font-semibold leading-[1.05] tracking-[-0.02em] ${big ? "text-[40px]" : "text-[32px]"}`}>
        Buenos días, Karla
      </span>
      <span className="text-[15px] text-ink-soft">Hoy tienes 6 clases, 34 reservas y 3 pagos por confirmar.</span>
    </div>
  );
}

// ─── Admin panel, desktop (1280×800) ──────────────────────────────────────────

const NAV = [
  { title: "Operación", items: [["Resumen", LayoutGrid], ["Horarios", CalendarDays], ["Alumnos", Users], ["Pagos", Wallet]] },
  { title: "Catálogo", items: [["Sedes", MapPin], ["Tipos de clase", Layers], ["Instructores", UserRound], ["Paquetes", Package]] },
  { title: "Estudio", items: [["Perfil del estudio", Store], ["Responsiva", FilePen], ["Configuración", SlidersHorizontal]] },
] as const;

export function AdminDesktopMock() {
  return (
    <div className="flex h-[800px] w-[1280px] bg-canvas font-sans text-ink">
      <aside className="flex w-[264px] shrink-0 flex-col border-r border-ink/[0.08] bg-white">
        <div className="flex flex-col gap-2.5 border-b border-ink/[0.06] px-5 pb-[18px] pt-[22px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="" className="h-7 w-auto self-start mix-blend-multiply" />
          <span className="text-xs text-ink-faint">Tu estudio · Panel</span>
        </div>
        <nav className="flex flex-col gap-[18px] px-3 py-3.5">
          {NAV.map((g) => (
            <div key={g.title} className="flex flex-col gap-0.5">
              <span className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{g.title}</span>
              {g.items.map(([label, Icon], i) => {
                const active = g.title === "Operación" && i === 0;
                return (
                  <span
                    key={label}
                    className={`flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-sm ${
                      active ? "bg-brand-50 font-semibold text-brand-800" : "font-medium text-ink-soft"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    <span className="flex-1">{label}</span>
                    {label === "Pagos" && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1.5 text-[11px] font-bold text-white">
                        3
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 px-5 pb-[18px]">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-xs font-bold text-white">KR</span>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">Karla Ramírez</div>
            <div className="text-xs text-ink-faint">Dueña</div>
          </div>
          <LogOut className="h-[18px] w-[18px] text-ink-soft" strokeWidth={1.8} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-ink/[0.07] px-10">
          <span className="flex h-[42px] w-[420px] items-center gap-2.5 rounded-xl border border-ink/10 bg-white px-3.5 text-sm text-ink-faint">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Buscar alumno, clase o pago…
          </span>
          <div className="flex gap-2">
            <span className="flex h-[42px] items-center rounded-xl border border-ink/[0.14] bg-white px-4 text-sm font-semibold">
              Nuevo alumno
            </span>
            <span className="flex h-[42px] items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              Programar clase
            </span>
          </div>
        </header>
        <div className="flex flex-col gap-6 overflow-hidden px-10 pt-8">
          <Greeting big />
          <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-3">
            <NextClassCard />
            <KpiGrid />
          </div>
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-5">
            <div className="flex flex-col gap-3">
              <span className="font-display text-[22px] font-semibold">Clases de hoy</span>
              <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white">
                {TODAY.slice(0, 3).map((c) => (
                  <ClassLine key={c.time} c={c} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-display text-[22px] font-semibold">Por confirmar</span>
              <PendingList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingList({ limit = 3, big }: { limit?: number; big?: boolean }) {
  return (
    <div className={big ? "flex flex-col gap-2.5" : "overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white"}>
      {PENDING.slice(0, limit).map((p) => (
        <div
          key={p.name}
          className={`flex items-center gap-3 ${
            big ? "flex-wrap rounded-[20px] border border-ink/[0.08] bg-white p-4" : "border-b border-ink/[0.06] px-4 py-3.5"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDEBE6] text-[13px] font-bold">
            {initials(p.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="text-xs text-ink-soft">
              {p.pkg} · {p.price}
            </div>
          </div>
          <span className="flex h-[38px] items-center rounded-[10px] bg-brand-700 px-3.5 text-[13px] font-semibold text-white">
            Confirmar
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Admin panel, phone (390×800) ─────────────────────────────────────────────

export type AdminPhoneScreen = "resumen" | "sedes" | "horarios" | "perfil" | "pagos";

const TABS = [
  ["Hoy", LayoutGrid, "resumen"],
  ["Horarios", CalendarDays, "horarios"],
  ["Alumnos", Users, "alumnos"],
  ["Pagos", Wallet, "pagos"],
  ["Más", Ellipsis, "mas"],
] as const;

export function AdminPhoneMock({ screen = "resumen" }: { screen?: AdminPhoneScreen }) {
  const activeTab = screen === "sedes" || screen === "perfil" ? "mas" : screen;
  return (
    <div className="flex h-full flex-col bg-canvas font-sans text-ink">
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-ink/[0.07] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" className="h-6 w-auto mix-blend-multiply" />
        <div className="flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-ink text-white">
            <Plus className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDEBE6] text-[13px] font-bold">KR</span>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-4 pt-[22px]">
        {screen === "resumen" && (
          <div className="flex flex-col gap-5">
            <Greeting />
            <NextClassCard />
            <KpiGrid />
          </div>
        )}
        {screen === "horarios" && (
          <div className="flex flex-col gap-4">
            <PhoneTitle title="Horarios" sub="Cupos en vivo conforme tus alumnos reservan." />
            <div className="grid grid-cols-7 gap-1.5">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
                <span
                  key={d}
                  className={`flex h-[66px] flex-col items-center justify-center gap-0.5 rounded-2xl ${
                    i === 2 ? "bg-ink text-white" : "border border-ink/[0.08] bg-white"
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-75">{d}</span>
                  <span className="text-[17px] font-bold">{21 + i}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {TODAY.slice(1, 5).map((c) => (
                <ClassLine key={c.time} c={c} card />
              ))}
            </div>
          </div>
        )}
        {screen === "pagos" && (
          <div className="flex flex-col gap-4">
            <PhoneTitle title="Pagos" sub="Confírmalos cuando recibas el pago: los créditos se asignan al instante." />
            <span className="font-display text-xl font-semibold">Por confirmar</span>
            <PendingList big />
          </div>
        )}
        {screen === "sedes" && (
          <div className="flex flex-col gap-4">
            <PhoneTitle title="Sedes" sub="Tus sucursales, sus salas y sus camas." />
            <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO} alt="" className="aspect-video w-full object-cover" />
              <div className="flex flex-col gap-2.5 px-[18px] pb-[18px] pt-4">
                <span className="text-base font-bold">Sucursal Condesa</span>
                <span className="text-[13px] text-ink-soft">Av. Michoacán 123, Roma Norte, CDMX</span>
                <div className="flex gap-1.5">
                  <span className="rounded-full bg-[#F3F2EE] px-2.5 py-1 text-xs font-semibold">2 salas</span>
                  <span className="rounded-full bg-[#F3F2EE] px-2.5 py-1 text-xs font-semibold">14 camas</span>
                </div>
              </div>
            </div>
            <span className="flex h-[120px] items-center justify-center rounded-[22px] border-[1.5px] border-dashed border-ink/[0.18] text-sm font-semibold text-ink-soft">
              + Nueva sede
            </span>
          </div>
        )}
        {screen === "perfil" && (
          <div className="flex flex-col gap-3.5">
            <PhoneTitle title="Perfil del estudio" sub="Lo que tus alumnos ven en “Estudio”." />
            <div className="flex flex-col gap-3 rounded-[22px] border border-ink/[0.08] bg-white p-5">
              <span className="text-[15px] font-bold">Foto principal</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
            </div>
            <div className="flex flex-col gap-2 rounded-[22px] border border-ink/[0.08] bg-white p-5">
              <span className="text-[15px] font-bold">Amenidades</span>
              <div className="flex flex-wrap gap-2">
                {["Regaderas", "Lockers", "Wi-Fi", "Agua purificada"].map((a) => (
                  <span key={a} className="rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-800">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="flex shrink-0 gap-0.5 border-t border-ink/[0.08] bg-white px-2.5 pb-3 pt-2">
        {TABS.map(([label, Icon, key]) => {
          const active = activeTab === key;
          return (
            <span
              key={key}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-[3px] rounded-[14px] text-[11px] font-semibold ${
                active ? "bg-brand-50 text-brand-800" : "text-[#6B6E76]"
              }`}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.8} />
                {key === "pagos" && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                    3
                  </span>
                )}
              </span>
              {label}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

function PhoneTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em]">{title}</span>
      <span className="text-sm text-ink-soft">{sub}</span>
    </div>
  );
}

// ─── Student app, "Estudio" page (phone) ──────────────────────────────────────

export function StudentStudioMock() {
  return (
    <div className="relative flex h-full flex-col bg-canvas font-sans text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink/[0.07] px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" className="h-[30px] w-auto mix-blend-multiply" />
        <span className="flex h-10 items-center rounded-full border border-ink/[0.18] bg-white px-4 text-sm font-semibold">
          Ingresar
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-5 pt-6">
        <div className="flex flex-col gap-3.5">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Pilates Reformer · Roma Norte, CDMX
          </span>
          <span className="font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.025em]">Tu estudio de Pilates</span>
          <span className="text-base leading-relaxed text-ink-soft">
            Clases de Pilates Reformer en grupos reducidos para todos los niveles.
          </span>
        </div>
        <div className="flex gap-2.5">
          <span className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] bg-ink text-[15px] font-semibold text-white">
            Reservar clase →
          </span>
          <span className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] border border-ink/[0.14] bg-white text-[15px] font-semibold">
            Ver precios
          </span>
        </div>
        <div className="flex gap-2">
          {["WhatsApp", "Instagram", "Email"].map((s) => (
            <span key={s} className="flex h-10 items-center rounded-full border border-ink/10 bg-white px-3.5 text-[13px] font-semibold">
              {s}
            </span>
          ))}
        </div>
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-[22px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/55 to-transparent" />
          <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between text-white">
            <span className="text-[13px] font-semibold leading-tight">
              Sala de reformers
              <br />
              <span className="font-medium opacity-90">Sucursal Condesa</span>
            </span>
            <span className="flex h-9 items-center rounded-full bg-white/95 px-3.5 text-[13px] font-semibold text-ink">Ver fotos</span>
          </div>
        </div>
      </div>
      <nav className="absolute inset-x-3 bottom-3">
        <div className="flex gap-1 rounded-[22px] border border-ink/[0.08] bg-white p-1.5 shadow-[0_10px_30px_-10px_rgba(22,24,29,0.25)]">
          {[
            ["Reservar", CalendarDays, false],
            ["Precios", TagIcon, false],
            ["Estudio", MapPin, true],
          ].map(([label, Icon, active]) => {
            const I = Icon as typeof MapPin;
            return (
              <span
                key={label as string}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl text-[11px] font-semibold ${
                  active ? "bg-ink text-white" : "text-[#6b6e76]"
                }`}
              >
                <I className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.8} />
                {label as string}
              </span>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
