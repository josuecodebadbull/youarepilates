import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { Query } from "firebase-admin/firestore";

import { adminDb, Timestamp } from "../lib/admin";
import { requireRole } from "../lib/authz";
import type { TenantDoc, UserDoc, WaiverSignatureDoc } from "../lib/types";

interface CreateStudentProfileInput {
  displayName: string;
  phone?: string;
  email?: string;
}

/**
 * Creates a student the studio can book and sell credits to before they have an account.
 * It's a plain `users` doc with a generated id and `hasAccount: false`; every booking,
 * pass and waitlist entry keys off that id exactly like a real uid, so nothing else needs
 * to know the difference until `linkStudentProfile` moves it onto a real account.
 */
export const createStudentProfile = onCall<CreateStudentProfileInput>(async (request) => {
  const claims = requireRole(request, "staff", "tenant_owner");
  const tenantId = claims.tenantId;
  if (!tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está ligada a un estudio.");
  }

  const displayName = request.data?.displayName?.trim();
  const phone = request.data?.phone?.trim() ?? "";
  const email = request.data?.email?.trim().toLowerCase() ?? "";
  if (!displayName) {
    throw new HttpsError("invalid-argument", "El nombre es requerido.");
  }

  if (email) {
    const duplicate = await adminDb
      .collection("users")
      .where("tenantId", "==", tenantId)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!duplicate.empty) {
      throw new HttpsError("already-exists", "Ya existe un alumno con ese correo.");
    }
  }

  const ref = adminDb.collection("users").doc();
  const profile: UserDoc = {
    email,
    displayName,
    phone,
    role: "student",
    tenantId,
    validatedBasicClasses: 0,
    hasAccount: false,
  };
  await ref.set(profile);
  return { studentId: ref.id };
});

interface LinkStudentProfileInput {
  profileId: string;
  accountId: string;
}

/** Firestore batches cap at 500 writes; stay well under. */
const BATCH_SIZE = 400;

async function repoint(query: Query, accountId: string): Promise<number> {
  const snap = await query.get();
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.update(doc.ref, { studentId: accountId }));
    await batch.commit();
  }
  return snap.size;
}

/**
 * Merges a hand-made profile into the student's real account once they sign up: their
 * bookings, credits, waitlist spots and waiver signatures move to the real uid, and the
 * placeholder is deleted. Manual (staff-confirmed) on purpose — linking by email alone
 * would let anyone who signs up with someone else's address inherit their credits.
 * Safe to retry: the profile is deleted last, so a failure midway leaves it in place.
 */
export const linkStudentProfile = onCall<LinkStudentProfileInput>(async (request) => {
  const claims = requireRole(request, "staff", "tenant_owner");
  const tenantId = claims.tenantId;
  if (!tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está ligada a un estudio.");
  }
  const { profileId, accountId } = request.data ?? ({} as LinkStudentProfileInput);
  if (!profileId || !accountId || profileId === accountId) {
    throw new HttpsError("invalid-argument", "profileId y accountId son requeridos y distintos.");
  }

  const profileRef = adminDb.collection("users").doc(profileId);
  const accountRef = adminDb.collection("users").doc(accountId);
  const [profileSnap, accountSnap] = await Promise.all([profileRef.get(), accountRef.get()]);
  const profile = profileSnap.data() as UserDoc | undefined;
  const account = accountSnap.data() as UserDoc | undefined;

  if (!profile || profile.tenantId !== tenantId || profile.hasAccount !== false) {
    throw new HttpsError("not-found", "El perfil sin cuenta no existe en este estudio.");
  }
  if (!account || account.tenantId !== tenantId || account.role !== "student" || account.hasAccount === false) {
    throw new HttpsError("not-found", "La cuenta del alumno no existe en este estudio.");
  }

  const tenantRef = adminDb.collection("tenants").doc(tenantId);
  const byProfile = (collection: string) =>
    tenantRef.collection(collection).where("studentId", "==", profileId);

  const [bookings, passes, waitlist, signatures] = await Promise.all([
    repoint(byProfile("bookings"), accountId),
    repoint(byProfile("studentPasses"), accountId),
    repoint(byProfile("waitlist"), accountId),
    repoint(byProfile("waiverSignatures"), accountId),
  ]);

  const update: Partial<UserDoc> = {};
  const carriedClasses = profile.validatedBasicClasses ?? 0;
  if (carriedClasses > 0) {
    update.validatedBasicClasses = (account.validatedBasicClasses ?? 0) + carriedClasses;
  }
  // Keep whatever contact info the real account is missing.
  if (!account.phone && profile.phone) update.phone = profile.phone;
  if (!account.displayName && profile.displayName) update.displayName = profile.displayName;
  if (Object.keys(update).length > 0) await accountRef.update(update);

  await profileRef.delete();
  return { moved: { bookings, passes, waitlist, signatures } };
});

interface RecordPaperWaiverInput {
  studentId: string;
}

/** Staff records that the student signed the current waiver on paper at the studio. */
export const recordPaperWaiver = onCall<RecordPaperWaiverInput>(async (request) => {
  const claims = requireRole(request, "staff", "tenant_owner");
  const tenantId = claims.tenantId;
  const studentId = request.data?.studentId;
  if (!tenantId || !studentId) {
    throw new HttpsError("invalid-argument", "studentId es requerido.");
  }

  const tenantRef = adminDb.collection("tenants").doc(tenantId);
  const [tenantSnap, studentSnap] = await Promise.all([
    tenantRef.get(),
    adminDb.collection("users").doc(studentId).get(),
  ]);
  const student = studentSnap.data() as UserDoc | undefined;
  if (!student || student.tenantId !== tenantId) {
    throw new HttpsError("not-found", "El alumno no pertenece a este estudio.");
  }
  const version = (tenantSnap.data() as TenantDoc).waiver?.version ?? 0;
  if (version === 0) {
    throw new HttpsError("failed-precondition", "Tu estudio no tiene carta responsiva configurada.");
  }

  const existing = await tenantRef
    .collection("waiverSignatures")
    .where("studentId", "==", studentId)
    .where("version", "==", version)
    .limit(1)
    .get();
  if (!existing.empty) return { alreadySigned: true };

  await tenantRef.collection("waiverSignatures").add({
    studentId,
    version,
    fullNameTyped: student.displayName,
    signedAt: Timestamp.now(),
    method: "paper",
    recordedBy: request.auth!.uid,
  } satisfies WaiverSignatureDoc);
  return { alreadySigned: false };
});
