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

/** Accepts "@tuestudio", "tuestudio", "instagram.com/tuestudio" or a full URL; returns a full URL ("" if empty). */
export function normalizeInstagram(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

/** Digits only, with Mexico's country code (52) added to a bare 10-digit number. */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
}

/** Amenities people commonly list — one tap to add in the admin. */
export const AMENITY_SUGGESTIONS = [
  "Regaderas",
  "Lockers",
  "Agua purificada",
  "Grupos reducidos",
  "Calcetas a la venta",
  "Wi-Fi",
  "Estacionamiento",
  "Toallas",
  "Vestidores",
];

/** The text fields of the studio profile as edited in a form (photo handled separately). */
export interface ProfileDraft {
  tagline: string;
  description: string;
  whatsapp: string;
  instagram: string;
  email: string;
  policies: string;
  amenities: string[];
}

export function draftFromProfile(profile: TenantProfile): ProfileDraft {
  return {
    tagline: profile.tagline ?? "",
    description: profile.description,
    whatsapp: profile.whatsapp,
    instagram: profile.instagramUrl,
    email: profile.email,
    policies: profile.policies,
    amenities: profile.amenities,
  };
}

/** Cleans a form draft into what gets stored (and shown to students). */
export function profileFromDraft(draft: ProfileDraft, heroImageUrl: string | null): TenantProfile {
  return {
    tagline: draft.tagline.trim(),
    description: draft.description.trim(),
    heroImageUrl,
    instagramUrl: normalizeInstagram(draft.instagram),
    whatsapp: normalizeWhatsapp(draft.whatsapp),
    email: draft.email.trim(),
    policies: draft.policies.trim(),
    amenities: draft.amenities,
  };
}
