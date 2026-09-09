"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { TriangleAlert } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { DEFAULT_TENANT_WAIVER } from "@/lib/tenantWaiver";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ResponsivaPage() {
  const { tenantId, tenant } = useTenant();
  const waiver = tenant.waiver ?? DEFAULT_TENANT_WAIVER;
  const [text, setText] = useState(waiver.text);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const textChanged = text !== waiver.text;

  async function handleSave(bumpVersion: boolean) {
    setSaving(true);
    setSaved(null);
    try {
      await updateDoc(doc(db, "tenants", tenantId), {
        waiver: {
          text,
          version: bumpVersion ? waiver.version + 1 : waiver.version,
        },
      });
      setSaved(
        bumpVersion
          ? "Guardado — todos tus alumnos deberán firmar de nuevo antes de su próxima reserva."
          : "Guardado.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Carta responsiva"
        description="El deslinde de responsabilidad que tus alumnos deben firmar antes de reservar su primera clase."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <span>
          Esto no es asesoría legal. Es una plantilla genérica de punto de partida —
          pide a un abogado que la revise y adapte a tu país/estado y a tu póliza de
          seguro antes de confiar en ella para protegerte legalmente.
        </span>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-ink-soft">Versión actual: {waiver.version}</p>

        <FormField
          label="Texto de la carta responsiva"
          htmlFor="waiver-text"
          hint="Esto es lo que verá y firmará cada alumno desde su Perfil"
        >
          <textarea
            id="waiver-text"
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </FormField>

        {saved && <p className="text-sm text-brand-700">{saved}</p>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSave(true)} disabled={saving || !textChanged}>
            {saving ? "Guardando..." : "Guardar y requerir nueva firma"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            disabled={saving || !textChanged}
          >
            Guardar sin pedir nueva firma (solo corregí un error de dedo)
          </Button>
        </div>
      </div>
    </div>
  );
}
