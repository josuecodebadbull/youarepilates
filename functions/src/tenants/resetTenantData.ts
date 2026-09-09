import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminDb } from "../lib/admin";
import { requireRole } from "../lib/authz";

/**
 * Wipes a tenant's business/catalog data (sedes, salas, tipos de clase, instructores,
 * paquetes, horarios, reservas, lista de espera, créditos, firmas de responsiva) so an
 * owner can start over during testing. Deliberately does NOT delete the tenant document
 * itself (name/slug/perfil/carta responsiva stay) or any student's login account —
 * those are separate identities, not "estudio" data, and deleting Auth accounts is not
 * reversible.
 */
export const resetTenantData = onCall(async (request) => {
  const claims = requireRole(request, "tenant_owner");
  if (!claims.tenantId) {
    throw new HttpsError("failed-precondition", "Tu cuenta no está asignada a ningún estudio.");
  }

  const tenantRef = adminDb.collection("tenants").doc(claims.tenantId);
  const nestedCollections = [
    "branches",
    "classTypes",
    "instructors",
    "packages",
    "schedules",
    "bookings",
    "waitlist",
    "studentPasses",
    "waiverSignatures",
  ];

  for (const name of nestedCollections) {
    await adminDb.recursiveDelete(tenantRef.collection(name));
  }

  // purchaseIntents lives at the root (keyed by tenantId, not nested) — delete this
  // tenant's docs directly instead of recursiveDelete.
  const purchaseIntentsSnap = await adminDb
    .collection("purchaseIntents")
    .where("tenantId", "==", claims.tenantId)
    .get();
  if (!purchaseIntentsSnap.empty) {
    const batch = adminDb.batch();
    purchaseIntentsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  return { reset: true };
});
