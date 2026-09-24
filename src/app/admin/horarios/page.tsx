"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { addDays, getMonday, isSameDay } from "@/lib/calendarDate";
import { formatShortDate } from "@/lib/admin/data";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc, ClassTypeDoc, InstructorDoc, RoomDoc, ScheduleDoc } from "@/lib/types/firestore";
import { chipClass, sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClassRosterModal } from "@/components/admin/ClassRosterModal";
import { ClassRow } from "@/components/admin/ClassRow";
import { useToast } from "@/components/admin/Toast";
import { DAY_LABELS, WeekCalendar } from "@/components/admin/WeekCalendar";

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

interface SlotPrefill {
  branchId?: string;
  date: string;
  time: string;
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(hour: number): string {
  const clamped = Math.min(Math.max(hour, 0), 23);
  return `${String(clamped).padStart(2, "0")}:00`;
}

export default function HorariosPage() {
  return (
    <Suspense>
      <HorariosContent />
    </Suspense>
  );
}

function HorariosContent() {
  const { tenantId } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [slotPrefill, setSlotPrefill] = useState<SlotPrefill | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [weekSchedules, setWeekSchedules] = useState<Schedule[]>([]);
  const [rosterScheduleId, setRosterScheduleId] = useState<string | null>(null);

  // "Programar clase" from the header / quick actions lands here with ?nuevo=1.
  const wantsNew = searchParams.get("nuevo") === "1";
  useEffect(() => {
    if (!wantsNew) return;
    setSlotPrefill(null);
    setFormOpen(true);
    router.replace("/admin/horarios");
  }, [wantsNew, router]);

  useEffect(() => {
    const schedulesQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("startAt", ">=", Timestamp.now()),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(schedulesQuery, (snapshot) => {
      setSchedules(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ScheduleDoc) })));
    });
  }, [tenantId]);

  useEffect(() => {
    const weekEnd = addDays(weekStart, 7);
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

  const classTypesById = useMemo(() => Object.fromEntries(classTypes.map((c) => [c.id, c])), [classTypes]);
  const instructorsById = useMemo(() => Object.fromEntries(instructors.map((i) => [i.id, i])), [instructors]);

  // Looked up live so the roster header (bookedCount) updates as bookings change.
  const rosterSchedule = rosterScheduleId
    ? [...weekSchedules, ...schedules].find((s) => s.id === rosterScheduleId)
    : undefined;

  function openForm(prefill: SlotPrefill | null) {
    setSlotPrefill(prefill);
    setFormOpen(true);
  }

  function goToWeek(start: Date) {
    setWeekStart(start);
    const today = new Date();
    setSelectedDay(isSameDay(getMonday(today), start) ? today : start);
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const selectedIndex = days.findIndex((d) => isSameDay(d, selectedDay));
  const selectedClasses = weekSchedules.filter((s) => isSameDay(s.startAt.toDate(), selectedDay));
  const weekEndDay = addDays(weekStart, 6);
  const rangeLabel =
    weekStart.getMonth() === weekEndDay.getMonth()
      ? `${weekStart.getDate()} – ${formatShortDate(weekEndDay)}`
      : `${formatShortDate(weekStart)} – ${formatShortDate(weekEndDay)}`;

  const navButton =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-ink/[0.12] bg-white text-ink hover:bg-[#F7F6F3]";

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Horarios"
        description="Cupos en vivo conforme tus alumnos reservan."
        action={
          <div className="flex items-center gap-1.5">
            <button onClick={() => goToWeek(addDays(weekStart, -7))} aria-label="Semana anterior" className={navButton}>
              <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <span className="whitespace-nowrap px-2.5 text-sm font-semibold text-ink">{rangeLabel}</span>
            <button onClick={() => goToWeek(addDays(weekStart, 7))} aria-label="Semana siguiente" className={navButton}>
              <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <button
              onClick={() => goToWeek(getMonday(new Date()))}
              className="h-10 rounded-xl border border-ink/[0.12] bg-white px-3.5 text-[13px] font-semibold text-ink hover:bg-[#F7F6F3]"
            >
              Hoy
            </button>
          </div>
        }
      />

      {missingPrerequisite && (
        <div className="mb-5 rounded-[18px] bg-[#FEF7E6] p-4 text-sm text-amber-900">
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

      {/* Phones and tablets: pick a day, see its classes as cards. */}
      <div className="flex flex-col gap-4 pb-20 lg:hidden">
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, i) => {
            const selected = i === selectedIndex;
            const isToday = isSameDay(day, today);
            const hasClasses = weekSchedules.some((s) => isSameDay(s.startAt.toDate(), day));
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex h-[66px] flex-col items-center justify-center gap-0.5 rounded-2xl ${
                  selected
                    ? "bg-ink text-white"
                    : `border border-ink/[0.08] bg-white ${isToday ? "text-brand-700" : "text-ink"}`
                }`}
              >
                <span className="text-[11px] font-semibold opacity-75">{DAY_LABELS[i]}</span>
                <span className="text-[17px] font-bold">{day.getDate()}</span>
                <span
                  className={`h-[5px] w-[5px] rounded-full ${
                    hasClasses ? (selected ? "bg-brand-300" : "bg-brand-500") : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-semibold text-ink">
            {DAY_NAMES[selectedIndex >= 0 ? selectedIndex : 0]} {selectedDay.getDate()}
            {isSameDay(selectedDay, today) ? " · Hoy" : ""}
          </span>
          <span className="text-[13px] text-ink-faint">
            {selectedClasses.length} {selectedClasses.length === 1 ? "clase" : "clases"}
          </span>
        </div>

        {selectedClasses.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {selectedClasses.map((schedule) => (
              <ClassRow
                key={schedule.id}
                variant="card"
                schedule={schedule}
                classType={classTypesById[schedule.classTypeId]}
                instructor={instructorsById[schedule.instructorId]}
                onClick={() => setRosterScheduleId(schedule.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-ink/15 px-5 py-8 text-center">
            <p className="text-[15px] font-semibold text-ink">Sin clases este día</p>
            {!missingPrerequisite && (
              <button
                onClick={() => openForm({ date: toDateInputValue(selectedDay), time: "09:00" })}
                className="h-11 rounded-xl bg-ink px-[18px] text-sm font-semibold text-white"
              >
                Programar clase
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: full week grid. */}
      <div className="hidden lg:block">
        <WeekCalendar
          weekStart={weekStart}
          schedules={weekSchedules}
          classTypes={classTypesById}
          instructors={instructorsById}
          onScheduleClick={(schedule) => setRosterScheduleId(schedule.id)}
          onSlotClick={
            missingPrerequisite
              ? undefined
              : (day, hour) => openForm({ date: toDateInputValue(day), time: toTimeInputValue(hour) })
          }
        />
      </div>

      {!missingPrerequisite && !formOpen && !rosterSchedule && (
        <button
          onClick={() => openForm({ date: toDateInputValue(selectedDay), time: "09:00" })}
          className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-20 flex h-[52px] items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white shadow-[0_12px_28px_-8px_rgba(22,24,29,0.45)] lg:hidden"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Programar
        </button>
      )}

      {formOpen && (
        <ScheduleForm
          tenantId={tenantId}
          branches={branches}
          classTypes={classTypes}
          instructors={instructors.filter((i) => i.active)}
          existingSchedules={schedules}
          prefill={slotPrefill}
          onDone={() => setFormOpen(false)}
        />
      )}

      {rosterSchedule && (
        <ClassRosterModal
          tenantId={tenantId}
          scheduleId={rosterSchedule.id}
          schedule={rosterSchedule}
          classType={classTypesById[rosterSchedule.classTypeId]}
          instructor={instructorsById[rosterSchedule.instructorId]}
          onClose={() => setRosterScheduleId(null)}
        />
      )}
    </div>
  );
}

function ScheduleForm({
  tenantId,
  branches,
  classTypes,
  instructors,
  existingSchedules,
  prefill,
  onDone,
}: {
  tenantId: string;
  branches: Branch[];
  classTypes: ClassType[];
  instructors: Instructor[];
  existingSchedules: Schedule[];
  prefill: SlotPrefill | null;
  onDone: () => void;
}) {
  const toast = useToast();
  const [branchId, setBranchId] = useState(prefill?.branchId ?? branches[0]?.id ?? "");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [classTypeId, setClassTypeId] = useState(classTypes[0]?.id ?? "");
  const [instructorId, setInstructorId] = useState(instructors[0]?.id ?? "");
  const [date, setDate] = useState(prefill?.date ?? "");
  const [time, setTime] = useState(prefill?.time ?? "09:00");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const todayInputValue = useMemo(() => toDateInputValue(new Date()), []);

  // Opened from ?nuevo=1 the lists may still be loading — pick defaults once they arrive.
  useEffect(() => {
    setBranchId((current) => current || branches[0]?.id || "");
    setClassTypeId((current) => current || classTypes[0]?.id || "");
    setInstructorId((current) => current || instructors[0]?.id || "");
  }, [branches, classTypes, instructors]);

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

  const selectedBranch = branches.find((b) => b.id === branchId);
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

    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const baseStart = new Date(year!, month! - 1, day!, hour!, minute!);

    if (baseStart.getTime() < Date.now()) {
      setError("No puedes programar una clase en una fecha/hora que ya pasó.");
      return;
    }

    // Build every occurrence first so we can validate all of them (past-time is only
    // possible for the first one, but overlaps can happen on any repeated week) before
    // writing anything.
    const occurrences = Array.from({ length: repeatWeeks }, (_, week) => {
      const startAt = new Date(baseStart);
      startAt.setDate(startAt.getDate() + week * 7);
      const endAt = new Date(startAt.getTime() + selectedClassType.durationMinutes * 60_000);
      return { startAt, endAt };
    });

    const conflict = occurrences.find(({ startAt, endAt }) =>
      existingSchedules.some((s) => {
        if (s.roomId !== selectedRoom.id || s.status !== "scheduled") return false;
        const sStart = s.startAt.toDate();
        const sEnd = s.endAt.toDate();
        return startAt < sEnd && sStart < endAt;
      }),
    );
    if (conflict) {
      setError(
        `Esa sala ya tiene una clase que se traslapa el ${conflict.startAt.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
        })} a las ${conflict.startAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}. Elige otro horario o sala.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      const schedulesCollection = collection(db, "tenants", tenantId, "schedules");

      for (const { startAt, endAt } of occurrences) {
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
      toast(repeatWeeks > 1 ? `${repeatWeeks} clases programadas` : "Clase programada");
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  const labelClass = "text-[13px] font-semibold text-ink";

  return (
    <Modal
      title="Programar clase"
      subtitle="Tus alumnos la verán al instante en la app"
      onClose={onDone}
      footer={
        <>
          <button
            type="button"
            onClick={onDone}
            className="h-[50px] rounded-[14px] border border-ink/[0.14] bg-white px-[18px] text-[15px] font-semibold text-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="schedule-form"
            disabled={submitting}
            className="h-[50px] flex-1 rounded-[14px] bg-ink text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Guardando..." : repeatWeeks > 1 ? `Programar ${repeatWeeks} clases` : "Programar clase"}
          </button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Tipo de clase</span>
          <div className="flex flex-wrap gap-2">
            {classTypes.map((classType) => (
              <button
                key={classType.id}
                type="button"
                onClick={() => setClassTypeId(classType.id)}
                className={chipClass(classType.id === classTypeId)}
              >
                {classType.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Instructor</span>
          <div className="flex flex-wrap gap-2">
            {instructors.map((instructor) => (
              <button
                key={instructor.id}
                type="button"
                onClick={() => setInstructorId(instructor.id)}
                className={chipClass(instructor.id === instructorId)}
              >
                {instructor.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className={`flex flex-col gap-1.5 ${labelClass}`}>
            Fecha
            <input
              type="date"
              required
              min={todayInputValue}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={sheetInputClass}
            />
          </label>
          <label className={`flex flex-col gap-1.5 ${labelClass}`}>
            Hora
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={sheetInputClass}
            />
          </label>
        </div>

        {(branches.length > 1 || rooms.length > 1) && (
          <div className="grid grid-cols-2 gap-2.5">
            <label className={`flex flex-col gap-1.5 ${labelClass}`}>
              Sede
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={sheetInputClass}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={`flex flex-col gap-1.5 ${labelClass}`}>
              Sala
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={rooms.length === 0}
                className={sheetInputClass}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1 rounded-2xl bg-[#F3F2EE] p-3.5">
          <span className="text-sm font-semibold text-ink">
            {selectedBranch?.name ?? "Sede"}
            {selectedRoom ? ` · ${selectedRoom.name}` : ""}
          </span>
          <span className="text-[13px] text-ink-soft">
            {selectedRoom
              ? `${effectiveCapacity} de ${selectedRoom.capacity} camas disponibles${
                  selectedRoom.blockedSpots.length > 0 ? ` (${selectedRoom.blockedSpots.length} en mantenimiento)` : ""
                }`
              : rooms.length === 0
                ? "Esta sede no tiene salas — créala primero"
                : "Elige una sala"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">Repetir cada semana</span>
            <span className="text-xs text-ink-soft">
              {repeatWeeks > 1 ? `Misma hora durante ${repeatWeeks} semanas` : "Solo esta fecha"}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-[14px] bg-[#F3F2EE] p-1">
            <button
              type="button"
              onClick={() => setRepeatWeeks((n) => Math.max(1, n - 1))}
              aria-label="Menos semanas"
              className="h-10 w-10 rounded-[10px] bg-white text-lg font-semibold text-ink"
            >
              −
            </button>
            <span className="min-w-7 text-center text-[15px] font-bold tabular-nums">{repeatWeeks}</span>
            <button
              type="button"
              onClick={() => setRepeatWeeks((n) => Math.min(26, n + 1))}
              aria-label="Más semanas"
              className="h-10 w-10 rounded-[10px] bg-white text-lg font-semibold text-ink"
            >
              +
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}
