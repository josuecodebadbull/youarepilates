"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { initials, useWeekClassCounts } from "@/lib/admin/data";
import type { InstructorDoc } from "@/lib/types/firestore";
import { sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { AddTile, PrimaryAction, SheetFooter, Switch, fieldLabelClass, textareaClass } from "@/components/admin/ui";

interface Instructor extends InstructorDoc {
  id: string;
}

export default function InstructoresPage() {
  const { tenantId } = useTenant();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loaded, setLoaded] = useState(false);
  // `undefined` = closed, `null` = creating, an instructor = editing them.
  const [dialog, setDialog] = useState<Instructor | null | undefined>(undefined);
  const closeDialog = useCallback(() => setDialog(undefined), []);
  const { byInstructor } = useWeekClassCounts(tenantId);

  useEffect(() => {
    const instructorsQuery = query(collection(db, "tenants", tenantId, "instructors"), orderBy("name"));
    return onSnapshot(instructorsQuery, (snapshot) => {
      setInstructors(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as InstructorDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Instructores"
        description="Cada clase se asigna a uno de ellos; cada uno ve solo las clases que le tocan."
        action={<PrimaryAction onClick={() => setDialog(null)}>Nuevo instructor</PrimaryAction>}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {instructors.map((instructor) => {
          const count = byInstructor[instructor.id] ?? 0;
          return (
            <button
              key={instructor.id}
              onClick={() => setDialog(instructor)}
              className={`flex flex-col gap-3.5 rounded-[22px] border border-ink/[0.08] bg-white p-5 text-left text-ink transition-colors hover:border-ink/[0.16] ${
                instructor.active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <InstructorAvatar name={instructor.name} photoUrl={instructor.photoUrl} active={instructor.active} size={56} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base font-bold">{instructor.name}</span>
                  <span
                    className={`self-start rounded-full px-[9px] py-0.5 text-[11px] font-bold ${
                      instructor.active ? "bg-brand-50 text-brand-700" : "bg-[#F3F2EE] text-ink-soft"
                    }`}
                  >
                    {instructor.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-[13px] leading-[1.55] text-ink-soft">
                {instructor.bio || "Sin bio todavía — toca para agregarla."}
              </p>
              <div className="mt-auto flex justify-between border-t border-ink/[0.06] pt-3 text-[13px]">
                <span className="text-ink-soft">Esta semana</span>
                <span className="font-bold">
                  {instructor.active ? `${count} ${count === 1 ? "clase" : "clases"}` : "—"}
                </span>
              </div>
            </button>
          );
        })}
        {loaded && (
          <AddTile
            label={instructors.length === 0 ? "Agrega tu primer instructor" : "Nuevo instructor"}
            onClick={() => setDialog(null)}
            className="min-h-[200px]"
          />
        )}
      </div>

      {dialog !== undefined && (
        <InstructorSheet tenantId={tenantId} instructor={dialog ?? undefined} onDone={closeDialog} />
      )}
    </div>
  );
}

function InstructorAvatar({
  name,
  photoUrl,
  active,
  size,
}: {
  name: string;
  photoUrl: string | null;
  active: boolean;
  size: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
        active ? "bg-brand-50 text-brand-800" : "bg-[#F3F2EE] text-ink-soft"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials(name || "?")}
    </span>
  );
}

function InstructorSheet({
  tenantId,
  instructor,
  onDone,
}: {
  tenantId: string;
  instructor?: Instructor;
  onDone: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(instructor?.name ?? "");
  const [bio, setBio] = useState(instructor?.bio ?? "");
  const [active, setActive] = useState(instructor?.active ?? true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPhotoUrl = removePhoto ? null : (photoPreviewUrl ?? instructor?.photoUrl ?? null);

  function handlePhotoChange(file: File | null) {
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = { name: name.trim(), bio: bio.trim(), active };
      const docRef = instructor
        ? doc(db, "tenants", tenantId, "instructors", instructor.id)
        : await addDoc(collection(db, "tenants", tenantId, "instructors"), {
            ...data,
            photoUrl: null,
          } satisfies InstructorDoc);
      if (instructor) await updateDoc(docRef, data);

      if (photoFile) {
        const { blob, contentType, extension } = await optimizeImage(photoFile);
        const photoRef = ref(storage, `tenants/${tenantId}/instructors/${docRef.id}/photo.${extension}`);
        await uploadBytes(photoRef, blob, { contentType });
        // Cache-bust: replacing photo.jpg with another photo.jpg keeps the same path.
        const photoUrl = await getDownloadURL(photoRef);
        await updateDoc(docRef, { photoUrl });
      } else if (removePhoto && instructor?.photoUrl) {
        await updateDoc(docRef, { photoUrl: null });
        // Best effort: the record no longer points at it, so a failed cleanup is harmless.
        await deleteObject(ref(storage, instructor.photoUrl)).catch(() => undefined);
      }

      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      toast(instructor ? "Cambios guardados" : "Instructor agregado");
      onDone();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={instructor ? "Editar instructor" : "Nuevo instructor"}
      subtitle="Tus alumnos lo verán al elegir una clase"
      onClose={onDone}
      footer={
        <SheetFooter
          formId="instructor-form"
          onCancel={onDone}
          submitting={submitting}
          label={instructor ? "Guardar cambios" : "Agregar instructor"}
        />
      }
    >
      <form id="instructor-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <InstructorAvatar name={name} photoUrl={currentPhotoUrl} active size={72} />
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-10 rounded-xl border border-ink/[0.14] bg-white px-3.5 text-[13px] font-semibold text-ink"
              >
                {currentPhotoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    handlePhotoChange(null);
                    setRemovePhoto(true);
                  }}
                  className="h-10 px-2 text-[13px] font-semibold text-[#B42318]"
                >
                  Quitar
                </button>
              )}
            </div>
            <span className="text-xs text-ink-faint">Sin foto se muestran sus iniciales.</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          />
        </div>

        <label className={fieldLabelClass}>
          Nombre completo
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana Torres"
            className={sheetInputClass}
          />
        </label>

        <label className={fieldLabelClass}>
          Bio
          <textarea
            rows={6}
            maxLength={2000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Formación, certificaciones y estilo de clase"
            className={textareaClass}
          />
          <span className="text-right text-xs font-normal text-ink-faint">{bio.length}/2000</span>
        </label>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3F2EE] p-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">Activo</span>
            <span className="text-xs text-ink-soft">Desactívalo si ya no da clases. Conserva su historial.</span>
          </div>
          <Switch checked={active} onChange={setActive} label="Activo" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
