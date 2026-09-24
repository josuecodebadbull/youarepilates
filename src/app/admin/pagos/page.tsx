"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import {
  confirmPurchaseIntent,
  formatAgo,
  formatMoney,
  initials,
  rejectPurchaseIntent,
  usePendingIntents,
  type PurchaseIntent,
} from "@/lib/admin/data";
import type { UserDoc } from "@/lib/types/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";

interface Resolved {
  intent: PurchaseIntent;
  name: string;
  outcome: "paid" | "failed";
}

export default function PagosPage() {
  const { tenantId } = useTenant();
  const toast = useToast();
  const { intents, loaded } = usePendingIntents(tenantId);
  const [students, setStudents] = useState<Record<string, UserDoc>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Resolved in this visit — the query above only returns pending ones.
  const [resolved, setResolved] = useState<Resolved[]>([]);

  useEffect(() => {
    const missingIds = [...new Set(intents.map((i) => i.studentId))].filter((id) => !(id in students));
    if (missingIds.length === 0) return;

    missingIds.forEach(async (studentId) => {
      const snap = await getDoc(doc(db, "users", studentId));
      if (snap.exists()) {
        setStudents((prev) => ({ ...prev, [studentId]: snap.data() as UserDoc }));
      }
    });
  }, [intents, students]);

  const nameOf = (intent: PurchaseIntent) => {
    const student = students[intent.studentId];
    return student?.displayName || student?.email || "Alumno";
  };

  async function handleConfirm(intent: PurchaseIntent) {
    setProcessingId(intent.id);
    try {
      await confirmPurchaseIntent(tenantId, intent);
      const name = nameOf(intent);
      setResolved((prev) => [{ intent, name, outcome: "paid" }, ...prev]);
      toast(`Pago confirmado · ${intent.packageName} para ${name.split(" ")[0]}`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(intent: PurchaseIntent) {
    if (!window.confirm(`¿Marcar como no pagada la compra de "${intent.packageName}"?`)) return;
    setProcessingId(intent.id);
    try {
      await rejectPurchaseIntent(intent);
      setResolved((prev) => [{ intent, name: nameOf(intent), outcome: "failed" }, ...prev]);
      toast("Solicitud rechazada");
    } finally {
      setProcessingId(null);
    }
  }

  const total = intents.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="flex max-w-[860px] flex-col gap-[18px]">
      <PageHeader
        title="Pagos"
        description="Solicitudes de compra desde la app. Confírmalas cuando recibas el pago en efectivo, transferencia o terminal: los créditos se asignan al instante."
      />

      <div className="-mt-6 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-ink">Por confirmar</h2>
        {intents.length > 0 && (
          <span className="text-[13px] text-ink-faint">
            {intents.length} · {formatMoney(total)}
          </span>
        )}
      </div>

      {loaded && intents.length === 0 ? (
        <p className="rounded-[20px] bg-brand-50 p-[22px] text-sm font-medium text-brand-800">
          Todo al día. No hay pagos pendientes. Cuando un alumno compre un paquete desde su app, lo verás aquí.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {intents.map((intent) => {
            const name = nameOf(intent);
            const busy = processingId === intent.id;
            return (
              <div
                key={intent.id}
                className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-ink/[0.08] bg-white p-4"
              >
                <div className="flex min-w-0 flex-[1_1_220px] items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDEBE6] text-sm font-bold">
                    {initials(name)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-semibold text-ink">{name}</span>
                    <span className="text-[13px] text-ink-soft">
                      {intent.packageName} · {intent.creditAmount} créditos ·{" "}
                      {intent.createdAt ? formatAgo(intent.createdAt.toDate()) : "ahora"}
                    </span>
                  </div>
                </div>
                <span className="font-display text-[22px] font-semibold text-ink">{formatMoney(intent.price)}</span>
                <div className="flex flex-[1_1_220px] justify-end gap-2">
                  <button
                    onClick={() => handleReject(intent)}
                    disabled={busy}
                    className="h-11 max-w-[130px] flex-1 rounded-xl border border-ink/[0.14] bg-white text-sm font-semibold text-ink hover:bg-[#F7F6F3] disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleConfirm(intent)}
                    disabled={busy}
                    className="h-11 max-w-[180px] flex-1 rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                  >
                    {busy ? "Procesando..." : "Confirmar pago"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="mt-2 text-xl font-semibold text-ink">Resueltos ahora</h2>
          <div className="overflow-hidden rounded-[20px] border border-ink/[0.08] bg-white">
            {resolved.map(({ intent, name, outcome }) => (
              <div
                key={intent.id}
                className="flex items-center justify-between gap-3 border-b border-ink/[0.06] px-4 py-3.5 text-sm last:border-b-0"
              >
                <span className="font-semibold text-ink">{name}</span>
                <span className="text-ink-soft">
                  {intent.packageName} · {formatMoney(intent.price)}
                </span>
                <span className={`text-xs font-bold ${outcome === "paid" ? "text-brand-700" : "text-[#B42318]"}`}>
                  {outcome === "paid" ? "Confirmado" : "Rechazado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
