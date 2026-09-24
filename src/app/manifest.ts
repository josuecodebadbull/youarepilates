import type { MetadataRoute } from "next";

/**
 * Manifest for the studio-owner panel PWA — installed from the landing page. The student
 * app has its own per-studio manifest under /s/[tenantSlug] (scope and id differ, so the
 * two install as separate apps).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "YouArePilates · Panel",
    short_name: "YP Panel",
    description: "Administra tu estudio de Pilates: clases, alumnos, créditos y reservas.",
    lang: "es",
    start_url: "/admin",
    // "/" so the login and onboarding pages the panel redirects to stay inside the app.
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FAF9F6",
    theme_color: "#1A594E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
