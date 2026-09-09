"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ScheduleDoc } from "@/lib/types/firestore";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

interface Schedule extends ScheduleDoc {
  id: string;
}

export default function HorariosPage() {
  const { tenantId } = useTenant();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loaded, setLoaded] = useState(false);

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
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Próximos horarios"
        description="Las clases programadas de todas tus sedes, ordenadas por fecha. El cupo se actualiza en vivo conforme tus alumnos reservan."
      />

      {loaded && schedules.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="Todavía no hay clases programadas"
          description="El creador de horarios recurrentes está en construcción — por ahora, pide que te ayudemos a cargar tus primeras clases."
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
            {schedules.map((schedule) => (
              <li key={schedule.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">
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
          </ul>
        </>
      )}
    </div>
  );
}
