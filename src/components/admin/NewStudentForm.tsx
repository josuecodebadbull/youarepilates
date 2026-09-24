"use client";

import { useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre completo" htmlFor="new-student-name" required>
        <input
          id="new-student-name"
          required
          autoFocus
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Teléfono" htmlFor="new-student-phone" hint="Opcional">
          <input
            id="new-student-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Correo" htmlFor="new-student-email" hint="Opcional">
          <input
            id="new-student-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>
      <p className="text-xs text-ink-soft">
        El alumno no necesita cuenta: puedes inscribirlo y venderle créditos desde aquí. Si después
        se registra en la app, vincula su cuenta desde su ficha para conservar su historial.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
