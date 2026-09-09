"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Ticket } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PackageDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface PackageItem extends PackageDoc {
  id: string;
}

export default function PaquetesPage() {
  const { tenantId } = useTenant();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const packagesQuery = query(
      collection(db, "tenants", tenantId, "packages"),
      orderBy("name"),
    );
    return onSnapshot(packagesQuery, (snapshot) => {
      setPackages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as PackageDoc) })),
      );
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Paquetes de créditos"
        description="Lo que tus alumnos compran para tomar clases. Cada clase le cuesta a un alumno una cantidad de créditos (normalmente 1), y el paquete deja de usarse al vencer su vigencia."
        action={
          !formOpen && <Button onClick={() => setFormOpen(true)}>+ Agregar paquete</Button>
        }
      />

      {formOpen && (
        <PackageForm tenantId={tenantId} onDone={() => setFormOpen(false)} />
      )}

      {loaded && packages.length === 0 && !formOpen ? (
        <EmptyState
          icon={<Ticket className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes paquetes"
          description="Crea al menos un paquete (ej. 10 clases por $2,000) para que tus alumnos puedan comprar créditos y reservar."
          action={<Button onClick={() => setFormOpen(true)}>+ Agregar mi primer paquete</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-gray-200 p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-gray-900">{pkg.name}</p>
                <p className="text-lg font-bold text-gray-900">${pkg.price}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {pkg.creditAmount} créditos · vigente {pkg.validityDays} días desde la compra
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [creditAmount, setCreditAmount] = useState(10);
  const [price, setPrice] = useState<number | "">("");
  const [validityDays, setValidityDays] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "packages"), {
        name,
        creditAmount,
        price: price === "" ? 0 : price,
        validityDays,
        active: true,
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5"
    >
      <h2 className="font-semibold text-gray-900">Nuevo paquete</h2>

      <FormField
        label="Nombre del paquete"
        htmlFor="package-name"
        hint="Como lo verán tus alumnos en la app al momento de comprar"
        required
      >
        <input
          id="package-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pack 10 Clases Reformer"
          className={inputClass}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Créditos incluidos"
          htmlFor="package-credits"
          hint="1 clase = 1 crédito, normalmente"
          required
        >
          <input
            id="package-credits"
            type="number"
            min={1}
            required
            value={creditAmount}
            onChange={(e) => setCreditAmount(Number(e.target.value))}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Precio"
          htmlFor="package-price"
          hint="En tu moneda local, sin símbolo"
          required
        >
          <input
            id="package-price"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="2000"
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Vigencia (días)"
          htmlFor="package-validity"
          hint="Días desde la compra antes de que expire"
          required
        >
          <input
            id="package-validity"
            type="number"
            min={1}
            required
            value={validityDays}
            onChange={(e) => setValidityDays(Number(e.target.value))}
            className={inputClass}
          />
        </FormField>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar paquete"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
