import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { TenantDoc } from "@/lib/types/firestore";

export interface ResolvedTenant {
  id: string;
  data: TenantDoc;
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
  return { id: doc.id, data: doc.data() as TenantDoc };
}
