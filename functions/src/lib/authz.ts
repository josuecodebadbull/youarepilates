import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

import type { AuthClaims, UserRole } from "./types";

/** Pulls tenantId/role/branchIds off the verified ID token and asserts the caller is one of `roles`. */
export function requireRole<T>(request: CallableRequest<T>, ...roles: UserRole[]): AuthClaims {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const claims: AuthClaims = {
    tenantId: (auth.token.tenantId as string | undefined) ?? null,
    role: (auth.token.role as UserRole | undefined) ?? "student",
    branchIds: (auth.token.branchIds as string[] | undefined) ?? [],
  };

  if (!roles.includes(claims.role)) {
    throw new HttpsError("permission-denied", "No tienes permiso para esta acción.");
  }

  return claims;
}
