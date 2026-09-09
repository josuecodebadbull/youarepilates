/**
 * Fallback used wherever `tenant.waiver` might be missing — tenants created before
 * this feature existed don't have it in Firestore yet. Version 0 means "no signature
 * required", matching the existing gating logic everywhere `waiver.version` is checked.
 */
export const DEFAULT_TENANT_WAIVER = {
  text: "",
  version: 0,
};
