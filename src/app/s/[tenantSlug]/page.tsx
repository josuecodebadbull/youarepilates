"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CalendarX } from "lucide-react";

import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ClassLevel, ClassTypeDoc, InstructorDoc, RoomDoc, ScheduleDoc } from "@/lib/types/firestore";
import { LEVEL_LABELS } from "@/lib/classLevel";
import { ClassCard } from "@/components/student/ClassCard";
import { DayPicker } from "@/components/student/DayPicker";
import { SpotPicker } from "@/components/student/SpotPicker";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface Schedule extends ScheduleDoc {
  id: string;
}

interface BookClassSessionResult {
  bookingId: string;
  status: "confirmed" | "waitlisted";
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function ClassExplorerPage() {
  const { tenantId, tenant } = useTenant();
  const { user, claims } = useAuth();
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
  const [instructors, setInstructors] = useState<Record<string, InstructorDoc>>({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [levelFilter, setLevelFilter] = useState<ClassLevel | "todos">("todos");
  const [instructorFilter, setInstructorFilter] = useState<string>("todos");

  const [waiverSigned, setWaiverSigned] = useState<boolean | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<RoomDoc | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const schedulesQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("startAt", ">=", Timestamp.now()),
      where("status", "==", "scheduled"),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(schedulesQuery, (snapshot) => {
      setSchedules(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ScheduleDoc) })),
      );
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "classTypes"), (snapshot) => {
      const next: Record<string, ClassTypeDoc> = {};
      snapshot.docs.forEach((doc) => {
        next[doc.id] = doc.data() as ClassTypeDoc;
      });
      setClassTypes(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "instructors"), (snapshot) => {
      const next: Record<string, InstructorDoc> = {};
      snapshot.docs.forEach((doc) => {
        next[doc.id] = doc.data() as InstructorDoc;
      });
      setInstructors(next);
    });
  }, [tenantId]);

  useEffect(() => {
    if (!user) {
      setWaiverSigned(null);
      return;
    }
    const waiverVersion = tenant.waiver?.version ?? 0;
    if (waiverVersion === 0) {
      setWaiverSigned(true);
      return;
    }
    const signatureQuery = query(
      collection(db, "tenants", tenantId, "waiverSignatures"),
      where("studentId", "==", user.uid),
      where("version", "==", waiverVersion),
    );
    return onSnapshot(signatureQuery, (snap) => setWaiverSigned(!snap.empty));
  }, [tenantId, user, tenant.waiver?.version]);

  const daySchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (!isSameDay(s.startAt.toDate(), selectedDay)) return false;
      const classType = classTypes[s.classTypeId];
      if (levelFilter !== "todos" && classType?.level !== levelFilter) return false;
      if (instructorFilter !== "todos" && s.instructorId !== instructorFilter) return false;
      return true;
    });
  }, [schedules, selectedDay, levelFilter, instructorFilter, classTypes]);

  async function openBookingRow(schedule: Schedule) {
    if (!user) {
      router.push(`/s/${tenant.slug}/login`);
      return;
    }
    if (waiverSigned === false) {
      setMessage("Debes firmar la carta responsiva antes de reservar. Ve a tu Perfil.");
      return;
    }

    if (expandedScheduleId === schedule.id) {
      setExpandedScheduleId(null);
      setExpandedRoom(null);
      setSelectedSpot(null);
      return;
    }

    setMessage(null);
    setSelectedSpot(null);
    setExpandedScheduleId(schedule.id);
    setExpandedRoom(null);

    const roomSnap = await getDoc(
      doc(db, "tenants", tenantId, "branches", schedule.branchId, "rooms", schedule.roomId),
    );
    setExpandedRoom(roomSnap.exists() ? (roomSnap.data() as RoomDoc) : null);
  }

  async function confirmBooking(scheduleId: string) {
    setPendingScheduleId(scheduleId);
    setMessage(null);
    try {
      const bookClassSession = httpsCallable<
        { scheduleId: string; spotNumber?: number },
        BookClassSessionResult
      >(functions, "bookClassSession");
      const result = await bookClassSession({
        scheduleId,
        ...(selectedSpot !== null ? { spotNumber: selectedSpot } : {}),
      });
      setMessage(
        result.data.status === "confirmed"
          ? "¡Reserva confirmada!"
          : "Clase llena: quedaste en lista de espera.",
      );
      setExpandedScheduleId(null);
      setExpandedRoom(null);
      setSelectedSpot(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo reservar.");
    } finally {
      setPendingScheduleId(null);
    }
  }

  const instructorOptions = Object.entries(instructors);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Reserva tu clase</h1>

      <div className="sticky top-0 z-10 -mx-4 mt-3 space-y-2 bg-gray-50 px-4 pb-2 pt-1">
        <DayPicker selected={selectedDay} onSelect={setSelectedDay} />

        <div className="flex gap-2 overflow-x-auto">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as ClassLevel | "todos")}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-ink"
          >
            <option value="todos">Todos los niveles</option>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-ink"
          >
            <option value="todos">Todos los instructores</option>
            {instructorOptions.map(([id, instructor]) => (
              <option key={id} value={id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {waiverSigned === false && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Debes firmar la carta responsiva antes de reservar.{" "}
          <button onClick={() => router.push(`/s/${tenant.slug}/perfil`)} className="font-semibold underline">
            Firmar ahora
          </button>
        </div>
      )}

      {message && (
        <p className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{message}</p>
      )}

      <div className="mt-4 space-y-3 pb-4">
        {daySchedules.map((schedule) => {
          const classType = classTypes[schedule.classTypeId];
          const instructor = instructors[schedule.instructorId];
          const isFull = schedule.bookedCount >= schedule.capacity;
          const isExpanded = expandedScheduleId === schedule.id;

          return (
            <div key={schedule.id}>
              <ClassCard
                schedule={schedule}
                classType={classType}
                instructor={instructor}
                action={
                  <Button
                    onClick={() => openBookingRow(schedule)}
                    disabled={!!claims && claims.role !== "student"}
                    className="px-3 py-1.5 text-xs"
                  >
                    {isFull ? "Lista de espera" : "Reservar"}
                  </Button>
                }
              />

              {isExpanded && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
                  {isFull ? (
                    <p className="text-sm text-ink-soft">
                      Esta clase está llena — al confirmar entras a la lista de espera y te
                      avisaremos si se libera un lugar.
                    </p>
                  ) : expandedRoom ? (
                    <>
                      <p className="mb-2 text-sm font-medium text-ink">Elige tu lugar</p>
                      <SpotPicker
                        spots={expandedRoom.spots}
                        blockedSpots={expandedRoom.blockedSpots}
                        takenSpots={schedule.takenSpots ?? []}
                        selected={selectedSpot}
                        onSelect={setSelectedSpot}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-ink-soft">Cargando lugares disponibles…</p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => confirmBooking(schedule.id)}
                      disabled={pendingScheduleId === schedule.id}
                      className="px-3 py-1.5 text-xs"
                    >
                      {pendingScheduleId === schedule.id
                        ? "Reservando..."
                        : isFull
                          ? "Unirme a la lista de espera"
                          : "Confirmar reserva"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => {
                        setExpandedScheduleId(null);
                        setExpandedRoom(null);
                        setSelectedSpot(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {daySchedules.length === 0 && (
          <EmptyState
            icon={<CalendarX className="h-7 w-7" strokeWidth={1.75} />}
            title="No hay clases este día"
            description="Elige otro día o quita algún filtro."
          />
        )}
      </div>
    </div>
  );
}
