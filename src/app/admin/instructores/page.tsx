"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Pencil, Users } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { InstructorDoc } from "@/lib/types/firestore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileInput } from "@/components/ui/FileInput";
import { FormField, inputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";

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

  useEffect(() => {
    const instructorsQuery = query(
      collection(db, "tenants", tenantId, "instructors"),
      orderBy("name"),
    );
    return onSnapshot(instructorsQuery, (snapshot) => {
      setInstructors(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as InstructorDoc) })),
      );
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Instructores"
        description="Los coaches que dan clases en tu estudio. Cada horario que programes se asigna a uno de ellos, y ellos ven en su propia vista solo las clases que les tocan."
        action={<Button onClick={() => setDialog(null)}>+ Agregar instructor</Button>}
      />

      {dialog !== undefined && (
        <Modal title={dialog ? "Editar instructor" : "Nuevo instructor"} onClose={closeDialog}>
          <InstructorForm tenantId={tenantId} instructor={dialog ?? undefined} onDone={closeDialog} />
        </Modal>
      )}

      {loaded && instructors.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes instructores"
          description="Agrega a tu primer coach para poder asignarlo a los horarios."
          action={<Button onClick={() => setDialog(null)}>+ Agregar mi primer instructor</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              className={`flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md ${
                instructor.active ? "" : "opacity-70"
              }`}
            >
              <Avatar name={instructor.name} photoUrl={instructor.photoUrl} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-gray-900">{instructor.name}</p>
                  {!instructor.active && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      Inactivo
                    </span>
                  )}
                </div>
                {instructor.bio ? (
                  <BioText text={instructor.bio} />
                ) : (
                  <button
                    onClick={() => setDialog(instructor)}
                    className="mt-1 text-sm text-gray-400 hover:text-brand-700"
                  >
                    Agregar una bio
                  </button>
                )}
              </div>
              <button
                onClick={() => setDialog(instructor)}
                aria-label={`Editar ${instructor.name}`}
                className="-mr-2 -mt-1 shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Long bios collapse to four lines with a "Ver más" toggle — shown only when the text
 * actually overflows — and keep the author's line breaks so paragraphs stay readable.
 */
function BioText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className="mt-1.5">
      <p
        ref={ref}
        className={`whitespace-pre-line break-words text-sm leading-relaxed text-gray-600 ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-brand-700 hover:underline"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}

function InstructorForm({
  tenantId,
  instructor,
  onDone,
}: {
  tenantId: string;
  instructor?: Instructor;
  onDone: () => void;
}) {
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
      onDone();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} photoUrl={currentPhotoUrl} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Foto de perfil</p>
          <p className="text-xs text-ink-soft">Opcional. Sin foto se muestra un avatar con sus iniciales.</p>
          {currentPhotoUrl && (
            <button
              type="button"
              onClick={() => {
                handlePhotoChange(null);
                setRemovePhoto(true);
              }}
              className="mt-1 text-xs font-medium text-red-600 hover:underline"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>
      <FileInput
        id="instructor-photo"
        accept="image/*"
        onChange={handlePhotoChange}
        buttonLabel={currentPhotoUrl ? "Cambiar foto" : "Subir foto"}
      />

      <FormField
        label="Nombre completo"
        htmlFor="instructor-name"
        hint="Como lo verán tus alumnos al elegir una clase"
        required
      >
        <input
          id="instructor-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ana Torres"
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Bio"
        htmlFor="instructor-bio"
        hint="Opcional — su experiencia y formación. Puedes separar párrafos con Enter"
      >
        <textarea
          id="instructor-bio"
          rows={8}
          maxLength={2000}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Instructora certificada en Reformer con 5 años de experiencia..."
          className={`${inputClass} min-h-[10rem] resize-y leading-relaxed`}
        />
        <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/2000</p>
      </FormField>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Instructor activo</span>
          <span className="block text-xs text-ink-soft">
            Desmárcalo si ya no da clases en tu estudio. Conserva su historial.
          </span>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : instructor ? "Guardar cambios" : "Guardar instructor"}
        </Button>
      </div>
    </form>
  );
}
