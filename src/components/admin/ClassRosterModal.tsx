"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Search, UserPlus, X } from "lucide-react";

import { db, functions } from "@/lib/firebase/client";
import type {
  BookingDoc,
  ClassTypeDoc,
  InstructorDoc,
  ScheduleDoc,
  StudentPassDoc,
  UserDoc,
  WaitlistEntryDoc,
} from "@/lib/types/firestore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NewStudentForm, type CreatedStudent } from "@/components/admin/NewStudentForm";

interface Student extends UserDoc {
  id: string;
}
interface Booking extends BookingDoc {
  id: string;
}
interface WaitlistEntry extends WaitlistEntryDoc {
  id: string;
}

interface ClassRosterModalProps {
  tenantId: string;
  scheduleId: string;
  schedule: ScheduleDoc;
  classType?: ClassTypeDoc;
  instructor?: InstructorDoc;
  onClose: () => void;
}

const OVERRIDE_LABELS: Record<string, string> = {
  no_credits: "sin créditos",
  waiver: "sin responsiva",
  advanced_level: "nivel avanzado sin validar",
};

interface CallableError {
  message?: string;
  details?: { overridable?: boolean };
}

function errorMessage(error: unknown): string {
  return (error as CallableError).message ?? "Ocurrió un error. Intenta de nuevo.";
}

/**
 * Admin view of one class: who is booked, who is waiting, and the counter operations
 * (book a student, cancel a booking). All writes go through the same Cloud Functions the
 * student app uses so capacity and credits stay consistent.
 */
