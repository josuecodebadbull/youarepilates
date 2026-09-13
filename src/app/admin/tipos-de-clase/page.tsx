"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Dumbbell, ImagePlus } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ClassLevel, ClassTypeDoc } from "@/lib/types/firestore";
import { LEVEL_BADGE_CLASSES, LEVEL_LABELS } from "@/lib/classLevel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileInput } from "@/components/ui/FileInput";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface ClassType extends ClassTypeDoc {
  id: string;
}

export default function TiposDeClasePage() {
  const { tenant, tenantId } = useTenant();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const classTypesQuery = query(
      collection(db, "tenants", tenantId, "classTypes"),
      orderBy("name"),
    );
    return onSnapshot(classTypesQuery, (snapshot) => {
      setClassTypes(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ClassTypeDoc) })),
      );
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Tipos de clase"
        description="Las modalidades que ofreces (Mat, Reformer, Cadillac...). Cada horario que programes usa uno de estos tipos, y el nivel controla qué tan avanzado debe estar un alumno para reservarlo."
        action={
          !formOpen && <Button onClick={() => setFormOpen(true)}>+ Agregar tipo de clase</Button>
        }
      />

      {formOpen && (
        <ClassTypeForm
          tenantId={tenantId}
          minBasicClasses={tenant.settings.minBasicClassesForAdvanced}
          onDone={() => setFormOpen(false)}
        />
      )}

      {loaded && classTypes.length === 0 && !formOpen ? (
        <EmptyState
          icon={<Dumbbell className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes tipos de clase"
          description="Agrega al menos uno (ej. Reformer Básico) para poder programar horarios más adelante."
          action={
            <Button onClick={() => setFormOpen(true)}>+ Agregar mi primer tipo de clase</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classTypes.map((classType) => (
            <div key={classType.id} className="overflow-hidden rounded-lg border border-gray-200">
              {classType.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={classType.photoUrl} alt="" className="h-28 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{classType.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_BADGE_CLASSES[classType.level]}`}
                  >
                    {LEVEL_LABELS[classType.level]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {classType.durationMinutes} min · {classType.requiredCredits}{" "}
                  {classType.requiredCredits === 1 ? "crédito" : "créditos"}
                </p>
                {classType.description && (
                  <p className="mt-2 text-sm text-gray-600">{classType.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassTypeForm({
  tenantId,
  minBasicClasses,
  onDone,
}: {
  tenantId: string;
  minBasicClasses: number;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<ClassLevel>("basico");
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [requiredCredits, setRequiredCredits] = useState(1);
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(file: File | null) {
    setPhotoFile(file);
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "tenants", tenantId, "classTypes"), {
        name,
        level,
        durationMinutes,
        requiredCredits,
        description,
        photoUrl: null,
      } satisfies ClassTypeDoc);

      if (photoFile) {
        const { blob, contentType, extension } = await optimizeImage(photoFile);
        const photoRef = ref(storage, `tenants/${tenantId}/classTypes/${docRef.id}/photo.${extension}`);
        await uploadBytes(photoRef, blob, { contentType });
        const photoUrl = await getDownloadURL(photoRef);
        await updateDoc(docRef, { photoUrl });
      }

      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
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
      <h2 className="font-semibold text-gray-900">Nuevo tipo de clase</h2>

      <FormField label="Foto de portada" htmlFor="classtype-photo" hint="Opcional — se muestra en el catálogo de clases">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
            {photoPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
            )}
          </div>
          <FileInput id="classtype-photo" accept="image/*" onChange={handlePhotoChange} buttonLabel="Subir foto" />
        </div>
      </FormField>

      <FormField
        label="Nombre"
        htmlFor="classtype-name"
        hint="Como lo verán tus alumnos en el catálogo de clases"
        required
      >
        <input
          id="classtype-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Reformer Cardio Jump"
          className={inputClass}
        />
      </FormField>

      <FormField
        label="Nivel"
        htmlFor="classtype-level"
        hint={`Un alumno necesita ${minBasicClasses} clases básicas validadas por un coach para poder reservar una de nivel "Avanzado" (lo puedes cambiar en la configuración del estudio)`}
        required
      >
        <select
          id="classtype-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as ClassLevel)}
          className={inputClass}
        >
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Duración (minutos)"
          htmlFor="classtype-duration"
          hint="Duración total de la clase"
          required
        >
          <input
            id="classtype-duration"
            type="number"
            min={1}
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Créditos requeridos"
          htmlFor="classtype-credits"
          hint="Cuántos créditos le cuesta a un alumno reservar esta clase"
          required
        >
          <input
            id="classtype-credits"
            type="number"
            min={1}
            required
            value={requiredCredits}
            onChange={(e) => setRequiredCredits(Number(e.target.value))}
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField
        label="Descripción"
        htmlFor="classtype-description"
        hint="Opcional — se muestra a los alumnos al explorar el catálogo"
      >
        <textarea
          id="classtype-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Clase de resistencia cardiovascular usando el carro del reformer..."
          className={inputClass}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar tipo de clase"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
