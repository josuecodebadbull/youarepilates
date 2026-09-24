"use client";

import { useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { sheetInputClass } from "@/components/ui/FormField";

export interface CreatedStudent {
  id: string;
  displayName: string;
  email: string;
  phone: string;
}

/** Creates a student without an account (see `createStudentProfile`). */
export function NewStudentForm({
  submitLabel = "Crear alumno",
  onCreated,
  onCancel,
}: {
  submitLabel?: string;
  onCreated: (student: CreatedStudent) => void;
  onCancel: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const createStudentProfile = httpsCallable<
        { displayName: string; phone: string; email: string },
        { studentId: string }
      >(functions, "createStudentProfile");
      const { data } = await createStudentProfile({ displayName, phone, email });
      onCreated({
        id: data.studentId,
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
    } catch (err) {
      setError((err as { message?: string }).message ?? "No se pudo crear el alumno.");
      setSubmitting(false);
    }
  }

  const labelClass = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <label className={labelClass}>
        Nombre completo
        <input
          required
          autoFocus
          placeholder="Ej. Valeria Gómez"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={sheetInputClass}
        />
      </label>
      <label className={labelClass}>
        Teléfono / WhatsApp
        <input
          type="tel"
          placeholder="55 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={sheetInputClass}
        />
      </label>
      <label className={labelClass}>
        <span>
          Email <span className="font-normal text-ink-faint">(opcional)</span>
        </span>
        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={sheetInputClass}
        />
      </label>
      <p className="text-xs leading-normal text-ink-soft">
        Se crea sin cuenta. Cuando se registre en la app podrás vincularla sin perder créditos.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" className="h-12" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" className="h-12 flex-1" disabled={submitting}>
          {submitting ? "Creando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
