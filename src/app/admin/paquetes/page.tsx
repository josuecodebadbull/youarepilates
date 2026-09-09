"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { PackageDoc } from "@/lib/types/firestore";

interface PackageItem extends PackageDoc {
  id: string;
}

export default function PaquetesPage() {
  const { tenantId } = useTenant();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [name, setName] = useState("");
  const [creditAmount, setCreditAmount] = useState(10);
  const [price, setPrice] = useState(0);
  const [validityDays, setValidityDays] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const packagesQuery = query(
      collection(db, "tenants", tenantId, "packages"),
      orderBy("name"),
    );
    return onSnapshot(packagesQuery, (snapshot) => {
      setPackages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as PackageDoc) })),
      );
    });
  }, [tenantId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "packages"), {
        name,
        creditAmount,
        price,
        validityDays,
        active: true,
      });
      setName("");
      setCreditAmount(10);
      setPrice(0);
      setValidityDays(45);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Paquetes de créditos</h1>

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {packages.map((pkg) => (
          <li key={pkg.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-gray-500">
                {pkg.creditAmount} créditos · vigencia {pkg.validityDays} días
              </p>
            </div>
            <p className="font-semibold">${pkg.price}</p>
          </li>
        ))}
        {packages.length === 0 && (
          <li className="p-4 text-sm text-gray-500">Todavía no hay paquetes creados.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="mt-8 max-w-sm space-y-3">
        <h2 className="font-semibold">Agregar paquete</h2>
        <input
          required
          placeholder="Nombre (ej. Pack 10 Clases Reformer)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            min={1}
            value={creditAmount}
            onChange={(e) => setCreditAmount(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Créditos"
          />
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Precio"
          />
          <input
            type="number"
            min={1}
            value={validityDays}
            onChange={(e) => setValidityDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            aria-label="Vigencia en días"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Agregar paquete"}
        </button>
      </form>
    </div>
  );
}
