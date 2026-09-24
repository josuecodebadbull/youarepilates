"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  DEFAULT_TENANT_PROFILE,
  draftFromProfile,
  profileFromDraft,
  type ProfileDraft,
} from "@/lib/tenantProfile";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudioProfileFields } from "@/components/admin/StudioProfileFields";
import { useToast } from "@/components/admin/Toast";

export default function PerfilEstudioPage() {
  const { tenantId, tenant } = useTenant();
  const toast = useToast();
  const profile = tenant.profile ?? DEFAULT_TENANT_PROFILE;
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile));
  const [heroImageUrl, setHeroImageUrl] = useState(profile.heroImageUrl);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Bumped after each save so the preview iframe reloads with the new version.
  const [previewKey, setPreviewKey] = useState(0);

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
    setPreviewFor(file);
  }

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
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
      setPreviewKey((k) => k + 1);
      toast("Perfil guardado");
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const displayedHeroUrl = heroPreviewUrl ?? heroImageUrl;
  const studentUrl = `/s/${tenant.slug}/estudio`;

  const photoSlot = (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-[4/3] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-2xl bg-[#F3F2EE]">
        {displayedHeroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayedHeroUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-8 w-8 text-ink-faint" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-10 rounded-xl border border-ink/[0.14] bg-white px-3.5 text-[13px] font-semibold text-ink"
        >
          {displayedHeroUrl ? "Cambiar foto" : "Subir foto"}
        </button>
        {displayedHeroUrl && (
          <button
            type="button"
            onClick={() => {
              setHeroImageUrl(null);
              handleHeroChange(null);
            }}
            className="h-10 px-3.5 text-[13px] font-semibold text-[#B42318]"
          >
            Quitar
          </button>
        )}
      </div>
      <span className="text-xs text-ink-faint">Horizontal 4:3. Evita usar el logo: se recorta.</span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) handleHeroChange(file);
          e.target.value = "";
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader
        title="Perfil del estudio"
        description="Lo que tus alumnos ven en “Estudio”. Dirección, teléfono y fotos de cada sede se editan en Sedes."
        action={
          <button
            onClick={() => setPreviewOpen(true)}
            className="h-11 rounded-xl border border-ink/[0.14] bg-white px-4 text-sm font-semibold text-ink hover:bg-[#F7F6F3] lg:hidden"
          >
            Vista previa
          </button>
        }
      />

      <div className="-mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <StudioProfileFields
          value={draft}
          onChange={(next) => {
            setDraft(next);
            setDirty(true);
          }}
          photoSlot={photoSlot}
        />

        <div className="sticky top-0 hidden flex-col gap-2.5 lg:flex">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-soft">
              Así lo ven tus alumnos{dirty ? " (al guardar)" : ""}
            </span>
            <a
              href={studentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-brand-700 hover:text-brand-800"
            >
              Abrir
            </a>
          </div>
          <iframe
            key={previewKey}
            src={studentUrl}
            title="Vista previa del estudio"
            className="h-[680px] w-[390px] rounded-[28px] border-8 border-ink bg-canvas"
          />
        </div>
      </div>

      <div
        className={`sticky bottom-2 z-10 flex items-center justify-between gap-3 rounded-[18px] py-2.5 pl-[18px] pr-2.5 lg:bottom-4 lg:mr-[414px] ${
          dirty
            ? "bg-ink text-white shadow-[0_16px_36px_-12px_rgba(22,24,29,0.5)]"
            : "border border-ink/[0.08] bg-white text-ink-soft"
        }`}
      >
        <span className={`text-sm font-medium ${dirty ? "text-white/80" : ""}`}>
          {error ?? (saving ? "Guardando…" : dirty ? "Tienes cambios sin guardar" : "Todo guardado")}
        </span>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`h-11 rounded-xl px-[18px] text-sm font-semibold ${
            dirty ? "bg-white text-ink" : "cursor-default bg-[#F3F2EE] text-ink-faint"
          }`}
        >
          Guardar cambios
        </button>
      </div>

      {previewOpen && (
        <Modal title="Vista previa" subtitle="Así lo ven tus alumnos" onClose={() => setPreviewOpen(false)}>
          <iframe
            key={previewKey}
            src={studentUrl}
            title="Vista previa del estudio"
            className="-mx-5 -mb-5 h-[620px] w-[calc(100%+40px)] border-t border-ink/[0.08]"
          />
        </Modal>
      )}
    </div>
  );
}
