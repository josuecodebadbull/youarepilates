"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BookingDoc } from "@/lib/types/firestore";

interface Booking extends BookingDoc {
  id: string;
}

/**
 * "Mi ticket" — today's confirmed booking with its check-in code. Firestore's local
 * persistence (see lib/firebase/client.ts) means this keeps rendering the last
 * synced booking even with no network, which is the offline requirement from the spec.
 */
export default function MiTicketPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysBookingsQuery = query(
      collection(db, "tenants", tenantId, "bookings"),
      where("studentId", "==", user.uid),
      where("status", "==", "confirmed"),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(todaysBookingsQuery, (snapshot) => {
      const doc = snapshot.docs[0];
      setBooking(doc ? { id: doc.id, ...(doc.data() as BookingDoc) } : null);
    });
  }, [tenantId, user]);

  if (!user) {
    return <p className="text-sm text-gray-500">Inicia sesión para ver tu ticket.</p>;
  }

  if (!booking) {
    return <p className="text-sm text-gray-500">No tienes una clase reservada para hoy.</p>;
  }

  return (
    <div className="mx-auto max-w-xs rounded-xl border border-gray-200 bg-white p-6 text-center">
      <p className="text-sm text-gray-500">Código de check-in</p>
      <p className="mt-2 break-all font-mono text-2xl font-bold tracking-widest">
        {booking.id.slice(0, 8).toUpperCase()}
      </p>
      <p className="mt-4 text-sm text-gray-500">Muéstralo en recepción al llegar al estudio.</p>
    </div>
  );
}
