import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getTenantBySlug } from "@/lib/tenant/resolveTenant";
import { StudentProviders } from "@/components/student/StudentProviders";
import { StudentShell } from "@/components/student/StudentShell";
import { ServiceWorkerRegistration } from "@/components/student/ServiceWorkerRegistration";

// Live schedules/credits and auth-gated screens — never prerendered at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { tenantSlug: string };
}): Promise<Metadata> {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) return {};

  return {
    title: tenant.data.name,
    manifest: `/s/${params.tenantSlug}/manifest.webmanifest`,
  };
}

export async function generateViewport({
  params,
}: {
  params: { tenantSlug: string };
}): Promise<Viewport> {
  const tenant = await getTenantBySlug(params.tenantSlug);
  return { themeColor: tenant?.data.branding.primaryHex };
}

export default async function StudentTenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) {
    notFound();
  }

  return (
    <StudentProviders tenantId={tenant.id} tenant={tenant.data}>
      <ServiceWorkerRegistration />
      <StudentShell>{children}</StudentShell>
    </StudentProviders>
  );
}
