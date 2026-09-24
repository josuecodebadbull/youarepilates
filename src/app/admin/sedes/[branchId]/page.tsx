"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { ChevronLeft } from "lucide-react";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { buildSpotsFromRowSizes, groupSpotsByRow, rowSizesFromSpots } from "@/lib/roomLayout";
import type { BranchDoc, RoomDoc } from "@/lib/types/firestore";
import { sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { pageTitleClass } from "@/components/ui/PageHeader";
import { PilatesBedIcon } from "@/components/ui/PilatesBedIcon";
import { GalleryUploader } from "@/components/admin/GalleryUploader";
import { RoomLayoutEditor } from "@/components/admin/RoomLayoutEditor";
import { useToast } from "@/components/admin/Toast";
import { SheetFooter, cardClass, fieldLabelClass, textareaClass } from "@/components/admin/ui";

interface Room extends RoomDoc {
  id: string;
}

export default function SedeDetailPage() {
  const { tenantId, tenant } = useTenant();
  const { branchId } = useParams<{ branchId: string }>();

  const [branch, setBranch] = useState<BranchDoc | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  // `undefined` = closed, `null` = creating, a room = editing it.
  const [roomDialog, setRoomDialog] = useState<Room | null | undefined>(undefined);

  useEffect(() => {
    return onSnapshot(doc(db, "tenants", tenantId, "branches", branchId), (snap) => {
      setBranch(snap.exists() ? (snap.data() as BranchDoc) : null);
    });
  }, [tenantId, branchId]);

  useEffect(() => {
    const roomsQuery = query(collection(db, "tenants", tenantId, "branches", branchId, "rooms"), orderBy("name"));
    return onSnapshot(roomsQuery, (snapshot) => {
      setRooms(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as RoomDoc) })));
      setLoaded(true);
    });
  }, [tenantId, branchId]);

  return (
    <div className="flex flex-col gap-[18px]">
      <Link
        href="/admin/sedes"
        className="flex h-9 items-center gap-1 self-start rounded-[10px] pl-1.5 pr-3 text-sm font-semibold text-ink-soft hover:bg-[#F3F2EE] hover:text-ink"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} /> Sedes
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className={pageTitleClass}>{branch?.name ?? "Sede"}</h1>
        {branch && <p className="text-sm text-ink-soft">{branch.address}</p>}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-semibold text-ink">Salas</h2>
            <button
              onClick={() => setRoomDialog(null)}
              className="h-10 rounded-xl border border-ink/[0.14] bg-white px-3.5 text-[13px] font-semibold text-ink hover:bg-[#F7F6F3]"
            >
              Agregar sala
            </button>
          </div>
          {loaded && rooms.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-ink/15 px-5 py-8 text-center">
              <p className="text-[15px] font-semibold text-ink">Todavía no hay salas</p>
              <p className="max-w-sm text-sm text-ink-soft">
                Agrega una sala y cuántas camas tiene para poder programar clases aquí.
              </p>
              <button
                onClick={() => setRoomDialog(null)}
                className="h-11 rounded-xl bg-ink px-[18px] text-sm font-semibold text-white"
              >
                Agregar mi primera sala
              </button>
            </div>
          )}
          {rooms.map((room) => (
            <RoomCard key={room.id} tenantId={tenantId} branchId={branchId} room={room} onEdit={() => setRoomDialog(room)} />
          ))}
        </section>

        {branch && (
          <section className="flex min-w-0 flex-col gap-3">
            <h2 className="text-[22px] font-semibold text-ink">Info para alumnos</h2>
            <BranchInfoForm tenantId={tenantId} branchId={branchId} branch={branch} slug={tenant.slug} />
          </section>
        )}
      </div>

      {roomDialog !== undefined && (
        <RoomSheet
          tenantId={tenantId}
          branchId={branchId}
          room={roomDialog ?? undefined}
          onDone={() => setRoomDialog(undefined)}
        />
      )}
    </div>
  );
}

function BranchInfoForm({
  tenantId,
  branchId,
  branch,
  slug,
}: {
  tenantId: string;
  branchId: string;
  branch: BranchDoc;
  slug: string;
}) {
  const toast = useToast();
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [arrivalNote, setArrivalNote] = useState(branch.arrivalNote ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = phone !== (branch.phone ?? "") || arrivalNote !== (branch.arrivalNote ?? "");

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "tenants", tenantId, "branches", branchId), { phone, arrivalNote });
      toast("Información de la sede guardada");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`flex flex-col gap-4 p-5 ${cardClass}`}>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">Galería</span>
        <GalleryUploader tenantId={tenantId} branchId={branchId} photoUrls={branch.photoUrls ?? []} />
      </div>
      <label className={fieldLabelClass}>
        Teléfono
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="55 1234 5678"
          className={`${sheetInputClass} h-[46px]`}
        />
      </label>
      <label className={fieldLabelClass}>
        Cómo llegar / qué llevar
        <textarea
          rows={3}
          value={arrivalNote}
          onChange={(e) => setArrivalNote(e.target.value)}
          placeholder="Estacionamiento, referencias, qué traer a clase…"
          className={textareaClass}
        />
      </label>
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`h-11 rounded-xl px-[18px] text-sm font-semibold ${
            dirty ? "bg-ink text-white" : "cursor-default bg-[#E7E5E0] text-ink-faint"
          }`}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <a
          href={`/s/${slug}/estudio`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold text-brand-700 hover:text-brand-800"
        >
          Ver en la app
        </a>
      </div>
    </div>
  );
}

