"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";
import { Search } from "lucide-react";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  formatMoney,
  formatShortDate,
  initials,
  useCreditsByStudent,
  type StudentCredits,
} from "@/lib/admin/data";
import type { PackageDoc, StudentPassDoc, UserDoc } from "@/lib/types/firestore";
import { chipClass, sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewStudentForm } from "@/components/admin/NewStudentForm";
import { useToast } from "@/components/admin/Toast";

interface Student extends UserDoc {
  id: string;
}
interface PackageItem extends PackageDoc {
  id: string;
}
interface Pass extends StudentPassDoc {
  id: string;
}

type Filter = "todos" | "sin" | "vencer" | "cuenta";

const EXPIRING_DAYS = 7;

const FILTERS: { key: Filter; label: string; test: (s: Student, c?: StudentCredits) => boolean }[] = [
  { key: "todos", label: "Todos", test: () => true },
  { key: "sin", label: "Sin créditos", test: (_, c) => !(c && c.credits > 0) },
  {
    key: "vencer",
    label: "Por vencer",
    test: (_, c) =>
      !!c && c.credits > 0 && !!c.nextExpiry && c.nextExpiry.getTime() - Date.now() < EXPIRING_DAYS * 86_400_000,
  },
  { key: "cuenta", label: "Sin cuenta", test: (s) => s.hasAccount === false },
];

function isFilter(value: string | null): value is Filter {
  return FILTERS.some((f) => f.key === value);
}

export default function AlumnosPage() {
  return (
    <Suspense>
      <AlumnosContent />
    </Suspense>
  );
}

