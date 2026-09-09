import * as functionsV1 from "firebase-functions/v1";

import { adminAuth, adminDb } from "../lib/admin";
import type { AuthClaims, UserDoc } from "../lib/types";

/**
 * Runs right after Firebase Auth creates a new account (email/password or social).
 * Gives every user a safe default: student role, no tenant yet. `onboardTenant` (studio
 * owners) and `registerStudent` (students joining a specific studio) promote from here
 * by writing real custom claims once the caller tells us which tenant they belong to.
 */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const defaultClaims: AuthClaims = { tenantId: null, role: "student", branchIds: [] };
  await adminAuth.setCustomUserClaims(user.uid, defaultClaims);

  const userDoc: UserDoc = {
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    role: "student",
    tenantId: null,
    validatedBasicClasses: 0,
  };
  await adminDb.collection("users").doc(user.uid).set(userDoc, { merge: true });
});
