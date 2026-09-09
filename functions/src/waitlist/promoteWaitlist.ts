import type {
  CollectionReference,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";

import { Timestamp } from "../lib/admin";
import type { BookingDoc, ScheduleDoc, StudentPassDoc, WaitlistEntryDoc } from "../lib/types";

export interface PromotionResult {
  /** bookedCount/waitlistCount after cancellation AND any promotions — write these once. */
  bookedCount: number;
  waitlistCount: number;
}

/**
 * Pops the front of the waitlist (lowest `position`) and tries to confirm a booking for
 * them, charging a credit the same way `bookClassSession` does. If that student has no
 * valid pass left, their entry is dropped and the *next* entry is tried, up to a small
 * bound — this keeps promotion synchronous with the cancellation instead of needing a
 * separate queue worker, which is enough for MVP traffic. A production version would
 * hand off to a Cloud Tasks queue to avoid unbounded transaction work on a busy class.
 *
 * Returns the final bookedCount/waitlistCount instead of writing `scheduleRef` itself —
 * the caller (cancelBookingSession) writes it once, so the cancel's own decrement and
 * this function's promotions can't clobber each other inside the same transaction.
 */
export async function promoteNextWaitlistEntry(
  tx: Transaction,
  tenantRef: DocumentReference,
  scheduleRef: DocumentReference,
  schedule: ScheduleDoc,
): Promise<PromotionResult> {
  const fallback: PromotionResult = {
    bookedCount: schedule.bookedCount,
    waitlistCount: schedule.waitlistCount,
  };

  const waitlistCollection = tenantRef.collection("waitlist") as CollectionReference<WaitlistEntryDoc>;
  const classTypeSnap = await tx.get(tenantRef.collection("classTypes").doc(schedule.classTypeId));
  if (!classTypeSnap.exists) return fallback;
  const requiredCredits = (classTypeSnap.data() as { requiredCredits: number }).requiredCredits;

  const candidatesSnap = await tx.get(
    waitlistCollection.where("scheduleId", "==", scheduleRef.id).orderBy("position", "asc").limit(5),
  );

  const now = Timestamp.now();
  let remainingCapacity = schedule.capacity - schedule.bookedCount;
  let waitlistDelta = 0;

  for (const entryDoc of candidatesSnap.docs) {
    if (remainingCapacity <= 0) break;

    const entry = entryDoc.data();
    const passesSnap = await tx.get(
      tenantRef
        .collection("studentPasses")
        .where("studentId", "==", entry.studentId)
        .where("status", "==", "active")
        .orderBy("expiresAt", "asc"),
    );

    const validPass = passesSnap.docs.find((doc) => {
      const pass = doc.data() as StudentPassDoc;
      return pass.remainingCredits >= requiredCredits && pass.expiresAt.toMillis() > now.toMillis();
    });

    if (!validPass) {
      // No usable credits anymore — drop them from the queue and try the next one.
      tx.delete(entryDoc.ref);
      waitlistDelta -= 1;
      continue;
    }

    const pass = validPass.data() as StudentPassDoc;
    const remainingCredits = pass.remainingCredits - requiredCredits;
    tx.update(validPass.ref, {
      remainingCredits,
      status: remainingCredits === 0 ? "depleted" : "active",
    });

    const bookingRef = tenantRef.collection("bookings").doc();
    tx.set(bookingRef, {
      scheduleId: scheduleRef.id,
      studentId: entry.studentId,
      spotNumber: null,
      status: "confirmed",
      passUsedId: validPass.id,
      createdAt: now,
      canceledAt: null,
    } satisfies BookingDoc);

    tx.delete(entryDoc.ref);
    remainingCapacity -= 1;
    waitlistDelta -= 1;

    // TODO (Fase 4): send an FCM push ("¡Se liberó tu lugar!") to entry.studentId here.
    break;
  }

  return {
    bookedCount: schedule.capacity - remainingCapacity,
    waitlistCount: Math.max(0, schedule.waitlistCount + waitlistDelta),
  };
}
