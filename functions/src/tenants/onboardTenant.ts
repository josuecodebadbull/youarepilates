import { HttpsError, onCall } from "firebase-functions/v2/https";

import { adminAuth, adminDb, Timestamp } from "../lib/admin";
import type { AuthClaims, TenantDoc } from "../lib/types";

interface OnboardTenantInput {
  studioName: string;
}

interface OnboardTenantResult {
  tenantId: string;
  slug: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const tenantsRef = adminDb.collection("tenants");
  let candidate = base || "estudio";
  let suffix = 0;

  while (true) {
    const existing = await tenantsRef.where("slug", "==", candidate).limit(1).get();
    if (existing.empty) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

/**
 * Self-serve tenant signup from the commercial landing page. The caller must already
 * have a Firebase Auth account (created client-side right before this call) — this
 * function turns that bare account into a Tenant Owner: creates the tenant document
 * with sane defaults and re-issues custom claims so the very next ID token carries
 * `role: tenant_owner` and the new `tenantId`.
 */
export const onboardTenant = onCall<OnboardTenantInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const studioName = request.data?.studioName?.trim();
  if (!studioName) {
    throw new HttpsError("invalid-argument", "El nombre del estudio es requerido.");
  }

  const slug = await uniqueSlug(slugify(studioName));
  const tenantRef = adminDb.collection("tenants").doc();

  const tenant: TenantDoc = {
    name: studioName,
    slug,
    branding: { logoUrl: null, primaryHex: "#1f2937", secondaryHex: "#6b7280" },
    settings: { cancelWindowHours: 2, lateCancelPenaltyCredits: 1, minBasicClassesForAdvanced: 8 },
    subscriptionStatus: "active",
    createdAt: Timestamp.now(),
  };

  await tenantRef.set(tenant);

  const claims: AuthClaims = { tenantId: tenantRef.id, role: "tenant_owner", branchIds: [] };
  await adminAuth.setCustomUserClaims(request.auth.uid, claims);
  await adminDb.collection("users").doc(request.auth.uid).set(
    { role: "tenant_owner", tenantId: tenantRef.id },
    { merge: true },
  );

  return { tenantId: tenantRef.id, slug } satisfies OnboardTenantResult;
});
