import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { TenantDoc } from "@/lib/types/firestore";

export interface ResolvedTenant {
  id: string;
  // No `createdAt` here: it's an Admin SDK Timestamp instance, and Next.js can't
  // serialize a class instance across the server -> client component boundary
  // (this value gets passed into <StudentProviders>, a client component). Nothing
  // in the student PWA needs it, so it's dropped at the source instead of faked
  // into a plain value.
  data: Omit<TenantDoc, "createdAt">;
}

/**
 * Looks up a tenant by its public slug (the `/s/[tenantSlug]` path segment).
 * Used server-side in layouts/route handlers so branding and manifest metadata
 * are available on first paint, before any client-side Firestore read.
 */
export async function getTenantBySlug(slug: string): Promise<ResolvedTenant | null> {
  const snapshot = await adminDb
    .collection("tenants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0]!;
  const { createdAt: _createdAt, ...data } = doc.data() as TenantDoc;
  return { id: doc.id, data };
}
