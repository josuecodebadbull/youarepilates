"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Building2, ChevronRight } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface Branch extends BranchDoc {
  id: string;
}

export default function SedesPage() {
  const { tenantId } = useTenant();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const branchesQuery = query(
      collection(db, "tenants", tenantId, "branches"),
      orderBy("name"),
    );
    return onSnapshot(branchesQuery, (snapshot) => {
      setBranches(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as BranchDoc) })),
      );
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Sedes"
        description="Las sucursales físicas de tu estudio. Entra a una sede para gestionar sus salas y camas de reformer."
        action={
          !formOpen && (
            <Button onClick={() => setFormOpen(true)}>+ Agregar sede</Button>
          )
        }
      />

      {formOpen && (
        <BranchForm tenantId={tenantId} onDone={() => setFormOpen(false)} />
      )}

      {loaded && branches.length === 0 && !formOpen ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes sedes"
          description="Agrega tu primera sede para poder crear salas y programar horarios de clases."
          action={<Button onClick={() => setFormOpen(true)}>+ Agregar mi primera sede</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={`/admin/sedes/${branch.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-5 hover:border-gray-400 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{branch.name}</p>
                <p className="mt-1 text-sm text-gray-500">{branch.address}</p>
              </div>
              <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BranchForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "branches"), {
        name,
        address,
        createdAt: serverTimestamp(),
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
      <h2 className="font-semibold text-gray-900">Nueva sede</h2>

      <FormField
        label="Nombre de la sede"
        htmlFor="branch-name"
        hint="Así la verán tus alumnos al elegir dónde tomar su clase. Ejemplo: Sucursal Condesa"
        required
      >
        <input
          id="branch-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sucursal Condesa"
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Dirección"
        htmlFor="branch-address"
        hint="Dirección completa, para que tus alumnos sepan cómo llegar"
        required
      >
        <input
          id="branch-address"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Av. Michoacán 123, Roma Norte, CDMX"
          className={inputClass}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar sede"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
