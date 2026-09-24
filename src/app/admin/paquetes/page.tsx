"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Pencil, Ticket } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PackageDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";

interface PackageItem extends PackageDoc {
  id: string;
}

export default function PaquetesPage() {
  const { tenantId } = useTenant();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // `undefined` = closed, `null` = creating, a package = editing it.
  const [dialog, setDialog] = useState<PackageItem | null | undefined>(
    undefined,
  );
  const closeDialog = useCallback(() => setDialog(undefined), []);

  useEffect(() => {
    const packagesQuery = query(
      collection(db, "tenants", tenantId, "packages"),
      orderBy("name"),
    );
    return onSnapshot(packagesQuery, (snapshot) => {
      setPackages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as PackageDoc),
        })),
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
          <Button onClick={() => setDialog(null)}>+ Agregar paquete</Button>
        }
      />

      {dialog !== undefined && (
        <Modal
          title={dialog ? "Editar paquete" : "Nuevo paquete"}
          onClose={closeDialog}
        >
          <PackageForm
            tenantId={tenantId}
            pkg={dialog ?? undefined}
            onDone={closeDialog}
          />
        </Modal>
      )}

      {loaded && packages.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes paquetes"
          description="Crea al menos un paquete (ej. 10 clases por $2,000) para que tus alumnos puedan comprar créditos y reservar."
          action={
            <Button onClick={() => setDialog(null)}>
              + Agregar mi primer paquete
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-900">{pkg.name}</p>
                <button
                  onClick={() => setDialog(pkg)}
                  aria-label={`Editar ${pkg.name}`}
                  className="-mr-2 -mt-1 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ${pkg.price.toLocaleString("es-MX")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  {pkg.creditAmount} créditos
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                  Vigencia {pkg.validityDays} días
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageForm({
  tenantId,
  pkg,
  onDone,
}: {
  tenantId: string;
  pkg?: PackageItem;
  onDone: () => void;
}) {
  const [name, setName] = useState(pkg?.name ?? "");
  const [creditAmount, setCreditAmount] = useState(pkg?.creditAmount ?? 10);
  const [price, setPrice] = useState<number | "">(pkg?.price ?? "");
  const [validityDays, setValidityDays] = useState(pkg?.validityDays ?? 45);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name,
        creditAmount,
        price: price === "" ? 0 : price,
        validityDays,
      };
      if (pkg) {
        await updateDoc(doc(db, "tenants", tenantId, "packages", pkg.id), data);
      } else {
        await addDoc(collection(db, "tenants", tenantId, "packages"), {
          ...data,
          active: true,
        });
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500">
              $
            </span>
            <input
              id="package-price"
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="2000"
              className={`${inputClass} pl-7`}
            />
          </div>
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

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : pkg
              ? "Guardar cambios"
              : "Guardar paquete"}
        </Button>
      </div>
    </form>
  );
}
