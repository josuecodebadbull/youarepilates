"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Plus, X } from "lucide-react";

import { AMENITY_SUGGESTIONS, type ProfileDraft } from "@/lib/tenantProfile";
import { sheetInputClass } from "@/components/ui/FormField";
import { cardClass, textareaClass } from "@/components/admin/ui";

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
    <section className={`flex flex-col gap-3 p-5 ${cardClass}`}>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-sans text-[15px] font-bold tracking-normal text-ink">{title}</h2>
        {description && <p className="text-[13px] text-ink-soft">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Input with a sand label block on its left ("WhatsApp | 55 1234 5678"). */
function PrefixedInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: "tel" | "email" | "text";
}) {
  return (
    <label className="flex h-12 items-center overflow-hidden rounded-xl border border-ink/[0.14] bg-white focus-within:border-brand-600">
      <span className="flex h-full w-[104px] shrink-0 items-center bg-[#F3F2EE] px-3 text-[13px] font-semibold text-ink-soft">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
      />
    </label>
  );
}

/**
 * Every text field of the studio's public profile, shared by the onboarding wizard and
 * the admin "Perfil del estudio" page so both stay in sync. `photoSlot` lets the admin
 * page put the hero photo uploader first.
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
  const set = <K extends keyof ProfileDraft>(key: K, v: ProfileDraft[K]) => onChange({ ...value, [key]: v });

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
    <div className="flex flex-col gap-3.5">
      {photoSlot && <ProfileSection title="Foto principal">{photoSlot}</ProfileSection>}

      <ProfileSection title="Presentación" description="Lo primero que ve un alumno al abrir la página de tu estudio.">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Lema
          <input
            maxLength={80}
            value={value.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Pilates Reformer · Roma Norte, CDMX"
            className={sheetInputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Descripción
          <textarea
            rows={4}
            maxLength={600}
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Clases de Pilates Reformer en grupos reducidos para todos los niveles..."
            className={textareaClass}
          />
          <span className="text-right text-xs font-normal text-ink-faint">{value.description.length}/600</span>
        </label>
      </ProfileSection>

      <ProfileSection title="Contacto" description="Cada uno aparece como botón en la página. Deja vacío el que no uses.">
        <PrefixedInput
          label="WhatsApp"
          inputMode="tel"
          value={value.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          placeholder="55 1234 5678"
        />
        <PrefixedInput
          label="Email"
          type="email"
          inputMode="email"
          value={value.email}
          onChange={(v) => set("email", v)}
          placeholder="hola@tuestudio.com"
        />
        <PrefixedInput
          label="Instagram"
          value={value.instagram}
          onChange={(v) => set("instagram", v)}
          placeholder="@tuestudio"
        />
      </ProfileSection>

      <ProfileSection title="Amenidades">
        {value.amenities.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.amenities.map((amenity) => (
              <li
                key={amenity}
                className="flex h-9 items-center gap-1 rounded-full bg-brand-50 pl-3 pr-1.5 text-[13px] font-semibold text-brand-800"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => set("amenities", value.amenities.filter((a) => a !== amenity))}
                  aria-label={`Quitar ${amenity}`}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full hover:bg-brand-100"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
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
            className={`${sheetInputClass} h-11 text-sm`}
          />
          <button
            type="button"
            onClick={() => addAmenity(amenityDraft)}
            className="h-11 shrink-0 rounded-xl bg-[#F3F2EE] px-4 text-sm font-semibold text-ink hover:bg-[#EAE8E3]"
          >
            Agregar
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addAmenity(s)}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-ink/20 px-3 text-[13px] text-ink-soft hover:border-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> {s}
              </button>
            ))}
          </div>
        )}
      </ProfileSection>

      <ProfileSection title="Políticas" description="Una por línea — cada línea aparece como un punto de la lista.">
        <textarea
          rows={4}
          value={value.policies}
          onChange={(e) => set("policies", e.target.value)}
          aria-label="Políticas"
          placeholder={
            "Cancela sin costo hasta 12 h antes de tu clase.\nLlega 10 minutos antes.\nUsa calcetas antiderrapantes."
          }
          className={textareaClass}
        />
      </ProfileSection>
    </div>
  );
}
