"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase/client";
import type { AuthClaims, UserRole } from "@/lib/types/firestore";

interface AuthState {
  user: User | null;
  claims: AuthClaims | null;
  /** True while the initial auth state (and its custom claims) is still resolving. */
  loading: boolean;
}

const defaultClaims: AuthClaims = { tenantId: null, role: "student", branchIds: [] };

const AuthContext = createContext<AuthState>({
  user: null,
  claims: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    // onIdTokenChanged (not onAuthStateChanged) so a custom-claims refresh after
    // role changes or tenant onboarding is picked up without a manual reload.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, claims: null, loading: false });
        return;
      }

      const tokenResult = await user.getIdTokenResult();
      const claims: AuthClaims = {
        tenantId: (tokenResult.claims.tenantId as string | undefined) ?? null,
        role: (tokenResult.claims.role as UserRole | undefined) ?? defaultClaims.role,
        branchIds: (tokenResult.claims.branchIds as string[] | undefined) ?? [],
      };

      setState({ user, claims, loading: false });
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function hasRole(claims: AuthClaims | null, ...roles: UserRole[]): boolean {
  return claims !== null && roles.includes(claims.role);
}

export function hasBranchAccess(claims: AuthClaims | null, branchId: string): boolean {
  if (claims === null) return false;
  if (claims.role === "tenant_owner" || claims.role === "superadmin") return true;
  return claims.branchIds.includes(branchId);
}
