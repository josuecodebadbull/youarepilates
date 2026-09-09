import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminDb, Timestamp } from "../lib/admin";
import { requireRole } from "../lib/authz";
import type {
  BookingDoc,
  ClassTypeDoc,
  ScheduleDoc,
  StudentPassDoc,
  TenantDoc,
  UserDoc,
  WaitlistEntryDoc,
} from "../lib/types";

interface BookClassSessionInput {
  scheduleId: string;
}

interface BookClassSessionResult {
  bookingId: string;
  status: "confirmed" | "waitlisted";
}

/**
 * Flujo A del spec: transacción atómica de reserva. Todo lo que decide si la clase está
 * llena, si el alumno ya tiene créditos vigentes, o si ya está inscrito, se lee y escribe
 * dentro de la misma transacción de Firestore — así dos alumnos reservando el último lugar
 * en el mismo instante nunca pueden sobrevender la clase (uno de los dos reintentará la
 * transacción con datos frescos y verá `bookedCount === capacity`).
 */
export const bookClassSession = onCall<BookClassSessionInput>(async (request) => {
  const claims = requireRole(request, "student");
  const { scheduleId } = request.data ?? ({} as BookClassSessionInput);
  if (!scheduleId) {
    throw new HttpsError("invalid-argument", "scheduleId es requerido.");
  }

  const tenantId = claims.tenantId;
  if (!tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está ligada a un estudio.");
  }

  const studentId = request.auth!.uid;
  const tenantRef = adminDb.collection("tenants").doc(tenantId);
  const scheduleRef = tenantRef.collection("schedules").doc(scheduleId);

  const result = await adminDb.runTransaction<BookClassSessionResult>(async (tx) => {
    const scheduleSnap = await tx.get(scheduleRef);
    if (!scheduleSnap.exists) {
      throw new HttpsError("not-found", "La clase no existe.");
    }
    const schedule = scheduleSnap.data() as ScheduleDoc;
    if (schedule.status !== "scheduled") {
      throw new HttpsError("failed-precondition", "Esta clase ya no admite reservas.");
    }

    const existingBookingSnap = await tx.get(
      tenantRef
        .collection("bookings")
        .where("scheduleId", "==", scheduleId)
        .where("studentId", "==", studentId)
        .where("status", "==", "confirmed")
        .limit(1),
    );
    if (!existingBookingSnap.empty) {
      throw new HttpsError("already-exists", "Ya estás inscrito en esta clase.");
    }

    const classTypeSnap = await tx.get(tenantRef.collection("classTypes").doc(schedule.classTypeId));
    if (!classTypeSnap.exists) {
      throw new HttpsError("internal", "El tipo de clase no está configurado.");
    }
    const classType = classTypeSnap.data() as ClassTypeDoc;

    if (classType.level === "avanzado") {
      const [tenantSnap, userSnap] = await Promise.all([
        tx.get(tenantRef),
        tx.get(adminDb.collection("users").doc(studentId)),
      ]);
      const tenant = tenantSnap.data() as TenantDoc;
      const user = userSnap.data() as UserDoc | undefined;
      const validated = user?.validatedBasicClasses ?? 0;
      if (validated < tenant.settings.minBasicClassesForAdvanced) {
        throw new HttpsError(
          "failed-precondition",
          `Necesitas al menos ${tenant.settings.minBasicClassesForAdvanced} clases básicas validadas por un coach para tomar esta clase.`,
        );
      }
    }

    // Clase llena -> lista de espera FIFO, sin cobrar créditos todavía.
    if (schedule.bookedCount >= schedule.capacity) {
      const waitlistRef = tenantRef.collection("waitlist").doc();
      tx.set(waitlistRef, {
        scheduleId,
        studentId,
        position: schedule.waitlistCount + 1,
        createdAt: Timestamp.now(),
      } satisfies WaitlistEntryDoc);
      tx.update(scheduleRef, { waitlistCount: schedule.waitlistCount + 1 });
      return { bookingId: waitlistRef.id, status: "waitlisted" };
    }

    const now = Timestamp.now();
    const passesSnap = await tx.get(
      tenantRef
        .collection("studentPasses")
        .where("studentId", "==", studentId)
        .where("status", "==", "active")
        .orderBy("expiresAt", "asc"),
    );

    const validPassDoc = passesSnap.docs.find((doc) => {
      const pass = doc.data() as StudentPassDoc;
      return pass.remainingCredits >= classType.requiredCredits && pass.expiresAt.toMillis() > now.toMillis();
    });

    if (!validPassDoc) {
      throw new HttpsError("failed-precondition", "No tienes créditos suficientes o vigentes.");
    }

    const pass = validPassDoc.data() as StudentPassDoc;
    const remainingCredits = pass.remainingCredits - classType.requiredCredits;

    tx.update(validPassDoc.ref, {
      remainingCredits,
      status: remainingCredits === 0 ? "depleted" : "active",
    });
    tx.update(scheduleRef, { bookedCount: schedule.bookedCount + 1 });

    const bookingRef = tenantRef.collection("bookings").doc();
    tx.set(bookingRef, {
      scheduleId,
      studentId,
      spotNumber: null,
      status: "confirmed",
      passUsedId: validPassDoc.id,
      createdAt: now,
      canceledAt: null,
    } satisfies BookingDoc);

    return { bookingId: bookingRef.id, status: "confirmed" };
  });

  return result;
});
