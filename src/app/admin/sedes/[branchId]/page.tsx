"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { BranchDoc, RoomDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface Room extends RoomDoc {
  id: string;
}

export default function SedeDetailPage() {
  const { tenantId } = useTenant();
  const { branchId } = useParams<{ branchId: string }>();

  const [branch, setBranch] = useState<BranchDoc | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, "tenants", tenantId, "branches", branchId), (snap) => {
      setBranch(snap.exists() ? (snap.data() as BranchDoc) : null);
    });
  }, [tenantId, branchId]);

  useEffect(() => {
    const roomsQuery = query(
      collection(db, "tenants", tenantId, "branches", branchId, "rooms"),
      orderBy("name"),
    );
    return onSnapshot(roomsQuery, (snapshot) => {
      setRooms(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as RoomDoc) })));
      setLoaded(true);
    });
  }, [tenantId, branchId]);

  return (
    <div>
      <Link href="/admin/sedes" className="text-sm text-gray-500 hover:text-gray-900">
        ← Sedes
      </Link>

      <PageHeader
        title={branch?.name ?? "Sede"}
        description={
          branch
            ? `${branch.address} — administra las salas y camas de reformer de esta sede.`
            : undefined
        }
        action={!formOpen && <Button onClick={() => setFormOpen(true)}>+ Agregar sala</Button>}
      />

      {formOpen && (
        <RoomForm tenantId={tenantId} branchId={branchId} onDone={() => setFormOpen(false)} />
      )}

      {loaded && rooms.length === 0 && !formOpen ? (
        <EmptyState
          icon="🛏️"
          title="Todavía no tienes salas en esta sede"
          description='Agrega una sala (ej. "Sala Reformer 1") y cuántas camas o lugares tiene, para poder programar horarios ahí.'
          action={<Button onClick={() => setFormOpen(true)}>+ Agregar mi primera sala</Button>}
        />
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} tenantId={tenantId} branchId={branchId} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomForm({
  tenantId,
  branchId,
  onDone,
}: {
  tenantId: string;
  branchId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const spots = Array.from({ length: capacity }, (_, i) => ({
        spotNumber: i + 1,
        label: `Cama ${i + 1}`,
      }));
      await addDoc(collection(db, "tenants", tenantId, "branches", branchId, "rooms"), {
        name,
        capacity,
        spots,
        blockedSpots: [],
      } satisfies RoomDoc);
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5"
    >
      <h2 className="font-semibold text-gray-900">Nueva sala</h2>

      <FormField
        label="Nombre de la sala"
        htmlFor="room-name"
        hint='Como la verán tus alumnos, ej. "Sala Reformer 1"'
        required
      >
        <input
          id="room-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sala Reformer 1"
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Capacidad"
        htmlFor="room-capacity"
        hint="Cuántas camas o lugares caben al mismo tiempo — se numeran automáticamente"
        required
      >
        <input
          id="room-capacity"
          type="number"
          min={1}
          max={40}
          required
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          className={inputClass}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar sala"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function RoomCard({
  tenantId,
  branchId,
  room,
}: {
  tenantId: string;
  branchId: string;
  room: Room;
}) {
  const availableCount = room.capacity - room.blockedSpots.length;

  async function toggleSpot(spotNumber: number) {
    const roomRef = doc(db, "tenants", tenantId, "branches", branchId, "rooms", room.id);
    const isBlocked = room.blockedSpots.includes(spotNumber);
    await updateDoc(roomRef, {
      blockedSpots: isBlocked ? arrayRemove(spotNumber) : arrayUnion(spotNumber),
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-medium text-gray-900">{room.name}</p>
        <p className="text-sm text-gray-500">
          {availableCount}/{room.capacity} disponibles
        </p>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Haz clic en una cama para bloquearla por mantenimiento sin afectar el resto del cupo.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {room.spots.map((spot) => {
          const blocked = room.blockedSpots.includes(spot.spotNumber);
          return (
            <button
              key={spot.spotNumber}
              type="button"
              onClick={() => toggleSpot(spot.spotNumber)}
              title={blocked ? `${spot.label} — bloqueada por mantenimiento` : spot.label}
              className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                blocked
                  ? "bg-amber-100 text-amber-700 line-through decoration-2"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {spot.spotNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
