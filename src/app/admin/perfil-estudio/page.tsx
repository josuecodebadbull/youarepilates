"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ExternalLink, ImagePlus } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  DEFAULT_TENANT_PROFILE,
  draftFromProfile,
  profileFromDraft,
  type ProfileDraft,
} from "@/lib/tenantProfile";
import { Button } from "@/components/ui/Button";
import { FileInput } from "@/components/ui/FileInput";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudioProfileFields } from "@/components/admin/StudioProfileFields";

export default function PerfilEstudioPage() {
  const { tenantId, tenant } = useTenant();
  const profile = tenant.profile ?? DEFAULT_TENANT_PROFILE;

  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile));
  const [heroImageUrl, setHeroImageUrl] = useState(profile.heroImageUrl);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Warn before losing edits by closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function setPreviewFor(file: File | null) {
    setHeroPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleHeroChange(file: File | null) {
    setHeroFile(file);
    setDirty(true);
    setSaved(false);
    setPreviewFor(file);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      let nextHeroImageUrl = heroImageUrl;
      if (heroFile) {
        const { blob, contentType, extension } = await optimizeImage(heroFile);
        const heroRef = ref(storage, `tenants/${tenantId}/profile/hero.${extension}`);
        await uploadBytes(heroRef, blob, { contentType });
        nextHeroImageUrl = await getDownloadURL(heroRef);
      }

      const next = profileFromDraft(draft, nextHeroImageUrl);
      await updateDoc(doc(db, "tenants", tenantId), { profile: next });

      setHeroImageUrl(nextHeroImageUrl);
      setHeroFile(null);
      setPreviewFor(null);
      // Show the cleaned-up values so the admin sees what students will get.
      setDraft(draftFromProfile(next));
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const displayedHeroUrl = heroPreviewUrl ?? heroImageUrl;

  const photoSlot = (
    <FormField
      label="Foto principal"
      htmlFor="hero-photo"
      hint="Horizontal, de preferencia 4:3. Se muestra grande junto al nombre del estudio."
    >
      <div className="space-y-3">
        <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {displayedHeroUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayedHeroUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
          )}
        </div>
        <FileInput
          id="hero-photo"
          accept="image/*"
          onChange={handleHeroChange}
          buttonLabel={displayedHeroUrl ? "Cambiar foto" : "Subir foto"}
        />
        {displayedHeroUrl && (
          <button
            type="button"
            onClick={() => {
              setHeroImageUrl(null);
              handleHeroChange(null);
            }}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Quitar foto
          </button>
        )}
      </div>
    </FormField>
  );

  return (
    <div>
      <PageHeader
        title="Perfil del estudio"
        description="Lo que tus alumnos ven en la sección 'Estudio' de su app. La dirección, el teléfono y las fotos de cada sede se editan en Sedes."
        action={
          <Link
            href={`/s/${tenant.slug}/estudio`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-50"
          >
            Ver como alumno <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        }
      />

      <div className="max-w-2xl pb-24">
        <StudioProfileFields
          value={draft}
          onChange={(next) => {
            setDraft(next);
            setDirty(true);
            setSaved(false);
          }}
          photoSlot={photoSlot}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur md:left-60">
        <div className="flex max-w-2xl items-center gap-3 px-4 py-3 md:px-8">
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          {saved && <span className="text-sm text-brand-700">Guardado ✓</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          {dirty && !saving && !error && (
            <span className="text-sm text-ink-soft">Tienes cambios sin guardar</span>
          )}
        </div>
      </div>
    </div>
  );
}
