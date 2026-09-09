"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc } from "@/lib/types/firestore";

interface Branch extends BranchDoc {
  id: string;
}

export default function SedesPage() {
  const { tenantId } = useTenant();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const branchesQuery = query(
      collection(db, "tenants", tenantId, "branches"),
      orderBy("name"),
    );
    return onSnapshot(branchesQuery, (snapshot) => {
      setBranches(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as BranchDoc) })),
      );
    });
  }, [tenantId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "branches"), {
        name,
        address,
        createdAt: serverTimestamp(),
      });
      setName("");
      setAddress("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Sedes</h1>

      <ul className="mt-6 divide-y divide-gray-200 rounded-lg border border-gray-200">
        {branches.map((branch) => (
          <li key={branch.id} className="p-4">
            <p className="font-medium">{branch.name}</p>
            <p className="text-sm text-gray-500">{branch.address}</p>
          </li>
        ))}
        {branches.length === 0 && (
          <li className="p-4 text-sm text-gray-500">Todavía no hay sedes creadas.</li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="mt-8 max-w-sm space-y-3">
        <h2 className="font-semibold">Agregar sede</h2>
        <input
          required
          placeholder="Nombre (ej. Sucursal Condesa)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Agregar sede"}
        </button>
      </form>
    </div>
  );
}
