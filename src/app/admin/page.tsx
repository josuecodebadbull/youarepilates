"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Timestamp,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Check } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  confirmPurchaseIntent,
  formatMoney,
  formatTime,
  initials,
  useCreditsByStudent,
  usePendingIntents,
  type PurchaseIntent,
} from "@/lib/admin/data";
import type {
  BranchDoc,
  ClassTypeDoc,
  InstructorDoc,
  PackageDoc,
  RoomDoc,
  ScheduleDoc,
  UserDoc,
} from "@/lib/types/firestore";
import { StudentAppLink } from "@/components/admin/StudentAppLink";
import { ClassRow } from "@/components/admin/ClassRow";
import { ClassRosterModal } from "@/components/admin/ClassRosterModal";
import { useToast } from "@/components/admin/Toast";
import { pageTitleClass } from "@/components/ui/PageHeader";

interface Schedule extends ScheduleDoc {
  id: string;
}
interface Student extends UserDoc {
  id: string;
}

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <AdminDashboardContent />
    </Suspense>
  );
}

function greeting(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function AdminDashboardContent() {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const justCreatedSlug = searchParams.get("welcome");

  const [branches, setBranches] = useState<BranchDoc[]>([]);
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
  const [instructors, setInstructors] = useState<Record<string, InstructorDoc>>({});
  const [packages, setPackages] = useState<PackageDoc[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [nextSchedule, setNextSchedule] = useState<Schedule | null>(null);
  const [nextRoom, setNextRoom] = useState<RoomDoc | null>(null);
  const [rosterId, setRosterId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { intents: pending } = usePendingIntents(tenantId);
  const { byStudent: credits, loaded: creditsLoaded } = useCreditsByStudent(tenantId);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "branches"), (snap) =>
      setBranches(snap.docs.map((d) => d.data() as BranchDoc)),
    );
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "classTypes"), (snap) => {
      const next: Record<string, ClassTypeDoc> = {};
      snap.docs.forEach((d) => (next[d.id] = d.data() as ClassTypeDoc));
      setClassTypes(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "instructors"), (snap) => {
      const next: Record<string, InstructorDoc> = {};
      snap.docs.forEach((d) => (next[d.id] = d.data() as InstructorDoc));
      setInstructors(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "packages"), (snap) =>
      setPackages(snap.docs.map((d) => d.data() as PackageDoc)),
    );
  }, [tenantId]);

  useEffect(() => {
    const studentsQuery = query(
      collection(db, "users"),
      where("tenantId", "==", tenantId),
      where("role", "==", "student"),
      orderBy("displayName"),
    );
    return onSnapshot(studentsQuery, (snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }))),
    );
  }, [tenantId]);

  useEffect(() => {
    async function loadUpcomingCount() {
      const snap = await getCountFromServer(
        query(
          collection(db, "tenants", tenantId, "schedules"),
          where("status", "==", "scheduled"),
          where("startAt", ">=", Timestamp.now()),
        ),
      );
      setUpcomingCount(snap.data().count);
    }
    loadUpcomingCount();
  }, [tenantId]);

  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("status", "==", "scheduled"),
      where("startAt", ">=", Timestamp.fromDate(startOfDay)),
      where("startAt", "<", Timestamp.fromDate(endOfDay)),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(todayQuery, (snap) =>
      setTodaySchedules(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ScheduleDoc) }))),
    );
  }, [tenantId]);

  useEffect(() => {
    const nextQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("status", "==", "scheduled"),
      where("startAt", ">=", Timestamp.now()),
      orderBy("startAt", "asc"),
      limit(1),
    );
    return onSnapshot(nextQuery, (snap) => {
      const d = snap.docs[0];
      setNextSchedule(d ? { id: d.id, ...(d.data() as ScheduleDoc) } : null);
    });
  }, [tenantId]);

  const nextRoomPath = nextSchedule ? `${nextSchedule.branchId}/${nextSchedule.roomId}` : null;
  useEffect(() => {
    if (!nextRoomPath) return;
    const [branchId, roomId] = nextRoomPath.split("/");
    let cancelled = false;
    getDoc(doc(db, "tenants", tenantId, "branches", branchId!, "rooms", roomId!)).then((snap) => {
      if (!cancelled) setNextRoom(snap.exists() ? (snap.data() as RoomDoc) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, nextRoomPath]);

  const studentsById = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);

  const bookedToday = todaySchedules.reduce((sum, s) => sum + s.bookedCount, 0);
  const capacityToday = todaySchedules.reduce((sum, s) => sum + s.capacity, 0);
  const waitingToday = todaySchedules.reduce((sum, s) => sum + s.waitlistCount, 0);
  const fullToday = todaySchedules.filter((s) => s.bookedCount >= s.capacity).length;
  const pendingAmount = pending.reduce((sum, p) => sum + p.price, 0);
  const noCredits = students.filter((s) => !((credits[s.id]?.credits ?? 0) > 0)).length;

  const kpis = [
    {
      label: "Reservas hoy",
      value: String(bookedToday),
      sub: capacityToday ? `${Math.round((bookedToday / capacityToday) * 100)}% de ocupación` : "Sin clases hoy",
      color: "text-brand-700",
      href: "/admin/horarios",
    },
    {
      label: "Por confirmar",
      value: String(pending.length),
      sub: pending.length ? `${formatMoney(pendingAmount)} en caja` : "Todo al día",
      color: pending.length ? "text-amber-800" : "text-brand-700",
      href: "/admin/pagos",
    },
    {
      label: "Lista de espera",
      value: String(waitingToday),
      sub: fullToday ? `En ${plural(fullToday, "clase llena", "clases llenas")}` : "Hay lugares hoy",
      color: "text-ink-soft",
      href: "/admin/horarios",
    },
    {
      label: "Sin créditos",
      value: creditsLoaded ? String(noCredits) : "—",
      sub: noCredits ? "Ofréceles un paquete" : "Todos con créditos",
      color: noCredits ? "text-[#B42318]" : "text-brand-700",
      href: "/admin/alumnos?filtro=sin",
    },
  ];

  const setupSteps = [
    { label: "Agrega una sede con al menos una sala", done: branches.length > 0, href: "/admin/sedes" },
    { label: "Crea un tipo de clase", done: Object.keys(classTypes).length > 0, href: "/admin/tipos-de-clase" },
    { label: "Agrega un instructor", done: Object.keys(instructors).length > 0, href: "/admin/instructores" },
    { label: "Crea un paquete de créditos", done: packages.length > 0, href: "/admin/paquetes" },
  ];
  const setupIncomplete = setupSteps.some((step) => !step.done);

  const catalog = [
    { label: "Sedes", value: branches.length, href: "/admin/sedes" },
    { label: "Tipos de clase", value: Object.keys(classTypes).length, href: "/admin/tipos-de-clase" },
    { label: "Instructores", value: Object.keys(instructors).length, href: "/admin/instructores" },
    { label: "Paquetes", value: packages.length, href: "/admin/paquetes" },
    { label: "Alumnos", value: students.length, href: "/admin/alumnos" },
    { label: "Clases próximas", value: upcomingCount, href: "/admin/horarios" },
  ];

  const rosterSchedule = rosterId
    ? [...todaySchedules, ...(nextSchedule ? [nextSchedule] : [])].find((s) => s.id === rosterId)
    : undefined;

  async function handleConfirm(intent: PurchaseIntent) {
    setConfirmingId(intent.id);
    try {
      await confirmPurchaseIntent(tenantId, intent);
      const name = studentsById[intent.studentId]?.displayName?.split(" ")[0] ?? "el alumno";
      toast(`Pago confirmado · ${intent.packageName} para ${name}`);
    } finally {
      setConfirmingId(null);
    }
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      {justCreatedSlug && <WelcomeBanner slug={justCreatedSlug} />}

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{dateLabel}</p>
        <h1 className={pageTitleClass}>
          {greeting(now.getHours())}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-[15px] text-ink-soft">
          Hoy tienes {plural(todaySchedules.length, "clase", "clases")}, {plural(bookedToday, "reserva", "reservas")} y{" "}
          {plural(pending.length, "pago", "pagos")} por confirmar.
        </p>
      </div>

      {setupIncomplete && <SetupChecklist steps={setupSteps} />}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <NextClassCard
          schedule={nextSchedule}
          room={nextRoom}
          classType={nextSchedule ? classTypes[nextSchedule.classTypeId] : undefined}
          instructor={nextSchedule ? instructors[nextSchedule.instructorId] : undefined}
          onOpen={() => nextSchedule && setRosterId(nextSchedule.id)}
        />
        <div className="grid min-w-0 grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="flex min-w-0 flex-col gap-1.5 rounded-[20px] border border-ink/[0.08] bg-white p-4 text-ink transition-colors hover:border-ink/[0.16]"
            >
              <span className="text-[13px] text-ink-soft">{kpi.label}</span>
              <span className="font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em]">
                {kpi.value}
              </span>
              <span className={`text-xs font-semibold ${kpi.color}`}>{kpi.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          <SectionHeader title="Clases de hoy" href="/admin/horarios" linkLabel="Ver semana" />
          {todaySchedules.length > 0 ? (
            <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white">
              {todaySchedules.map((schedule) => (
                <ClassRow
                  key={schedule.id}
                  schedule={schedule}
                  classType={classTypes[schedule.classTypeId]}
                  instructor={instructors[schedule.instructorId]}
                  onClick={() => setRosterId(schedule.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-ink/15 px-5 py-8 text-center">
              <p className="text-[15px] font-semibold text-ink">No hay clases hoy</p>
              <Link
                href="/admin/horarios?nuevo=1"
                className="flex h-11 items-center rounded-xl bg-ink px-[18px] text-sm font-semibold text-white"
              >
                Programar clase
              </Link>
            </div>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="flex flex-col gap-3">
            <SectionHeader title="Por confirmar" href="/admin/pagos" linkLabel="Ver pagos" />
            {pending.length > 0 ? (
              <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white">
                {pending.slice(0, 4).map((intent) => {
                  const name = studentsById[intent.studentId]?.displayName || "Alumno";
                  return (
                    <div
                      key={intent.id}
                      className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-3.5 last:border-b-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDEBE6] text-[13px] font-bold">
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        <p className="text-xs text-ink-soft">
                          {intent.packageName} · {formatMoney(intent.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfirm(intent)}
                        disabled={confirmingId === intent.id}
                        className="h-[38px] rounded-[10px] bg-brand-700 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                      >
                        {confirmingId === intent.id ? "…" : "Confirmar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-[22px] bg-brand-50 p-[22px] text-sm font-medium text-brand-800">
                Todo al día. No hay pagos pendientes.
              </p>
            )}
          </section>
          <StudentAppLink slug={tenant.slug} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] font-semibold text-ink">Tu estudio</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {catalog.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between gap-2.5 rounded-2xl border border-ink/[0.08] bg-white px-4 py-3.5 text-ink transition-colors hover:border-ink/[0.16]"
            >
              <span className="text-sm text-ink-soft">{item.label}</span>
              <span className="text-lg font-bold">{item.value ?? "—"}</span>
            </Link>
          ))}
        </div>
      </section>

      {rosterSchedule && (
        <ClassRosterModal
          tenantId={tenantId}
          scheduleId={rosterSchedule.id}
          schedule={rosterSchedule}
          classType={classTypes[rosterSchedule.classTypeId]}
          instructor={instructors[rosterSchedule.instructorId]}
          onClose={() => setRosterId(null)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[22px] font-semibold text-ink">{title}</h2>
      <Link href={href} className="py-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
        {linkLabel}
      </Link>
    </div>
  );
}

function relativeStart(start: Date): string {
  const minutes = Math.round((start.getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return "empieza ya";
  if (minutes < 60) return `en ${minutes} min`;
  const today = new Date();
  if (start.toDateString() === today.toDateString()) return `en ${Math.round(minutes / 60)} h`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (start.toDateString() === tomorrow.toDateString()) return "mañana";
  return start.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }).replace(".", "");
}

function NextClassCard({
  schedule,
  room,
  classType,
  instructor,
  onOpen,
}: {
  schedule: Schedule | null;
  room: RoomDoc | null;
  classType?: ClassTypeDoc;
  instructor?: InstructorDoc;
  onOpen: () => void;
}) {
  if (!schedule) {
    return (
      <div className="flex min-w-0 flex-col justify-between gap-4 rounded-3xl bg-ink p-[22px] text-white">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-200">Siguiente clase</span>
        <p className="font-display text-2xl font-semibold">No hay clases próximas</p>
        <Link
          href="/admin/horarios?nuevo=1"
          className="flex h-[34px] items-center self-start rounded-full bg-white px-3.5 text-[13px] font-semibold text-ink"
        >
          Programar clase
        </Link>
      </div>
    );
  }

  const start = schedule.startAt.toDate();
  const minutes = Math.round((schedule.endAt.toMillis() - schedule.startAt.toMillis()) / 60_000);
  const spots =
    room && schedule.roomId
      ? room.spots
          .map((s) => s.spotNumber)
          .filter((n) => !room.blockedSpots.includes(n))
          .sort((a, b) => a - b)
      : Array.from({ length: schedule.capacity }, (_, i) => i + 1);
  const taken = new Set(schedule.takenSpots);

  return (
    <button
      onClick={onOpen}
      className="flex min-w-0 flex-col gap-[18px] rounded-3xl bg-ink p-[22px] text-left text-white"
    >
      <div className="flex items-center justify-between gap-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-200">
          <span className="h-[7px] w-[7px] rounded-full bg-brand-400" />
          Siguiente · {relativeStart(start)}
        </span>
        {room && <span className="truncate text-[13px] font-semibold text-white/70">{room.name}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-display text-[34px] font-semibold leading-none tracking-[-0.02em]">{formatTime(start)}</span>
        <span className="text-[17px] font-semibold">{classType?.name ?? "Clase"}</span>
        <span className="text-sm text-white/70">
          {instructor ? `${instructor.name} · ` : ""}
          {minutes} min
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-8 gap-1.5">
          {spots.map((n) => (
            <span
              key={n}
              className={`flex h-[26px] items-center justify-center rounded-lg text-[11px] font-bold ${
                taken.has(n) ? "bg-brand-400 text-[#0F2E28]" : "bg-white/10 text-white/60"
              }`}
            >
              {n}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="text-white/80">
            <strong className="text-white">
              {schedule.bookedCount} de {schedule.capacity}
            </strong>{" "}
            camas reservadas
          </span>
          <span className="flex h-[34px] shrink-0 items-center rounded-full bg-white px-3.5 font-semibold text-ink">
            Ver lista
          </span>
        </div>
      </div>
    </button>
  );
}

function SetupChecklist({ steps }: { steps: { label: string; done: boolean; href: string }[] }) {
  return (
    <section className="rounded-[22px] border border-amber-200 bg-[#FEF7E6] p-5">
      <h2 className="text-xl font-semibold text-amber-900">Termina de configurar tu estudio</h2>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                step.done ? "bg-brand-700 text-white" : "border border-amber-300 bg-white"
              }`}
              aria-hidden
            >
              {step.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {step.done ? (
              <span className="text-amber-800 line-through decoration-amber-400">{step.label}</span>
            ) : (
              <Link href={step.href} className="font-medium text-amber-900 underline">
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WelcomeBanner({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-brand-200 bg-brand-50 p-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-900">¡Tu estudio está listo!</h2>
        <p className="mt-1 text-sm text-brand-800">
          Siguiente paso: agrega una sede y un paquete de créditos. Cuando estés list@, comparte este link con tus
          alumnos para que reserven sus clases (también lo tienes siempre a la mano en el menú).
        </p>
      </div>
      <StudentAppLink slug={slug} />
    </div>
  );
}
