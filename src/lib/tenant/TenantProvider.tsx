"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { TenantDoc } from "@/lib/types/firestore";

export interface TenantContextValue {
  tenantId: string;
  tenant: TenantDoc;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenantId,
  tenant,
  children,
}: TenantContextValue & { children: ReactNode }) {
  return (
    <TenantContext.Provider value={{ tenantId, tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

/** Throws if used outside a `/s/[tenantSlug]` or `/admin` subtree — every screen there has a tenant. */
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant() must be used within a <TenantProvider>");
  }
  return ctx;
}
