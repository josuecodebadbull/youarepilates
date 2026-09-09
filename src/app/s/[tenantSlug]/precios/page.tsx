"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PackageDoc, PurchaseIntentDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface PackageItem extends PackageDoc {
  id: string;
}

export default function PreciosPage() {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [boughtId, setBoughtId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const packagesQuery = query(
      collection(db, "tenants", tenantId, "packages"),
      where("active", "==", true),
      orderBy("price", "asc"),
    );
    return onSnapshot(packagesQuery, (snap) =>
      setPackages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as PackageDoc) }))),
    );
  }, [tenantId]);

  async function handleBuy(pkg: PackageItem) {
    if (!user) {
      router.push(`/s/${tenant.slug}/login`);
      return;
    }

    setError(null);
    setBuyingId(pkg.id);
    try {
      await addDoc(collection(db, "purchaseIntents"), {
        tenantId,
        studentId: user.uid,
        packageId: pkg.id,
        packageName: pkg.name,
        creditAmount: pkg.creditAmount,
        price: pkg.price,
        validityDays: pkg.validityDays,
        status: "pending",
        createdAt: Timestamp.now(),
      } satisfies PurchaseIntentDoc);
      setBoughtId(pkg.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la compra.");
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Precios</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Elige el paquete que más te convenga. Por ahora el pago se confirma en el
        mostrador — al comprar, tu paquete queda pendiente hasta que el estudio
        confirme tu pago.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 space-y-3 pb-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-ink">{pkg.name}</p>
              <p className="text-2xl font-semibold text-ink">${pkg.price}</p>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {pkg.creditAmount} créditos · vigencia {pkg.validityDays} días desde la compra
            </p>

            {boughtId === pkg.id ? (
              <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
                ¡Listo! Tu compra quedó pendiente — pasa al mostrador para completar el pago.
              </p>
            ) : (
              <Button
                onClick={() => handleBuy(pkg)}
                disabled={buyingId === pkg.id}
                className="mt-3 w-full"
              >
                {buyingId === pkg.id ? "Un momento..." : "Comprar"}
              </Button>
            )}
          </div>
        ))}

        {packages.length === 0 && (
          <EmptyState
            icon="🎟️"
            title="Todavía no hay paquetes disponibles"
            description="Vuelve pronto — el estudio está configurando sus paquetes de créditos."
          />
        )}
      </div>
    </div>
  );
}
