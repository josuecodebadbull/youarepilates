"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { CreditCard } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PurchaseIntentDoc, StudentPassDoc, UserDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

interface PurchaseIntent extends PurchaseIntentDoc {
  id: string;
}

export default function PagosPage() {
  const { tenantId } = useTenant();
  const [intents, setIntents] = useState<PurchaseIntent[]>([]);
  const [students, setStudents] = useState<Record<string, UserDoc>>({});
  const [loaded, setLoaded] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const intentsQuery = query(
      collection(db, "purchaseIntents"),
      where("tenantId", "==", tenantId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(intentsQuery, (snap) => {
      setIntents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PurchaseIntentDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

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

  async function handleConfirm(intent: PurchaseIntent) {
    setProcessingId(intent.id);
    try {
      const batch = writeBatch(db);
      const passRef = doc(collection(db, "tenants", tenantId, "studentPasses"));
      const expiresAt = Timestamp.fromMillis(Date.now() + intent.validityDays * 24 * 60 * 60 * 1000);

      batch.set(passRef, {
        studentId: intent.studentId,
        packageId: intent.packageId,
        initialCredits: intent.creditAmount,
        remainingCredits: intent.creditAmount,
        expiresAt,
        status: "active",
      } satisfies StudentPassDoc);

      batch.update(doc(db, "purchaseIntents", intent.id), { status: "paid" });

      await batch.commit();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(intent: PurchaseIntent) {
    if (!window.confirm(`¿Marcar como no pagada la compra de "${intent.packageName}"?`)) return;
    setProcessingId(intent.id);
    try {
      await writeBatch(db)
        .update(doc(db, "purchaseIntents", intent.id), { status: "failed" })
        .commit();
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pagos pendientes"
        description="Cuando un alumno compra un paquete desde la app, aparece aquí hasta que confirmes que recibiste el pago (efectivo, transferencia, terminal)."
      />

      {loaded && intents.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-7 w-7" strokeWidth={1.75} />}
          title="No hay pagos pendientes"
          description="Cuando un alumno compre un paquete desde la sección de Precios de su app, lo verás aquí."
        />
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {intents.map((intent) => {
            const student = students[intent.studentId];
            return (
              <li key={intent.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-ink">{student?.displayName || student?.email || "Alumno"}</p>
                  <p className="text-sm text-ink-soft">
                    {intent.packageName} · {intent.creditAmount} créditos · ${intent.price}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled={processingId === intent.id}
                    onClick={() => handleReject(intent)}
                  >
                    No pagó
                  </Button>
                  <Button
                    className="px-3 py-1.5 text-xs"
                    disabled={processingId === intent.id}
                    onClick={() => handleConfirm(intent)}
                  >
                    {processingId === intent.id ? "Procesando..." : "Confirmar pago"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
