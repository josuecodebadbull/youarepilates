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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ArrowLeft, BedDouble, ImagePlus, Pencil } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { buildSpotsFromRowSizes, groupSpotsByRow, rowSizesFromSpots } from "@/lib/roomLayout";
import type { BranchDoc, RoomDoc } from "@/lib/types/firestore";
import { RoomLayoutEditor } from "@/components/admin/RoomLayoutEditor";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileInput } from "@/components/ui/FileInput";
import { FormField, inputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PilatesBedIcon } from "@/components/ui/PilatesBedIcon";

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
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

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
      <Link
        href="/admin/sedes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Sedes
      </Link>

      <PageHeader
        title={branch?.name ?? "Sede"}
        description={
          branch
            ? `${branch.address} — administra las salas y camas de reformer de esta sede.`
            : undefined
        }
        action={<Button onClick={() => setFormOpen(true)}>+ Agregar sala</Button>}
      />

      {branch && <BranchInfoForm tenantId={tenantId} branchId={branchId} branch={branch} />}

      {formOpen && (
        <Modal title="Nueva sala" onClose={() => setFormOpen(false)}>
          <RoomForm tenantId={tenantId} branchId={branchId} onDone={() => setFormOpen(false)} />
        </Modal>
      )}

      {editingRoom && (
        <Modal title="Editar sala" onClose={() => setEditingRoom(null)}>
          <RoomEditForm
            tenantId={tenantId}
            branchId={branchId}
            room={editingRoom}
            onDone={() => setEditingRoom(null)}
          />
        </Modal>
      )}

      {loaded && rooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes salas en esta sede"
          description='Agrega una sala (ej. "Sala Reformer 1") y cuántas camas o lugares tiene, para poder programar horarios ahí.'
          action={<Button onClick={() => setFormOpen(true)}>+ Agregar mi primera sala</Button>}
        />
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              tenantId={tenantId}
              branchId={branchId}
              room={room}
              onEdit={() => setEditingRoom(room)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BranchInfoForm({
  tenantId,
  branchId,
  branch,
}: {
  tenantId: string;
  branchId: string;
  branch: BranchDoc;
}) {
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [arrivalNote, setArrivalNote] = useState(branch.arrivalNote ?? "");
  const [photoUrl, setPhotoUrl] = useState(branch.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handlePhotoChange(file: File | null) {
    setPhotoFile(file);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      let nextPhotoUrl = photoUrl;
      if (photoFile) {
        const photoRef = ref(storage, `tenants/${tenantId}/branches/${branchId}/photo`);
        await uploadBytes(photoRef, photoFile, { contentType: photoFile.type });
        nextPhotoUrl = await getDownloadURL(photoRef);
        setPhotoUrl(nextPhotoUrl);
        if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
      }

      await updateDoc(doc(db, "tenants", tenantId, "branches", branchId), {
        phone,
        arrivalNote,
        photoUrl: nextPhotoUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const displayedPhotoUrl = photoPreviewUrl ?? photoUrl;

  return (
    <div className="mb-6 max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <h2 className="font-semibold text-gray-900">Información para tus alumnos</h2>
      <p className="text-sm text-gray-500">
        Se muestra en la sección &ldquo;Estudio&rdquo; de la app, junto con la dirección
        y el mapa de esta sede, para que sepan cómo llegar a su clase.
      </p>

      <FormField label="Foto de la sede" htmlFor="branch-photo" hint="Opcional">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
            {displayedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayedPhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
            )}
          </div>
          <FileInput id="branch-photo" accept="image/*" onChange={handlePhotoChange} buttonLabel="Subir foto" />
        </div>
      </FormField>

      <FormField label="Teléfono de la sede" htmlFor="branch-phone" hint="Opcional — con lada">
        <input
          id="branch-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="55 1234 5678"
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Cómo llegar / qué llevar"
        htmlFor="branch-arrival"
        hint='Estacionamiento, referencias, qué traer a clase — ej. "Estacionamiento gratuito en el sótano, entra por la puerta lateral"'
      >
        <textarea
          id="branch-arrival"
          rows={3}
          value={arrivalNote}
          onChange={(e) => setArrivalNote(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar información"}
        </Button>
        {saved && <span className="text-sm text-green-600">¡Guardado!</span>}
      </div>
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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(name: string, rowSizes: number[]) {
    setSubmitting(true);
    try {
      const spots = buildSpotsFromRowSizes(rowSizes);
      await addDoc(collection(db, "tenants", tenantId, "branches", branchId, "rooms"), {
        name,
        capacity: spots.length,
        spots,
        blockedSpots: [],
      } satisfies RoomDoc);
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RoomLayoutEditor
      initialName=""
      initialRowSizes={[4]}
      submitLabel="Guardar sala"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onDone}
    />
  );
}

function RoomEditForm({
  tenantId,
  branchId,
  room,
  onDone,
}: {
  tenantId: string;
  branchId: string;
  room: Room;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(name: string, rowSizes: number[]) {
    setSubmitting(true);
    try {
      const spots = buildSpotsFromRowSizes(rowSizes);
      const validSpotNumbers = new Set(spots.map((s) => s.spotNumber));
      const blockedSpots = room.blockedSpots.filter((n) => validSpotNumbers.has(n));

      await updateDoc(doc(db, "tenants", tenantId, "branches", branchId, "rooms", room.id), {
        name,
        capacity: spots.length,
        spots,
        blockedSpots,
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RoomLayoutEditor
      initialName={room.name}
      initialRowSizes={rowSizesFromSpots(room.spots)}
      submitLabel="Guardar cambios"
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onDone}
    />
  );
}

function RoomCard({
  tenantId,
  branchId,
  room,
  onEdit,
}: {
  tenantId: string;
  branchId: string;
  room: Room;
  onEdit: () => void;
}) {
  const availableCount = room.capacity - room.blockedSpots.length;
  const rows = groupSpotsByRow(room.spots);

  async function toggleSpot(spotNumber: number) {
    const roomRef = doc(db, "tenants", tenantId, "branches", branchId, "rooms", room.id);
    const isBlocked = room.blockedSpots.includes(spotNumber);
    await updateDoc(roomRef, {
      blockedSpots: isBlocked ? arrayRemove(spotNumber) : arrayUnion(spotNumber),
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-gray-900">{room.name}</p>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-sm text-gray-500">
            {availableCount}/{room.capacity} disponibles
          </p>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-soft hover:bg-gray-100 hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Editar
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Haz clic en una cama para bloquearla por mantenimiento sin afectar el resto del cupo.
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((rowSpots, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-1.5">
            {rowSpots.map((spot) => {
              const blocked = room.blockedSpots.includes(spot.spotNumber);
              return (
                <button
                  key={spot.spotNumber}
                  type="button"
                  onClick={() => toggleSpot(spot.spotNumber)}
                  title={blocked ? `${spot.label} — bloqueada por mantenimiento` : spot.label}
                  className={`relative flex h-11 w-7 items-center justify-center transition-colors ${
                    blocked ? "text-amber-500" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <PilatesBedIcon className="h-full w-full" />
                  <span
                    className={`absolute text-[10px] font-semibold ${blocked ? "text-amber-700 line-through" : "text-gray-700"}`}
                  >
                    {spot.spotNumber}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
