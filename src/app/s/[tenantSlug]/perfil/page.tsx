"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BookingDoc, StudentPassDoc } from "@/lib/types/firestore";

interface Pass extends StudentPassDoc {
  id: string;
}

interface Booking extends BookingDoc {
  id: string;
}

export default function PerfilPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;

    const passesQuery = query(
      collection(db, "tenants", tenantId, "studentPasses"),
      where("studentId", "==", user.uid),
      where("status", "==", "active"),
    );
    const unsubPasses = onSnapshot(passesQuery, (snapshot) => {
      setPasses(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as StudentPassDoc) })));
    });

    const bookingsQuery = query(
      collection(db, "tenants", tenantId, "bookings"),
      where("studentId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as BookingDoc) })));
    });

    return () => {
      unsubPasses();
      unsubBookings();
    };
  }, [tenantId, user]);

  if (!user) {
    return <p className="text-sm text-gray-500">Inicia sesión para ver tu perfil.</p>;
  }

  const totalCredits = passes.reduce((sum, pass) => sum + pass.remainingCredits, 0);

  return (
    <div className="space-y-8 pb-16">
      <section>
        <h1 className="text-xl font-bold">Mis créditos</h1>
        <p className="mt-2 text-3xl font-bold">{totalCredits}</p>
        <ul className="mt-3 space-y-2">
          {passes.map((pass) => (
            <li key={pass.id} className="rounded-md border border-gray-200 p-3 text-sm">
              {pass.remainingCredits}/{pass.initialCredits} créditos · vence{" "}
              {pass.expiresAt.toDate().toLocaleDateString("es-MX")}
            </li>
          ))}
          {passes.length === 0 && (
            <li className="text-sm text-gray-500">No tienes paquetes activos.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Historial de reservas</h2>
        <ul className="mt-3 space-y-2">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-md border border-gray-200 p-3 text-sm">
              <span className="font-medium">{booking.status}</span>
              {" · "}
              {booking.createdAt.toDate().toLocaleString("es-MX")}
            </li>
          ))}
          {bookings.length === 0 && (
            <li className="text-sm text-gray-500">Todavía no tienes reservas.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
