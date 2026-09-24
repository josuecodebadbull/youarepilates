"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { MapPin } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc, RoomDoc } from "@/lib/types/firestore";
import { sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { AddTile, PrimaryAction, SheetFooter, Tag, fieldLabelClass } from "@/components/admin/ui";

interface Branch extends BranchDoc {
  id: string;
}

export default function SedesPage() {
  const { tenantId } = useTenant();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const branchesQuery = query(collection(db, "tenants", tenantId, "branches"), orderBy("name"));
    return onSnapshot(branchesQuery, (snapshot) => {
      setBranches(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as BranchDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Sedes"
        description="Tus sucursales. Entra a una para gestionar sus salas, camas y lo que ven tus alumnos."
        action={<PrimaryAction onClick={() => setFormOpen(true)}>Agregar sede</PrimaryAction>}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-3.5">
        {branches.map((branch) => (
          <BranchCard key={branch.id} tenantId={tenantId} branch={branch} />
        ))}
        {loaded && (
          <AddTile
            label={branches.length === 0 ? "Agrega tu primera sede" : "Nueva sede"}
            onClick={() => setFormOpen(true)}
            className="min-h-[220px]"
          />
        )}
      </div>

      {formOpen && <BranchSheet tenantId={tenantId} onDone={() => setFormOpen(false)} />}
    </div>
  );
}

function BranchCard({ tenantId, branch }: { tenantId: string; branch: Branch }) {
  const [rooms, setRooms] = useState<RoomDoc[] | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "tenants", tenantId, "branches", branch.id, "rooms"), (snap) =>
      setRooms(snap.docs.map((d) => d.data() as RoomDoc)),
    );
  }, [tenantId, branch.id]);

  const cover = branch.photoUrls?.[0] ?? branch.photoUrl ?? null;
  const beds = rooms?.reduce((sum, r) => sum + r.capacity, 0) ?? 0;
  const available = rooms?.reduce((sum, r) => sum + r.capacity - r.blockedSpots.length, 0) ?? 0;

  return (
    <Link
      href={`/admin/sedes/${branch.id}`}
      className="flex flex-col overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white text-ink transition-colors hover:border-ink/[0.16] hover:text-ink"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-brand-50 text-brand-300">
          <MapPin className="h-10 w-10" strokeWidth={1.4} />
        </div>
      )}
      <div className="flex flex-col gap-2.5 px-[18px] pb-[18px] pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold">{branch.name}</span>
          <span className="text-[13px] leading-normal text-ink-soft">{branch.address}</span>
        </div>
        {rooms && (
          <div className="flex flex-wrap gap-1.5">
            <Tag>
              {rooms.length} {rooms.length === 1 ? "sala" : "salas"}
            </Tag>
            {rooms.length > 0 && (
              <Tag>
                {available === beds ? `${beds} camas` : `${available} de ${beds} camas`}
              </Tag>
            )}
            {rooms.length === 0 && <Tag tone="brand">Agrega una sala</Tag>}
          </div>
        )}
      </div>
    </Link>
  );
}

function BranchSheet({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "branches"), {
        name: name.trim(),
        address: address.trim(),
        createdAt: serverTimestamp(),
      });
      toast("Sede creada");
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  const hintClass = "text-xs font-normal text-ink-faint";

  return (
    <Modal
      title="Nueva sede"
      subtitle="Después podrás agregar sus salas y fotos"
      onClose={onDone}
      footer={<SheetFooter formId="branch-form" onCancel={onDone} submitting={submitting} label="Crear sede" />}
    >
      <form id="branch-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className={fieldLabelClass}>
          Nombre de la sede
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sucursal Condesa"
            className={sheetInputClass}
          />
          <span className={hintClass}>Así la verán tus alumnos al elegir dónde tomar clase.</span>
        </label>
        <label className={fieldLabelClass}>
          Dirección completa
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Michoacán 123, Roma Norte, CDMX"
            className={sheetInputClass}
          />
          <span className={hintClass}>Se usa para el mapa y el botón “Cómo llegar”.</span>
        </label>
      </form>
    </Modal>
  );
}
