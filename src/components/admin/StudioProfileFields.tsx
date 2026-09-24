"use client";

import { useState, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { AtSign, Mail, MessageCircle, Plus, X } from "lucide-react";

import { AMENITY_SUGGESTIONS, type ProfileDraft } from "@/lib/tenantProfile";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

export function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function IconInput({
  icon: Icon,
  ...props
}: { icon: typeof Mail } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" strokeWidth={1.75} />
      <input {...props} className={`${inputClass} pl-9`} />
    </div>
  );
}

/**
 * Every text field of the studio's public profile, shared by the onboarding wizard and
 * the admin "Perfil del estudio" page so both stay in sync. `photoSlot` lets the admin
 * page put the hero photo uploader at the top of the first section.
 */
export function StudioProfileFields({
  value,
  onChange,
  photoSlot,
}: {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
  photoSlot?: ReactNode;
}) {
  const [amenityDraft, setAmenityDraft] = useState("");
  const set = <K extends keyof ProfileDraft>(key: K, v: ProfileDraft[K]) =>
    onChange({ ...value, [key]: v });

  function addAmenity(raw: string) {
    const name = raw.trim();
    if (!name || value.amenities.some((a) => a.toLowerCase() === name.toLowerCase())) return;
    set("amenities", [...value.amenities, name]);
    setAmenityDraft("");
  }

  function onAmenityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addAmenity(amenityDraft);
    }
  }

  const suggestions = AMENITY_SUGGESTIONS.filter(
    (s) => !value.amenities.some((a) => a.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <ProfileSection title="Presentación" description="Lo primero que ve un alumno al abrir la página de tu estudio.">
        {photoSlot}

        <FormField
          label="Lema"
          htmlFor="profile-tagline"
          hint="Una línea corta sobre el nombre — ej. Pilates Reformer · Roma Norte, CDMX"
        >
          <input
            id="profile-tagline"
            maxLength={80}
            value={value.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Pilates Reformer · Roma Norte, CDMX"
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Descripción"
          htmlFor="profile-description"
          hint="Quiénes son, tu estilo y lo que hace especial a tu estudio. Puedes escribir varias líneas."
        >
          <textarea
            id="profile-description"
            rows={5}
            maxLength={600}
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Clases de Pilates Reformer en grupos reducidos para todos los niveles..."
            className={`${inputClass} resize-y leading-relaxed`}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{value.description.length}/600</p>
        </FormField>
      </ProfileSection>

      <ProfileSection
        title="Contacto y redes"
        description="Cada uno aparece como botón en la página. Deja vacío el que no uses."
      >
        <FormField
          label="WhatsApp"
          htmlFor="profile-whatsapp"
          hint="Tu número con lada. Si pones 10 dígitos, agregamos +52 automáticamente."
        >
          <IconInput
            icon={MessageCircle}
            id="profile-whatsapp"
            inputMode="tel"
            value={value.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="55 6440 2067"
          />
        </FormField>

        <FormField label="Instagram" htmlFor="profile-instagram" hint="Tu @usuario o el link de tu perfil.">
          <IconInput
            icon={AtSign}
            id="profile-instagram"
            value={value.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="@tuestudio"
          />
        </FormField>

        <FormField label="Email de contacto" htmlFor="profile-email">
          <IconInput
            icon={Mail}
            id="profile-email"
            type="email"
            value={value.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="hola@tuestudio.com"
          />
        </FormField>
      </ProfileSection>

      <ProfileSection
        title="Amenidades"
        description="Lo que ofrece tu estudio. Escribe una y presiona Enter, o toca una sugerencia."
      >
        {value.amenities.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.amenities.map((amenity) => (
              <li
                key={amenity}
                className="flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm text-brand-800"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => set("amenities", value.amenities.filter((a) => a !== amenity))}
                  aria-label={`Quitar ${amenity}`}
                  className="rounded-full p-0.5 hover:bg-brand-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            value={amenityDraft}
            onChange={(e) => setAmenityDraft(e.target.value)}
            onKeyDown={onAmenityKeyDown}
            placeholder="Ej. Estacionamiento"
            aria-label="Nueva amenidad"
            className={inputClass}
          />
          <Button type="button" variant="secondary" onClick={() => addAmenity(amenityDraft)}>
            Agregar
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-ink-soft">Sugerencias</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addAmenity(s)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-ink-soft hover:border-brand-600 hover:text-brand-700"
                >
                  <Plus className="h-3.5 w-3.5" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Políticas" description="Reglas de tu estudio. Se muestran en una sección desplegable.">
        <FormField
          label="Políticas"
          htmlFor="profile-policies"
          hint="Una por línea — cada línea aparece como un punto de la lista."
        >
          <textarea
            id="profile-policies"
            rows={5}
            value={value.policies}
            onChange={(e) => set("policies", e.target.value)}
            placeholder={
              "Cancela sin costo hasta 12 h antes de tu clase.\nLlega 10 minutos antes.\nUsa calcetas antiderrapantes."
            }
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </FormField>
      </ProfileSection>
    </div>
  );
}
