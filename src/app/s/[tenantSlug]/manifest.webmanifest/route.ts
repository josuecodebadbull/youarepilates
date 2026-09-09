import { NextResponse } from "next/server";

import { getTenantBySlug } from "@/lib/tenant/resolveTenant";

export async function GET(
  _request: Request,
  { params }: { params: { tenantSlug: string } },
) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const manifest = {
    name: tenant.data.name,
    short_name: tenant.data.name,
    start_url: `/s/${params.tenantSlug}`,
    scope: `/s/${params.tenantSlug}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: tenant.data.branding.primaryHex,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
