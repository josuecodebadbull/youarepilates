import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminDb, Timestamp } from "../lib/admin";
import { requireRole } from "../lib/authz";
import type { BookingDoc, ClassTypeDoc, ScheduleDoc, StudentPassDoc, TenantDoc } from "../lib/types";
import { promoteNextWaitlistEntry } from "../waitlist/promoteWaitlist";

interface CancelBookingInput {
  bookingId: string;
  /** Staff/owner only: refund the credit even when the cancel window has passed. */
  forceRefund?: boolean;
}

interface CancelBookingResult {
  status: "canceled" | "canceled_late";
  creditRefunded: boolean;
}

/** Flujo B del spec: ventana de cancelación, penalización de crédito tardío, reasignación de waitlist. */
export const cancelBookingSession = onCall<CancelBookingInput>(async (request) => {
  const claims = requireRole(request, "student", "staff", "tenant_owner");
  const { bookingId, forceRefund = false } = request.data ?? ({} as CancelBookingInput);
  if (!bookingId) {
    throw new HttpsError("invalid-argument", "bookingId es requerido.");
  }

  const tenantId = claims.tenantId;
  if (!tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está ligada a un estudio.");
  }

  const callerId = request.auth!.uid;
  const tenantRef = adminDb.collection("tenants").doc(tenantId);
  const bookingRef = tenantRef.collection("bookings").doc(bookingId);

  const result = await adminDb.runTransaction<CancelBookingResult>(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) {
      throw new HttpsError("not-found", "La reserva no existe.");
    }
    const booking = bookingSnap.data() as BookingDoc;

    if (booking.status !== "confirmed") {
      throw new HttpsError("failed-precondition", "Esta reserva ya no está activa.");
    }
    if (claims.role === "student" && booking.studentId !== callerId) {
      throw new HttpsError("permission-denied", "No puedes cancelar la reserva de otra persona.");
    }

    const [tenantSnap, scheduleSnap] = await Promise.all([
      tx.get(tenantRef),
      tx.get(tenantRef.collection("schedules").doc(booking.scheduleId)),
    ]);
    if (!scheduleSnap.exists) {
      throw new HttpsError("internal", "La clase asociada ya no existe.");
    }
    const classTypeSnap = await tx.get(
      tenantRef.collection("classTypes").doc((scheduleSnap.data() as ScheduleDoc).classTypeId),
    );
    // Refund what the booking actually charged, not a flat 1 credit.
    const creditsToRefund = (classTypeSnap.data() as ClassTypeDoc | undefined)?.requiredCredits ?? 1;

    const tenant = tenantSnap.data() as TenantDoc;
    const schedule = scheduleSnap.data() as ScheduleDoc;
    const scheduleRef = scheduleSnap.ref;

    const hoursUntilClass =
      (schedule.startAt.toMillis() - Timestamp.now().toMillis()) / (1000 * 60 * 60);
    const isOnTime =
      hoursUntilClass >= tenant.settings.cancelWindowHours ||
      (forceRefund && claims.role !== "student");

    let creditRefunded = false;
    if (isOnTime && booking.passUsedId) {
      const passRef = tenantRef.collection("studentPasses").doc(booking.passUsedId);
      const passSnap = await tx.get(passRef);
      if (passSnap.exists) {
        const pass = passSnap.data() as StudentPassDoc;
        tx.update(passRef, {
          remainingCredits: pass.remainingCredits + creditsToRefund,
          status: "active",
        });
        creditRefunded = true;
      }
    }

    const newStatus = isOnTime ? "canceled" : "canceled_late";
    tx.update(bookingRef, { status: newStatus, canceledAt: Timestamp.now() });

    const takenSpotsAfterCancel =
      booking.spotNumber !== null
        ? (schedule.takenSpots ?? []).filter((s) => s !== booking.spotNumber)
        : (schedule.takenSpots ?? []);

    const scheduleAfterCancel: ScheduleDoc = {
      ...schedule,
      bookedCount: Math.max(0, schedule.bookedCount - 1),
      takenSpots: takenSpotsAfterCancel,
    };

    const final =
      schedule.waitlistCount > 0
        ? await promoteNextWaitlistEntry(tx, tenantRef, scheduleRef, scheduleAfterCancel)
        : { bookedCount: scheduleAfterCancel.bookedCount, waitlistCount: scheduleAfterCancel.waitlistCount };

    tx.update(scheduleRef, {
      bookedCount: final.bookedCount,
      waitlistCount: final.waitlistCount,
      takenSpots: takenSpotsAfterCancel,
    });

    return { status: newStatus, creditRefunded };
  });

  return result;
});