function AlumnosContent() {
  const { tenantId } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [filter, setFilter] = useState<Filter>(() => {
    const initial = searchParams.get("filtro");
    return isFilter(initial) ? initial : "todos";
  });
  const toast = useToast();
  const { byStudent: credits } = useCreditsByStudent(tenantId);

  // Header search / quick actions deep-link here with ?q=, ?filtro= or ?nuevo=1.
  const paramQ = searchParams.get("q");
  const paramFilter = searchParams.get("filtro");
  const wantsNew = searchParams.get("nuevo") === "1";
  useEffect(() => {
    if (paramQ !== null) setQ(paramQ);
    if (isFilter(paramFilter)) setFilter(paramFilter);
    if (wantsNew) setCreating(true);
    if (paramQ !== null || paramFilter !== null || wantsNew) router.replace("/admin/alumnos");
  }, [paramQ, paramFilter, wantsNew, router]);

  useEffect(() => {
    const studentsQuery = query(
      collection(db, "users"),
      where("tenantId", "==", tenantId),
      where("role", "==", "student"),
      orderBy("displayName"),
    );
    return onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "packages"), orderBy("name")),
      (snap) => setPackages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PackageDoc) }))),
    );
  }, [tenantId]);

  const needle = q.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const rows = useMemo(
    () =>
      students
        .filter((s) => activeFilter.test(s, credits[s.id]))
        .filter(
          (s) =>
            !needle ||
            `${s.displayName} ${s.email} ${s.phone}`.toLowerCase().includes(needle),
        ),
    [students, credits, activeFilter, needle],
  );

  const managingStudent = managingId ? students.find((s) => s.id === managingId) : undefined;

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Alumnos"
        description={
          loaded
            ? `${students.length} ${students.length === 1 ? "alumno" : "alumnos"} · toca uno para gestionar sus créditos`
            : "Cargando…"
        }
      />

      <div className="-mt-6 flex h-12 items-center gap-2.5 rounded-[14px] border border-ink/[0.12] bg-white px-3.5 focus-within:border-brand-600">
        <Search className="h-[18px] w-[18px] shrink-0 text-ink-faint" strokeWidth={1.8} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono"
          aria-label="Buscar alumno"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
        />
      </div>

      <div className="no-scrollbar -mx-0.5 flex gap-2 overflow-x-auto px-0.5">
        {FILTERS.map((f) => {
          const count = students.filter((s) => f.test(s, credits[s.id])).length;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} className={chipClass(filter === f.key)}>
              {f.label}
              <span className="text-xs font-semibold opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {loaded && students.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-ink/15 px-5 py-10 text-center">
          <p className="text-[15px] font-semibold text-ink">Todavía no tienes alumnos</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Agrega a tu primer alumno, o comparte el link de tu app para que se registren solos.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-ink px-[18px] text-sm font-semibold text-white"
          >
            Agregar mi primer alumno
          </button>
        </div>
      ) : loaded && rows.length === 0 ? (
        <p className="rounded-[22px] border-[1.5px] border-dashed border-ink/15 p-7 text-center text-sm text-ink-soft">
          Sin resultados para esta búsqueda.
        </p>
      ) : (
        <>
          {/* Phones / tablets: tappable list. */}
          <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white lg:hidden">
            {rows.map((student) => {
              const c = credits[student.id];
              return (
                <button
                  key={student.id}
                  onClick={() => setManagingId(student.id)}
                  className="flex min-h-[68px] w-full items-center gap-3 border-b border-ink/[0.06] px-4 py-3.5 text-left text-ink last:border-b-0 hover:bg-[#FAFAF8]"
                >
                  <StudentAvatar name={student.displayName || student.email} hasCredits={!!c && c.credits > 0} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <StudentName student={student} className="text-[15px]" />
                    <span className="truncate text-[13px] text-ink-soft">{contactOf(student)}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <CreditsLabel credits={c} />
                    <span className="text-[11px] text-ink-faint">
                      {c && c.credits > 0 && c.nextExpiry ? `Vencen ${formatShortDate(c.nextExpiry)}` : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop: table. */}
          <div className="hidden overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white lg:block">
            <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_170px] gap-4 border-b border-ink/[0.08] px-5 py-3 text-xs font-semibold uppercase tracking-[0.04em] text-ink-faint">
              <span>Alumno</span>
              <span>Créditos</span>
              <span>Vencen</span>
              <span />
            </div>
            {rows.map((student) => {
              const c = credits[student.id];
              const expiringSoon =
                !!c?.nextExpiry && c.credits > 0 && c.nextExpiry.getTime() - Date.now() < EXPIRING_DAYS * 86_400_000;
              return (
                <div
                  key={student.id}
                  className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_170px] items-center gap-4 border-b border-ink/[0.06] px-5 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar name={student.displayName || student.email} hasCredits={!!c && c.credits > 0} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <StudentName student={student} className="text-sm" />
                      <span className="truncate text-xs text-ink-soft">{contactOf(student)}</span>
                    </div>
                  </div>
                  <CreditsLabel credits={c} />
                  <span
                    className={`text-[13px] ${expiringSoon ? "font-semibold text-amber-800" : "text-ink-soft"}`}
                  >
                    {c && c.credits > 0 && c.nextExpiry ? formatShortDate(c.nextExpiry) : "—"}
                  </span>
                  <button
                    onClick={() => setManagingId(student.id)}
                    className="h-9 justify-self-end rounded-[10px] border border-ink/[0.14] bg-white px-3.5 text-[13px] font-semibold text-ink hover:bg-[#F7F6F3]"
                  >
                    Gestionar
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {creating && (
        <Modal title="Nuevo alumno" subtitle="Para ventas en mostrador o cortesías" onClose={() => setCreating(false)}>
          <NewStudentForm
            onCreated={(student) => {
              setCreating(false);
              toast("Alumno creado");
              setManagingId(student.id);
            }}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}

      {managingStudent && (
        <StudentSheet
          tenantId={tenantId}
          student={managingStudent}
          packages={packages.filter((p) => p.active !== false)}
          accounts={students.filter((s) => s.hasAccount !== false)}
          onClose={() => setManagingId(null)}
        />
      )}
    </div>
  );
}

function contactOf(student: Student) {
  return student.email || student.phone || "Sin datos de contacto";
}

function StudentAvatar({ name, hasCredits }: { name: string; hasCredits: boolean }) {
  return (
    <span
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
        hasCredits ? "bg-brand-50 text-brand-800" : "bg-[#F3F2EE] text-ink-soft"
      }`}
    >
      {initials(name)}
    </span>
  );
}

function StudentName({ student, className }: { student: Student; className: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className={`truncate font-semibold text-ink ${className}`}>{student.displayName || "(sin nombre)"}</span>
      {student.hasAccount === false && (
        <span className="shrink-0 rounded-full bg-amber-100 px-[7px] py-px text-[10px] font-bold text-amber-800">
          Sin cuenta
        </span>
      )}
    </div>
  );
}

function CreditsLabel({ credits }: { credits?: StudentCredits }) {
  const n = credits?.credits ?? 0;
  return (
    <span className={`text-sm font-bold ${n > 0 ? "text-ink" : "text-[#B42318]"}`}>
      {n > 0 ? `${n} ${n === 1 ? "crédito" : "créditos"}` : "Sin créditos"}
    </span>
  );
}

function errorText(err: unknown): string {
  return (err as { message?: string }).message ?? "Ocurrió un error. Intenta de nuevo.";
}

function StudentSheet({
  tenantId,
  student,
  packages,
  accounts,
  onClose,
}: {
  tenantId: string;
  student: Student;
  packages: PackageItem[];
  accounts: Student[];
  onClose: () => void;
}) {
  const [passes, setPasses] = useState<Pass[]>([]);

  useEffect(() => {
    const passesQuery = query(
      collection(db, "tenants", tenantId, "studentPasses"),
      where("studentId", "==", student.id),
      where("status", "==", "active"),
    );
    return onSnapshot(passesQuery, (snapshot) => {
      const now = Date.now();
      setPasses(
        snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as StudentPassDoc) }))
          .filter((p) => p.expiresAt.toMillis() > now),
      );
    });
  }, [tenantId, student.id]);

  const totalCredits = passes.reduce((sum, pass) => sum + pass.remainingCredits, 0);
  const nextExpiry = passes
    .filter((p) => p.remainingCredits > 0)
    .map((p) => p.expiresAt.toDate())
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const phoneDigits = student.phone.replace(/\D/g, "");

  return (
    <Modal title={student.displayName || student.email || "Alumno"} subtitle={contactOf(student)} onClose={onClose}>
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-end justify-between gap-3 rounded-[20px] bg-ink p-[18px] text-white">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-200">Créditos activos</span>
            <span className="font-display text-[44px] font-semibold leading-none">{totalCredits}</span>
          </div>
          <span className="text-right text-[13px] text-white/75">
            {nextExpiry ? `Vencen ${formatShortDate(nextExpiry)}` : "Sin paquete activo"}
          </span>
        </div>

        {passes.length > 1 && (
          <ul className="-mt-2 flex flex-col gap-1 text-[13px] text-ink-soft">
            {passes.map((pass) => (
              <li key={pass.id}>
                {pass.remainingCredits}/{pass.initialCredits} créditos · vence {formatShortDate(pass.expiresAt.toDate())}
              </li>
            ))}
          </ul>
        )}

        <AddCredits tenantId={tenantId} studentId={student.id} packages={packages} />

        {student.hasAccount === false && <NoAccountTools student={student} accounts={accounts} onLinked={onClose} />}

        {phoneDigits && (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/${phoneDigits.length === 10 ? `52${phoneDigits}` : phoneDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-xl bg-[#F3F2EE] text-sm font-semibold text-ink hover:bg-[#EAE8E3]"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${student.phone}`}
              className="flex h-11 items-center justify-center rounded-xl bg-[#F3F2EE] text-sm font-semibold text-ink hover:bg-[#EAE8E3]"
            >
              Llamar
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddCredits({
  tenantId,
  studentId,
  packages,
}: {
  tenantId: string;
  studentId: string;
  packages: PackageItem[];
}) {
  const toast = useToast();
  const [packageId, setPackageId] = useState<string>(packages[0]?.id ?? "custom");
  const [customCredits, setCustomCredits] = useState(1);
  const [customValidityDays, setCustomValidityDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const selectedPackage = packages.find((p) => p.id === packageId);
  const creditAmount = selectedPackage?.creditAmount ?? customCredits;

  async function handleAdd() {
    setSubmitting(true);
    try {
      const validityDays = selectedPackage?.validityDays ?? customValidityDays;
      const expiresAt = Timestamp.fromMillis(Date.now() + validityDays * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, "tenants", tenantId, "studentPasses"), {
        studentId,
        packageId: selectedPackage?.id ?? "manual",
        initialCredits: creditAmount,
        remainingCredits: creditAmount,
        expiresAt,
        status: "active",
      } satisfies StudentPassDoc);

      toast(`${creditAmount} ${creditAmount === 1 ? "crédito agregado" : "créditos agregados"}`);
    } finally {
      setSubmitting(false);
    }
  }

  const tileClass = (selected: boolean) =>
    `flex min-h-[62px] flex-col items-start justify-center gap-0.5 rounded-[14px] px-3 py-2.5 text-left ${
      selected ? "border-[1.5px] border-brand-700 bg-brand-50 text-brand-800" : "border border-ink/[0.12] bg-white text-ink"
    }`;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-semibold text-ink">Dar créditos</span>
      <div className="grid grid-cols-2 gap-2">
        {packages.map((pkg) => (
          <button key={pkg.id} onClick={() => setPackageId(pkg.id)} className={tileClass(packageId === pkg.id)}>
            <span className="text-sm font-semibold">{pkg.name}</span>
            <span className="text-xs opacity-75">
              {formatMoney(pkg.price)} · {pkg.validityDays} días
            </span>
          </button>
        ))}
        <button onClick={() => setPackageId("custom")} className={tileClass(packageId === "custom")}>
          <span className="text-sm font-semibold">Personalizado</span>
          <span className="text-xs opacity-75">Cortesía o pase manual</span>
        </button>
      </div>

      {packageId === "custom" && (
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            Créditos
            <input
              type="number"
              min={1}
              value={customCredits}
              onChange={(e) => setCustomCredits(Math.max(1, Number(e.target.value)))}
              className={sheetInputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            Vigencia (días)
            <input
              type="number"
              min={1}
              value={customValidityDays}
              onChange={(e) => setCustomValidityDays(Math.max(1, Number(e.target.value)))}
              className={sheetInputClass}
            />
          </label>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={submitting}
        className="h-[50px] rounded-[14px] bg-brand-700 text-[15px] font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : `Agregar ${creditAmount} ${creditAmount === 1 ? "crédito" : "créditos"}`}
      </button>
    </div>
  );
}

/** Tools that only make sense for a student the studio created by hand. */
function NoAccountTools({
  student,
  accounts,
  onLinked,
}: {
  student: Student;
  accounts: Student[];
  onLinked: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      setMessage(await action());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function link() {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    const name = target.displayName || target.email;
    if (
      !window.confirm(
        `Se moverán las reservas, créditos e historial de ${student.displayName} a la cuenta de ${name}, y este perfil se eliminará. ¿Continuar?`,
      )
    ) {
      return;
    }
    await run(async () => {
      await httpsCallable(functions, "linkStudentProfile")({ profileId: student.id, accountId });
      onLinked();
      return "Vinculado.";
    });
  }

  const amberButton =
    "h-[42px] rounded-xl border border-amber-800/30 bg-white px-3 text-[13px] font-semibold text-amber-900 disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#FEF7E6] p-4">
      <p className="text-sm font-semibold text-amber-900">Este alumno no tiene cuenta</p>
      <p className="text-[13px] leading-normal text-amber-800">
        Si ya se registró en la app, vincula su cuenta para conservar reservas y créditos.
      </p>
      <div className="flex gap-2">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          aria-label="Cuenta a vincular"
          className="h-[42px] min-w-0 flex-1 rounded-xl border border-amber-800/30 bg-white px-3 text-[13px] text-ink"
        >
          <option value="">Elige su cuenta registrada…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName || "(sin nombre)"} · {a.email}
            </option>
          ))}
        </select>
        <button className={amberButton} disabled={!accountId || busy} onClick={link}>
          Vincular
        </button>
      </div>
      <button
        className={amberButton}
        disabled={busy}
        onClick={() =>
          run(async () => {
            const { data } = await httpsCallable<{ studentId: string }, { alreadySigned: boolean }>(
              functions,
              "recordPaperWaiver",
            )({ studentId: student.id });
            return data.alreadySigned
              ? "Ya tenía la responsiva vigente registrada."
              : "Responsiva firmada en papel registrada.";
          })
        }
      >
        Registrar responsiva en papel
      </button>
      {message && <p className="text-sm text-brand-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
