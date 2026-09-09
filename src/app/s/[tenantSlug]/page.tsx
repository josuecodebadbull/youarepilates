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
import type { ClassTypeDoc, ScheduleDoc } from "@/lib/types/firestore";

interface Schedule extends ScheduleDoc {
  id: string;
}

interface BookClassSessionResult {
  bookingId: string;
  status: "confirmed" | "waitlisted";
}

export default function ClassExplorerPage() {
  const { tenantId } = useTenant();
  const { user, claims } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
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

  const grouped = useMemo(() => {
    const byDay = new Map<string, Schedule[]>();
    for (const schedule of schedules) {
      const key = schedule.startAt.toDate().toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });
      byDay.set(key, [...(byDay.get(key) ?? []), schedule]);
    }
    return byDay;
  }, [schedules]);

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
      <h1 className="text-xl font-bold">Próximas clases</h1>
      {message && <p className="mt-2 text-sm text-indigo-700">{message}</p>}

      <div className="mt-4 space-y-6 pb-16">
        {Array.from(grouped.entries()).map(([day, daySchedules]) => (
          <div key={day}>
            <h2 className="text-sm font-semibold capitalize text-gray-500">{day}</h2>
            <ul className="mt-2 space-y-2">
              {daySchedules.map((schedule) => {
                const classType = classTypes[schedule.classTypeId];
                const isFull = schedule.bookedCount >= schedule.capacity;
                return (
                  <li
                    key={schedule.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{classType?.name ?? "Clase"}</p>
                      <p className="text-sm text-gray-500">
                        {schedule.startAt.toDate().toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {schedule.bookedCount}/{schedule.capacity} lugares
                      </p>
                    </div>
                    <button
                      onClick={() => handleBook(schedule.id)}
                      disabled={pendingScheduleId === schedule.id || claims?.role !== "student"}
                      className="shrink-0 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: "var(--tenant-primary)" }}
                    >
                      {isFull ? "Lista de espera" : "Reservar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {schedules.length === 0 && (
          <p className="text-sm text-gray-500">No hay clases próximas por ahora.</p>
        )}
      </div>
    </div>
  );
}
