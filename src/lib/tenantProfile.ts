import type { TenantProfile } from "@/lib/types/firestore";

/**
 * Fallback used wherever `tenant.profile` might be missing — tenants created before
 * this feature existed don't have it in Firestore yet, and it's only backfilled once
 * an owner saves the admin "Perfil del estudio" form.
 */
export const DEFAULT_TENANT_PROFILE: TenantProfile = {
  description: "",
  heroImageUrl: null,
  instagramUrl: "",
  whatsapp: "",
  email: "",
  policies: "",
  amenities: [],
};
