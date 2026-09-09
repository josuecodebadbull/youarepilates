"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { DEFAULT_TENANT_PROFILE } from "@/lib/tenantProfile";
import type { TenantProfile } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PerfilEstudioPage() {
  const { tenantId, tenant } = useTenant();
  const profile = tenant.profile ?? DEFAULT_TENANT_PROFILE;

  const [description, setDescription] = useState(profile.description);
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [email, setEmail] = useState(profile.email);
  const [policies, setPolicies] = useState(profile.policies);
  const [amenitiesText, setAmenitiesText] = useState(profile.amenities.join("\n"));

  const [heroImageUrl, setHeroImageUrl] = useState(profile.heroImageUrl);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleHeroChange(file: File | null) {
    setHeroFile(file);
    setHeroPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      let nextHeroImageUrl = heroImageUrl;
      if (heroFile) {
        const heroRef = ref(storage, `tenants/${tenantId}/profile/hero`);
        await uploadBytes(heroRef, heroFile, { contentType: heroFile.type });
        nextHeroImageUrl = await getDownloadURL(heroRef);
        setHeroImageUrl(nextHeroImageUrl);
        if (heroPreviewUrl) URL.revokeObjectURL(heroPreviewUrl);
        setHeroFile(null);
        setHeroPreviewUrl(null);
      }

      await updateDoc(doc(db, "tenants", tenantId), {
        profile: {
          description,
          heroImageUrl: nextHeroImageUrl,
          instagramUrl,
          whatsapp,
          email,
          policies,
          amenities: amenitiesText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        } satisfies TenantProfile,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const displayedHeroUrl = heroPreviewUrl ?? heroImageUrl;

  return (
    <div>
      <PageHeader
        title="Perfil del estudio"
        description="Lo que tus alumnos ven en la sección 'Estudio' de su app: descripción, foto, contacto, amenidades y políticas. La dirección y el mapa de cada sede se editan en Sedes."
      />

      <div className="max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-5">
        <FormField
          label="Foto principal"
          htmlFor="hero-photo"
          hint="Se muestra arriba de todo en la sección Estudio — recomendado horizontal"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {displayedHeroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayedHeroUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
              )}
            </div>
            <input
              id="hero-photo"
              type="file"
              accept="image/*"
              onChange={(e) => handleHeroChange(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800"
            />
          </div>
        </FormField>

        <FormField
          label="Descripción del estudio"
          htmlFor="profile-description"
          hint="Quiénes son, su estilo, lo que hace especial a tu estudio — visible para cualquiera antes de reservar"
        >
          <textarea
            id="profile-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Somos un estudio boutique de Pilates Reformer en el corazón de la Roma..."
            className={inputClass}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="WhatsApp" htmlFor="profile-whatsapp" hint="Con lada, sin espacios">
            <input
              id="profile-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5215512345678"
              className={inputClass}
            />
          </FormField>

          <FormField label="Email de contacto" htmlFor="profile-email">
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hola@tuestudio.com"
              className={inputClass}
            />
          </FormField>

          <FormField label="Instagram" htmlFor="profile-instagram" hint="URL completa">
            <input
              id="profile-instagram"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/tuestudio"
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField
          label="Amenidades"
          htmlFor="profile-amenities"
          hint="Una por línea — ej. Lockers, Regaderas, Estacionamiento, Agua y toallas"
        >
          <textarea
            id="profile-amenities"
            rows={4}
            value={amenitiesText}
            onChange={(e) => setAmenitiesText(e.target.value)}
            placeholder={"Lockers\nRegaderas\nEstacionamiento\nAgua y toallas"}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Políticas"
          htmlFor="profile-policies"
          hint="Cancelación, llegadas tarde, qué llevar a clase — visible en la sección Estudio"
        >
          <textarea
            id="profile-policies"
            rows={4}
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            placeholder="Cancela con al menos 12 horas de anticipación para no perder tu crédito..."
            className={inputClass}
          />
        </FormField>

        {saved && <p className="text-sm text-brand-700">Guardado.</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar perfil del estudio"}
        </Button>
      </div>
    </div>
  );
}
