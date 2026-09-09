"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ScheduleDoc } from "@/lib/types/firestore";

interface Schedule extends ScheduleDoc {
  id: string;
}

export default function HorariosPage() {
  const { tenantId } = useTenant();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const schedulesQuery = query(
      collection(db, "tenants", tenantId, "schedules"),
      where("startAt", ">=", Timestamp.now()),
      orderBy("startAt", "asc"),
    );
    return onSnapshot(schedulesQuery, (snapshot) => {
      setSchedules(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ScheduleDoc) })),
      );
    });
  }, [tenantId]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Próximos horarios</h1>
      <p className="mt-1 text-sm text-gray-500">
        El generador de plantillas recurrentes (crear N semanas de golpe) queda para la
        Fase 2 — por ahora esta vista lee en vivo lo que exista en{" "}
        <code>schedules</code>.
      </p>

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {schedules.map((schedule) => (
          <li key={schedule.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {schedule.startAt.toDate().toLocaleString("es-MX", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-500">Sala {schedule.roomId}</p>
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
        ))}
        {schedules.length === 0 && (
          <li className="p-4 text-sm text-gray-500">No hay clases programadas.</li>
        )}
      </ul>
    </div>
  );
}
