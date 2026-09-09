"use client";

import { type CSSProperties, type ReactNode } from "react";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import type { TenantDoc } from "@/lib/types/firestore";

export function StudentProviders({
  tenantId,
  tenant,
  children,
}: {
  tenantId: string;
  tenant: TenantDoc;
  children: ReactNode;
}) {
  const brandVars = {
    "--tenant-primary": tenant.branding.primaryHex,
    "--tenant-secondary": tenant.branding.secondaryHex,
  } as CSSProperties;

  return (
    <div style={brandVars}>
      <AuthProvider>
        <TenantProvider tenantId={tenantId} tenant={tenant}>
          {children}
        </TenantProvider>
      </AuthProvider>
    </div>
  );
}
