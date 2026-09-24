"use client";

import { useEffect, useState } from "react";
import { collection, doc, getCountFromServer, query, updateDoc, where } from "firebase/firestore";
import { TriangleAlert } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { DEFAULT_TENANT_WAIVER } from "@/lib/tenantWaiver";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { cardClass } from "@/components/admin/ui";

export default function ResponsivaPage() {
  const { tenantId, tenant } = useTenant();
  const toast = useToast();
  const waiver = tenant.waiver ?? DEFAULT_TENANT_WAIVER;
  const [text, setText] = useState(waiver.text);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState<{ signed: number; total: number } | null>(null);

  const textChanged = text !== waiver.text;

  // How many students have signed the version currently in force.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCountFromServer(
        query(collection(db, "tenants", tenantId, "waiverSignatures"), where("version", "==", waiver.version)),
      ),
      getCountFromServer(
        query(collection(db, "users"), where("tenantId", "==", tenantId), where("role", "==", "student")),
      ),
    ])
      .then(([signedSnap, totalSnap]) => {
        if (!cancelled) setSigned({ signed: signedSnap.data().count, total: totalSnap.data().count });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantId, waiver.version]);

  async function handleSave(bumpVersion: boolean) {
    if (!textChanged) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "tenants", tenantId), {
        waiver: { text, version: bumpVersion ? waiver.version + 1 : waiver.version },
      });
      toast(bumpVersion ? "Nueva versión publicada · se pedirá firma" : "Corrección guardada");
    } finally {
      setSaving(false);
    }
  }

  const pct = signed && signed.total > 0 ? Math.min(100, Math.round((signed.signed / signed.total) * 100)) : 0;
  const enabled = textChanged && !saving;
  const choiceClass = "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-[14px] px-4 py-2.5 text-left";

  return (
    <div className="flex max-w-[860px] flex-col gap-[18px]">
      <PageHeader
        title="Carta responsiva"
        description="El deslinde que cada alumno firma en la app antes de su primera reserva."
      />

      <div className="-mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <div className={`flex flex-col gap-1 p-4 ${cardClass} rounded-[20px]`}>
          <span className="text-[13px] text-ink-soft">Versión vigente</span>
          <span className="font-display text-[30px] font-semibold text-ink">v{waiver.version}</span>
        </div>
        <div className={`flex flex-col gap-2 p-4 ${cardClass} rounded-[20px]`}>
          <span className="text-[13px] text-ink-soft">Firmada por</span>
          <span className="font-display text-[30px] font-semibold text-ink">
            {signed ? `${signed.signed} de ${signed.total}` : "—"}
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EEE9]">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 rounded-2xl bg-[#FEF7E6] px-4 py-3.5 text-[13px] leading-normal text-amber-900">
        <TriangleAlert className="mt-px h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        <span>Es una plantilla, no asesoría legal. Pide a un abogado que la adapte a tu estado y a tu póliza de seguro.</span>
      </div>

      <div className={`flex flex-col gap-3.5 p-5 ${cardClass}`}>
        <label className="flex flex-col gap-2 text-[15px] font-bold text-ink">
          Texto que firman tus alumnos
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-y rounded-[14px] border border-ink/[0.14] bg-canvas p-4 text-sm font-normal leading-[1.7] text-ink focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </label>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
          <button
            onClick={() => handleSave(true)}
            disabled={!enabled}
            className={`${choiceClass} ${enabled ? "bg-ink text-white" : "cursor-default bg-[#E7E5E0] text-ink-faint"}`}
          >
            <span className="text-[15px] font-semibold">{saving ? "Guardando..." : "Guardar y pedir nueva firma"}</span>
            <span className="text-xs opacity-75">Todos firman de nuevo antes de su próxima reserva</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={!enabled}
            className={`${choiceClass} border border-ink/[0.14] bg-white ${enabled ? "text-ink" : "cursor-default text-ink-faint"}`}
          >
            <span className="text-[15px] font-semibold">Solo corregí un error de dedo</span>
            <span className="text-xs opacity-75">Las firmas actuales siguen válidas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
