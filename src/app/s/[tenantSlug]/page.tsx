"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ClassTypeDoc, InstructorDoc, ScheduleDoc } from "@/lib/types/firestore";
import { ClassCard } from "@/components/student/ClassCard";
import { DayPicker } from "@/components/student/DayPicker";
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
  const { tenantId } = useTenant();
  const { user, claims } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
  const [instructors, setInstructors] = useState<Record<string, InstructorDoc>>({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
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

  const daySchedules = useMemo(
    () => schedules.filter((s) => isSameDay(s.startAt.toDate(), selectedDay)),
    [schedules, selectedDay],
  );

  async function handleBook(scheduleId: string) {
    if (!user) {
      setMessage("Inicia sesión para reservar.");
      return;
    }

    setPendingScheduleId(scheduleId);
    setMessage(null);
    try {
      const bookClassSession = httpsCallable<
        { scheduleId: string },
        BookClassSessionResult
      >(functions, "bookClassSession");
      const result = await bookClassSession({ scheduleId });
      setMessage(
        result.data.status === "confirmed"
          ? "¡Reserva confirmada!"
          : "Clase llena: quedaste en lista de espera.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo reservar.");
    } finally {
      setPendingScheduleId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Reserva tu clase</h1>

      <div className="sticky top-0 z-10 -mx-4 mt-3 bg-gray-50 px-4 pb-2 pt-1">
        <DayPicker selected={selectedDay} onSelect={setSelectedDay} />
      </div>

      {message && (
        <p className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{message}</p>
      )}

      <div className="mt-4 space-y-3">
        {daySchedules.map((schedule) => {
          const classType = classTypes[schedule.classTypeId];
          const instructor = instructors[schedule.instructorId];
          const isFull = schedule.bookedCount >= schedule.capacity;
          return (
            <ClassCard
              key={schedule.id}
              schedule={schedule}
              classType={classType}
              instructor={instructor}
              action={
                <Button
                  onClick={() => handleBook(schedule.id)}
                  disabled={pendingScheduleId === schedule.id || claims?.role !== "student"}
                  className="px-3 py-1.5 text-xs"
                >
                  {isFull ? "Lista de espera" : "Reservar"}
                </Button>
              }
            />
          );
        })}
        {daySchedules.length === 0 && (
          <EmptyState
            icon="🧘"
            title="No hay clases este día"
            description="Elige otro día en el selector de arriba."
          />
        )}
      </div>
    </div>
  );
}