function RoomSheet({
  tenantId,
  branchId,
  room,
  onDone,
}: {
  tenantId: string;
  branchId: string;
  room?: Room;
  onDone: () => void;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(name: string, rowSizes: number[]) {
    setSubmitting(true);
    try {
      const spots = buildSpotsFromRowSizes(rowSizes);
      if (room) {
        const validSpotNumbers = new Set(spots.map((s) => s.spotNumber));
        await updateDoc(doc(db, "tenants", tenantId, "branches", branchId, "rooms", room.id), {
          name,
          capacity: spots.length,
          spots,
          blockedSpots: room.blockedSpots.filter((n) => validSpotNumbers.has(n)),
        });
      } else {
        await addDoc(collection(db, "tenants", tenantId, "branches", branchId, "rooms"), {
          name,
          capacity: spots.length,
          spots,
          blockedSpots: [],
        } satisfies RoomDoc);
      }
      toast(room ? "Sala actualizada" : "Sala creada");
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={room ? "Editar sala" : "Nueva sala"}
      subtitle="Acomoda las camas como están en tu sala"
      onClose={onDone}
      footer={
        <SheetFooter
          formId="room-form"
          onCancel={onDone}
          submitting={submitting}
          label={room ? "Guardar cambios" : "Crear sala"}
        />
      }
    >
      <RoomLayoutEditor
        formId="room-form"
        initialName={room?.name ?? ""}
        initialRowSizes={room ? rowSizesFromSpots(room.spots) : [4]}
        onSubmit={handleSubmit}
      />
    </Modal>
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
  const toast = useToast();
  const availableCount = room.capacity - room.blockedSpots.length;
  const rows = groupSpotsByRow(room.spots);

  async function toggleSpot(spotNumber: number) {
    const roomRef = doc(db, "tenants", tenantId, "branches", branchId, "rooms", room.id);
    const isBlocked = room.blockedSpots.includes(spotNumber);
    await updateDoc(roomRef, {
      blockedSpots: isBlocked ? arrayRemove(spotNumber) : arrayUnion(spotNumber),
    });
    toast(isBlocked ? `Cama ${spotNumber} disponible de nuevo` : `Cama ${spotNumber} en mantenimiento`);
  }

  return (
    <div className={`flex flex-col gap-4 p-5 ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold text-ink">{room.name}</span>
          <span className="text-[13px] text-ink-soft">
            {availableCount} de {room.capacity} camas disponibles
          </span>
        </div>
        <button
          onClick={onEdit}
          className="h-9 rounded-[10px] bg-[#F3F2EE] px-3 text-[13px] font-semibold text-ink hover:bg-[#EAE8E3]"
        >
          Editar
        </button>
      </div>

      <div className="flex flex-col items-center gap-3.5 rounded-2xl bg-canvas px-3 py-[18px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Frente · espejo</span>
        {rows.map((rowSpots, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-2.5">
            {rowSpots.map((spot) => {
              const blocked = room.blockedSpots.includes(spot.spotNumber);
              return (
                <button
                  key={spot.spotNumber}
                  type="button"
                  onClick={() => toggleSpot(spot.spotNumber)}
                  title={blocked ? `${spot.label} — en mantenimiento` : `${spot.label} — disponible`}
                  className={`relative flex h-[76px] w-14 items-center justify-center rounded-[14px] shadow-[0_1px_2px_rgba(22,24,29,0.06)] ${
                    blocked ? "bg-amber-100 text-amber-600" : "bg-white text-brand-500"
                  }`}
                >
                  <PilatesBedIcon className="h-[60px] w-9" filled />
                  <span
                    className={`absolute text-[13px] font-bold ${
                      blocked ? "text-amber-800 line-through" : "text-brand-800"
                    }`}
                  >
                    {spot.spotNumber}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3.5 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-brand-500" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-600" />
          En mantenimiento
        </span>
        <span>Toca una cama para bloquearla sin cambiar el cupo total.</span>
      </div>
    </div>
  );
}
