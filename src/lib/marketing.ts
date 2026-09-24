/**
 * The student app lives at /s/<studio-slug> (each studio has its own installable PWA).
 * The landing's "Descargar app" links there with `?instalar=1`, which opens the install
 * banner (see InstallAppPrompt). Override the slug per deployment with the env var.
 */
const STUDIO_SLUG = process.env.NEXT_PUBLIC_DEFAULT_STUDIO_SLUG ?? "you-are-pilates";

export const APP_INSTALL_HREF = `/s/${STUDIO_SLUG}?instalar=1`;
