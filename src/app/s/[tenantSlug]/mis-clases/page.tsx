"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type {
  BookingDoc,
  BookingStatus,
  ClassTypeDoc,
  InstructorDoc,
  ScheduleDoc,
} from "@/lib/types/firestore";
import { ClassCard } from "@/components/student/ClassCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface Booking extends BookingDoc {
  id: string;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmada",
  attended: "Asististe",
  no_show: "No asististe",
  canceled: "Cancelada",
  canceled_late: "Cancelada fuera de tiempo",
};

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function MisClasesPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [tab, setTab] = useState<"proximas" | "historial">("proximas");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleDoc>>({});
  const [classTypes, setClassTypes] = useState<Record<string, ClassTypeDoc>>({});
  const [instructors, setInstructors] = useState<Record<string, InstructorDoc>>({});
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const bookingsQuery = query(
      collection(db, "tenants", tenantId, "bookings"),
      where("studentId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) })));
    });
  }, [tenantId, user]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "classTypes"), (snapshot) => {
      const next: Record<string, ClassTypeDoc> = {};
      snapshot.docs.forEach((d) => (next[d.id] = d.data() as ClassTypeDoc));
      setClassTypes(next);
    });
  }, [tenantId]);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "instructors"), (snapshot) => {
      const next: Record<string, InstructorDoc> = {};
      snapshot.docs.forEach((d) => (next[d.id] = d.data() as InstructorDoc));
      setInstructors(next);
    });
  }, [tenantId]);

  // Bookings only carry a scheduleId — fetch whichever schedule docs we don't have
  // cached yet (schedules don't change once created, so a one-time read is enough).
  useEffect(() => {
    const missingIds = [...new Set(bookings.map((b) => b.scheduleId))].filter((id) => !(id in schedules));
    if (missingIds.length === 0) return;

    missingIds.forEach(async (scheduleId) => {
      const snap = await getDoc(doc(db, "tenants", tenantId, "schedules", scheduleId));
      if (snap.exists()) {
        setSchedules((prev) => ({ ...prev, [scheduleId]: snap.data() as ScheduleDoc }));
      }
    });
  }, [bookings, schedules, tenantId]);

  async function handleCancel(bookingId: string) {
    if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    setError(null);
    setCancelingId(bookingId);
    try {
      const cancelBookingSession = httpsCallable(functions, "cancelBookingSession");
      await cancelBookingSession({ bookingId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la reserva.");
    } finally {
      setCancelingId(null);
    }
  }

  if (!user) {
    return <p className="text-sm text-gray-500">Inicia sesión para ver tus clases.</p>;
  }

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const history = bookings.filter((b) => b.status !== "confirmed");
  const visible = tab === "proximas" ? upcoming : history;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Mis clases</h1>

      <div className="mt-3 inline-flex rounded-md border border-gray-200 bg-white p-0.5 text-sm">
        <button
          onClick={() => setTab("proximas")}
          className={`rounded px-3 py-1 ${tab === "proximas" ? "bg-brand-700 text-white" : "text-gray-600"}`}
        >
          Próximas
        </button>
        <button
          onClick={() => setTab("historial")}
          className={`rounded px-3 py-1 ${tab === "historial" ? "bg-brand-700 text-white" : "text-gray-600"}`}
        >
          Historial
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3 pb-4">
        {visible.map((booking) => {
          const schedule = schedules[booking.scheduleId];
          if (!schedule) return null;

          const classType = classTypes[schedule.classTypeId];
          const instructor = instructors[schedule.instructorId];
          const startAt = schedule.startAt.toDate();

          if (tab === "historial") {
            return (
              <div key={booking.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{classType?.name ?? "Clase"}</p>
                  <span className="text-xs font-medium text-gray-500">{STATUS_LABELS[booking.status]}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {startAt.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            );
          }

          return (
            <div key={booking.id} className="space-y-2">
              <ClassCard
                schedule={schedule}
                classType={classType}
                instructor={instructor}
                action={
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled={cancelingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                  >
                    {cancelingId === booking.id ? "Cancelando..." : "Cancelar"}
                  </Button>
                }
              />
              {isToday(startAt) && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3 text-center">
                  <p className="text-xs text-gray-500">Código de check-in de hoy</p>
                  <p className="font-mono text-lg font-bold tracking-widest">
                    {booking.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <EmptyState
            icon={tab === "proximas" ? "📅" : "🗂️"}
            title={tab === "proximas" ? "No tienes clases próximas" : "Sin historial todavía"}
            description={
              tab === "proximas"
                ? "Ve a Reservar para elegir tu próxima clase."
                : "Aquí verás tus clases pasadas y canceladas."
            }
          />
        )}
      </div>
    </div>
  );
}
