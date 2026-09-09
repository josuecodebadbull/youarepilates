"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc, ClassTypeDoc, InstructorDoc, RoomDoc, ScheduleDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { getMonday, WeekCalendar } from "@/components/admin/WeekCalendar";

interface Schedule extends ScheduleDoc {
  id: string;
}
interface Branch extends BranchDoc {
  id: string;
}
interface Room extends RoomDoc {
  id: string;
}
interface ClassType extends ClassTypeDoc {
  id: string;
}
interface Instructor extends InstructorDoc {
  id: string;
}

export default function HorariosPage() {
  const { tenantId } = useTenant();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [weekSchedules, setWeekSchedules] = useState<Schedule[]>([]);

  // The week grid needs real width to be usable — default to the list on phones
  // instead of handing them a calendar that only works by scrolling sideways.
  useEffect(() => {
    if (window.innerWidth < 768) {
      setView("list");
    }
  }, []);

  useEffect(() => {
    const schedulesQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("startAt", ">=", Timestamp.now()),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(schedulesQuery, (snapshot) => {
      setSchedules(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ScheduleDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  useEffect(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("status", "==", "scheduled"),
      where("startAt", ">=", Timestamp.fromDate(weekStart)),
      where("startAt", "<", Timestamp.fromDate(weekEnd)),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(weekQuery, (snapshot) => {
      setWeekSchedules(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ScheduleDoc) })));
    });
  }, [tenantId, weekStart]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "branches"), orderBy("name")),
      (snap) => setBranches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BranchDoc) }))),
    );
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "classTypes"), orderBy("name")),
      (snap) => setClassTypes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassTypeDoc) }))),
    );
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "instructors"), orderBy("name")),
      (snap) => setInstructors(snap.docs.map((d) => ({ id: d.id, ...(d.data() as InstructorDoc) }))),
    );
  }, [tenantId]);

  const missingPrerequisite = branches.length === 0 || classTypes.length === 0 || instructors.length === 0;

  const classTypesById = useMemo(
    () => Object.fromEntries(classTypes.map((c) => [c.id, c])),
    [classTypes],
  );
  const instructorsById = useMemo(
    () => Object.fromEntries(instructors.map((i) => [i.id, i])),
    [instructors],
  );

  return (
    <div>
      <PageHeader
        title="Horarios"
        description="Las clases programadas de todas tus sedes, ordenadas por fecha. El cupo se actualiza en vivo conforme tus alumnos reservan."
        action={
          !formOpen &&
          !missingPrerequisite && <Button onClick={() => setFormOpen(true)}>+ Programar clase</Button>
        }
      />

      {missingPrerequisite && !formOpen && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Antes de programar una clase necesitas al menos una{" "}
          {branches.length === 0 && (
            <Link href="/admin/sedes" className="font-semibold underline">
              sede con una sala
            </Link>
          )}
          {branches.length > 0 && classTypes.length === 0 && (
            <Link href="/admin/tipos-de-clase" className="font-semibold underline">
              tipo de clase
            </Link>
          )}
          {branches.length > 0 && classTypes.length > 0 && instructors.length === 0 && (
            <Link href="/admin/instructores" className="font-semibold underline">
              instructor
            </Link>
          )}
          .
        </div>
      )}

      {formOpen && (
        <ScheduleForm
          tenantId={tenantId}
          branches={branches}
          classTypes={classTypes}
          instructors={instructors}
          onDone={() => setFormOpen(false)}
        />
      )}

      {loaded && schedules.length === 0 && !formOpen ? (
        <EmptyState
          icon="🗓️"
          title="Todavía no hay clases programadas"
          description={
            missingPrerequisite
              ? "Completa sedes, tipos de clase e instructores para poder programar tu primera clase."
              : "Programa tu primera clase para que tus alumnos puedan empezar a reservar."
          }
          action={
            !missingPrerequisite && (
              <Button onClick={() => setFormOpen(true)}>+ Programar mi primera clase</Button>
            )
          }
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <div className="inline-flex rounded-md border border-gray-200 p-0.5 text-sm">
              <button
                onClick={() => setView("calendar")}
                className={`rounded px-3 py-1 ${view === "calendar" ? "bg-brand-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Calendario
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded px-3 py-1 ${view === "list" ? "bg-brand-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Lista
              </button>
            </div>
          </div>

          {view === "calendar" ? (
            <WeekCalendar
              weekStart={weekStart}
              schedules={weekSchedules}
              classTypes={classTypesById}
              instructors={instructorsById}
              onPrevWeek={() => setWeekStart((d) => shiftDays(d, -7))}
              onNextWeek={() => setWeekStart((d) => shiftDays(d, 7))}
              onToday={() => setWeekStart(getMonday(new Date()))}
            />
          ) : (
            <>
              <div className="mb-4 flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Con lugares
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Llena
                </span>
              </div>
              <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                {schedules.map((schedule) => {
                  const classType = classTypesById[schedule.classTypeId];
                  const instructor = instructorsById[schedule.instructorId];
                  return (
                    <li key={schedule.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {classType?.name ?? "Clase"}
                          {instructor && (
                            <span className="font-normal text-gray-500"> · {instructor.name}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {schedule.startAt.toDate().toLocaleString("es-MX", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          schedule.bookedCount >= schedule.capacity
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {schedule.bookedCount}/{schedule.capacity}
                        {schedule.waitlistCount > 0 ? ` · ${schedule.waitlistCount} en espera` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function ScheduleForm({
  tenantId,
  branches,
  classTypes,
  instructors,
  onDone,
}: {
  tenantId: string;
  branches: Branch[];
  classTypes: ClassType[];
  instructors: Instructor[];
  onDone: () => void;
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [classTypeId, setClassTypeId] = useState(classTypes[0]?.id ?? "");
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    setRoomId("");
    return onSnapshot(
      query(collection(db, "tenants", tenantId, "branches", branchId, "rooms"), orderBy("name")),
      (snap) => {
        const nextRooms = snap.docs.map((d) => ({ id: d.id, ...(d.data() as RoomDoc) }));
        setRooms(nextRooms);
        setRoomId((current) => current || nextRooms[0]?.id || "");
      },
    );
  }, [tenantId, branchId]);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const selectedClassType = useMemo(
    () => classTypes.find((c) => c.id === classTypeId),
    [classTypes, classTypeId],
  );
  const effectiveCapacity = selectedRoom ? selectedRoom.capacity - selectedRoom.blockedSpots.length : 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedRoom || !selectedClassType || !date) {
      setError("Completa todos los campos requeridos.");
      return;
    }
    if (effectiveCapacity <= 0) {
      setError("Esta sala no tiene camas disponibles (revisa si están todas bloqueadas por mantenimiento).");
      return;
    }

    setSubmitting(true);
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute] = time.split(":").map(Number);
      const baseStart = new Date(year!, month! - 1, day!, hour!, minute!);

      const batch = writeBatch(db);
      const schedulesCollection = collection(db, "tenants", tenantId, "schedules");

      for (let week = 0; week < repeatWeeks; week++) {
        const startAt = new Date(baseStart);
        startAt.setDate(startAt.getDate() + week * 7);
        const endAt = new Date(startAt.getTime() + selectedClassType.durationMinutes * 60_000);

        batch.set(doc(schedulesCollection), {
          branchId,
          roomId: selectedRoom.id,
          classTypeId,
          instructorId,
          startAt: Timestamp.fromDate(startAt),
          endAt: Timestamp.fromDate(endAt),
          capacity: effectiveCapacity,
          bookedCount: 0,
          waitlistCount: 0,
          status: "scheduled",
          takenSpots: [],
        } satisfies ScheduleDoc);
      }

      await batch.commit();
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5"
    >
      <h2 className="font-semibold text-gray-900">Programar clase</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sede" htmlFor="schedule-branch" required>
          <select
            id="schedule-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className={inputClass}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Sala"
          htmlFor="schedule-room"
          hint={
            selectedRoom
              ? `Capacidad disponible: ${effectiveCapacity} de ${selectedRoom.capacity}${
                  selectedRoom.blockedSpots.length > 0
                    ? ` (${selectedRoom.blockedSpots.length} en mantenimiento)`
                    : ""
                }`
              : rooms.length === 0
                ? "Esta sede no tiene salas — créala primero"
                : undefined
          }
          required
        >
          <select
            id="schedule-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={rooms.length === 0}
            className={inputClass}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo de clase" htmlFor="schedule-classtype" required>
          <select
            id="schedule-classtype"
            value={classTypeId}
            onChange={(e) => setClassTypeId(e.target.value)}
            className={inputClass}
          >
            {classTypes.map((classType) => (
              <option key={classType.id} value={classType.id}>
                {classType.name} · {classType.durationMinutes} min
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Instructor" htmlFor="schedule-instructor" required>
          <select
            id="schedule-instructor"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className={inputClass}
          >
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Fecha" htmlFor="schedule-date" required>
          <input
            id="schedule-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Hora de inicio" htmlFor="schedule-time" required>
          <input
            id="schedule-time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Repetir semanalmente"
          htmlFor="schedule-repeat"
          hint="Crea la misma clase cada semana. Deja en 1 para una sola clase."
        >
          <input
            id="schedule-repeat"
            type="number"
            min={1}
            max={26}
            value={repeatWeeks}
            onChange={(e) => setRepeatWeeks(Number(e.target.value))}
            className={inputClass}
          />
        </FormField>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : repeatWeeks > 1
              ? `Programar ${repeatWeeks} clases`
              : "Programar clase"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