export function ClassRosterModal({
  tenantId,
  scheduleId,
  schedule,
  classType,
  instructor,
  onClose,
}: ClassRosterModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [creditsByStudent, setCreditsByStudent] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, "users"),
        where("tenantId", "==", tenantId),
        where("role", "==", "student"),
        orderBy("displayName"),
      ),
      (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }))),
    );
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "bookings"), where("scheduleId", "==", scheduleId)),
      (snap) => setBookings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) }))),
    );
  }, [tenantId, scheduleId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "waitlist"), where("scheduleId", "==", scheduleId)),
      (snap) =>
        setWaitlist(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as WaitlistEntryDoc) }))
            .sort((a, b) => a.position - b.position),
        ),
    );
  }, [tenantId, scheduleId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "studentPasses"), where("status", "==", "active")),
      (snap) => {
        const totals: Record<string, number> = {};
        const now = Date.now();
        snap.docs.forEach((d) => {
          const pass = d.data() as StudentPassDoc;
          if (pass.expiresAt.toMillis() > now) {
            totals[pass.studentId] = (totals[pass.studentId] ?? 0) + pass.remainingCredits;
          }
        });
        setCreditsByStudent(totals);
      },
    );
  }, [tenantId]);

  const studentsById = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students],
  );
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const bookedIds = new Set(confirmed.map((b) => b.studentId));
  const isPast = schedule.startAt.toMillis() < Date.now();
  const title = `${classType?.name ?? "Clase"} · ${schedule.startAt
    .toDate()
    .toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {instructor ? `${instructor.name} · ` : ""}
            <span className="font-medium text-gray-900">
              {schedule.bookedCount}/{schedule.capacity}
            </span>{" "}
            lugares ocupados
          </p>
          {!adding && !isPast && schedule.status === "scheduled" && (
            <Button className="px-3 py-1.5 text-xs" onClick={() => setAdding(true)}>
              <UserPlus className="mr-1 inline h-4 w-4" /> Inscribir alumno
            </Button>
          )}
        </div>

        {notice && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>
        )}

        {adding && (
          <StudentPicker
            tenantId={tenantId}
            scheduleId={scheduleId}
            students={students}
            bookedIds={bookedIds}
            creditsByStudent={creditsByStudent}
            onDone={(message) => {
              setAdding(false);
              if (message) setNotice(message);
            }}
          />
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Inscritos ({confirmed.length})</h3>
          {confirmed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              Nadie inscrito todavía.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {confirmed.map((booking) => {
                const student = studentsById[booking.studentId];
                return (
                  <li key={booking.id} className="flex items-center gap-3 p-3">
                    <Avatar name={student?.displayName || student?.email || "?"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {student?.displayName || student?.email || "Alumno"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.spotNumber !== null ? `Cama ${booking.spotNumber}` : "Sin cama asignada"}
                        {booking.overrides && booking.overrides.length > 0 &&
                          ` · cortesía (${booking.overrides.map((o) => OVERRIDE_LABELS[o] ?? o).join(", ")})`}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setCancelTarget(booking)}
                    >
                      Cancelar
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {waitlist.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Lista de espera ({waitlist.length})
            </h3>
            <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
              {waitlist.map((entry, index) => {
                const student = studentsById[entry.studentId];
                return (
                  <li key={entry.id} className="flex items-center gap-3 p-3">
                    <span className="w-5 text-xs text-gray-400">{index + 1}</span>
                    <span className="text-gray-900">
                      {student?.displayName || student?.email || "Alumno"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          studentName={
            studentsById[cancelTarget.studentId]?.displayName ||
            studentsById[cancelTarget.studentId]?.email ||
            "el alumno"
          }
          requiredCredits={classType?.requiredCredits ?? 1}
          onClose={(message) => {
            setCancelTarget(null);
            if (message) setNotice(message);
          }}
        />
      )}
    </Modal>
  );
}

function StudentPicker({
  scheduleId,
  students,
  bookedIds,
  creditsByStudent,
  onDone,
}: {
  tenantId: string;
  scheduleId: string;
  students: Student[];
  bookedIds: Set<string>;
  creditsByStudent: Record<string, number>;
  onDone: (message?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A restriction the admin must confirm before we retry with override.
  const [pending, setPending] = useState<{ student: Student; reason: string } | null>(null);
  const [creating, setCreating] = useState(false);

  const matches = students.filter((s) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${s.displayName} ${s.email} ${s.phone}`.toLowerCase().includes(needle);
  });

  async function book(student: Student, override: boolean) {
    setBusyId(student.id);
    setError(null);
    try {
      const bookClassSession = httpsCallable<
        { scheduleId: string; studentId: string; override: boolean },
        { status: "confirmed" | "waitlisted" }
      >(functions, "bookClassSession");
      const { data } = await bookClassSession({ scheduleId, studentId: student.id, override });
      const name = student.displayName || student.email;
      onDone(
        data.status === "waitlisted"
          ? `${name} entró a la lista de espera (la clase está llena).`
          : `${name} quedó inscrito.`,
      );
    } catch (err) {
      const callableError = err as CallableError;
      if (callableError.details?.overridable) {
        setPending({ student, reason: errorMessage(err) });
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (creating) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-3 text-sm font-medium text-gray-900">Nuevo alumno (sin cuenta)</p>
        <NewStudentForm
          submitLabel="Crear e inscribir"
          onCancel={() => setCreating(false)}
          onCreated={(created: CreatedStudent) => {
            setCreating(false);
            // A brand-new profile has no credits, so this will ask to confirm the courtesy.
            void book(
              { ...created, role: "student", tenantId: "", emergencyContact: null, validatedBasicClasses: 0, hasAccount: false },
              false,
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alumno por nombre, correo o teléfono"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>
        <button
          onClick={() => onDone()}
          aria-label="Cerrar buscador"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {pending && (
        <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">{pending.reason}</p>
          <p className="mt-0.5">¿Inscribirlo de todos modos? Quedará marcado como cortesía.</p>
          <div className="mt-2 flex gap-2">
            <Button
              className="px-3 py-1.5 text-xs"
              disabled={busyId !== null}
              onClick={() => {
                const target = pending.student;
                setPending(null);
                void book(target, true);
              }}
            >
              Inscribir de todos modos
            </Button>
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setPending(null)}>
              No
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setCreating(true)}
        className="mb-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-2.5 text-left text-sm font-medium text-brand-700 hover:bg-gray-50"
      >
        <UserPlus className="h-4 w-4" /> Nuevo alumno sin cuenta
      </button>

      <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {matches.length === 0 && <li className="p-3 text-sm text-gray-500">Sin resultados.</li>}
        {matches.map((student) => {
          const credits = creditsByStudent[student.id] ?? 0;
          const alreadyBooked = bookedIds.has(student.id);
          return (
            <li key={student.id} className="flex items-center gap-3 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {student.displayName || student.email}
                </p>
                <p className={`text-xs ${credits > 0 ? "text-gray-500" : "text-amber-700"}`}>
                  {credits} {credits === 1 ? "crédito" : "créditos"} vigentes
                </p>
              </div>
              <Button
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                disabled={alreadyBooked || busyId !== null}
                onClick={() => book(student, false)}
              >
                {alreadyBooked ? "Inscrito" : busyId === student.id ? "..." : "Inscribir"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CancelDialog({
  booking,
  studentName,
  requiredCredits,
  onClose,
}: {
  booking: Booking;
  studentName: string;
  requiredCredits: number;
  onClose: (message?: string) => void;
}) {
  const [forceRefund, setForceRefund] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCredit = booking.passUsedId !== "";

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const cancelBookingSession = httpsCallable<
        { bookingId: string; forceRefund: boolean },
        { creditRefunded: boolean }
      >(functions, "cancelBookingSession");
      const { data } = await cancelBookingSession({ bookingId: booking.id, forceRefund });
      onClose(
        `Reserva de ${studentName} cancelada${
          data.creditRefunded ? " y crédito devuelto" : " sin devolver crédito"
        }.`,
      );
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
      <p className="font-medium text-red-900">¿Cancelar la reserva de {studentName}?</p>
      {hasCredit ? (
        <label className="mt-2 flex items-start gap-2 text-gray-800">
          <input
            type="checkbox"
            checked={forceRefund}
            onChange={(e) => setForceRefund(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Devolver {requiredCredits} {requiredCredits === 1 ? "crédito" : "créditos"}, aunque ya
            haya pasado la ventana de cancelación
          </span>
        </label>
      ) : (
        <p className="mt-1 text-gray-700">Esta reserva fue de cortesía: no hay crédito que devolver.</p>
      )}
      {error && <p className="mt-2 text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button className="bg-red-700 px-3 py-1.5 text-xs hover:bg-red-800" disabled={busy} onClick={confirm}>
          {busy ? "Cancelando..." : "Sí, cancelar reserva"}
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => onClose()}>
          Volver
        </Button>
      </div>
    </div>
  );
}
