import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminAuth, adminDb } from "../lib/admin";
import type { AuthClaims } from "../lib/types";

interface RegisterStudentInput {
  tenantId: string;
  displayName: string;
}

/** Called right after Auth signup from a tenant's student PWA (`/s/[tenantSlug]/login`). */
export const registerStudent = onCall<RegisterStudentInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const { tenantId, displayName } = request.data ?? ({} as RegisterStudentInput);
  if (!tenantId) {
    throw new HttpsError("invalid-argument", "tenantId es requerido.");
  }

  const tenantSnap = await adminDb.collection("tenants").doc(tenantId).get();
  if (!tenantSnap.exists) {
    throw new HttpsError("not-found", "El estudio no existe.");
  }

  const claims: AuthClaims = { tenantId, role: "student", branchIds: [] };
  await adminAuth.setCustomUserClaims(request.auth.uid, claims);
  await adminDb.collection("users").doc(request.auth.uid).set(
    {
      tenantId,
      role: "student",
      // Only touch displayName when a real one was provided — this function also runs
      // as a "heal my orphaned account" retry from the login page (no displayName in
      // hand at that point), and must never blank out a name the student already set.
      ...(displayName ? { displayName } : {}),
    },
    { merge: true },
  );

  return { tenantId };
});
