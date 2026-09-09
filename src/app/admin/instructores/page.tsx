"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Users } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { InstructorDoc } from "@/lib/types/firestore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface Instructor extends InstructorDoc {
  id: string;
}

export default function InstructoresPage() {
  const { tenantId } = useTenant();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
        action={
          !formOpen && <Button onClick={() => setFormOpen(true)}>+ Agregar instructor</Button>
        }
      />

      {formOpen && (
        <InstructorForm tenantId={tenantId} onDone={() => setFormOpen(false)} />
      )}

      {loaded && instructors.length === 0 && !formOpen ? (
        <EmptyState
          icon={<Users className="h-7 w-7" strokeWidth={1.75} />}
          title="Todavía no tienes instructores"
          description="Agrega a tu primer coach para poder asignarlo a los horarios."
          action={<Button onClick={() => setFormOpen(true)}>+ Agregar mi primer instructor</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="flex gap-4 rounded-lg border border-gray-200 p-5">
              <Avatar name={instructor.name} photoUrl={instructor.photoUrl} size={48} />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{instructor.name}</p>
                  {!instructor.active && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      Inactivo
                    </span>
                  )}
                </div>
                {instructor.bio && (
                  <p className="mt-1 text-sm text-gray-600">{instructor.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructorForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
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
      const docRef = await addDoc(collection(db, "tenants", tenantId, "instructors"), {
        name,
        bio,
        photoUrl: null,
        active: true,
      } satisfies InstructorDoc);

      if (photoFile) {
        const photoRef = ref(storage, `tenants/${tenantId}/instructors/${docRef.id}/photo`);
        await uploadBytes(photoRef, photoFile, { contentType: photoFile.type });
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
      className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5"
    >
      <h2 className="font-semibold text-gray-900">Nuevo instructor</h2>

      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} photoUrl={photoPreviewUrl} size={56} />
        <FormField
          label="Foto de perfil"
          htmlFor="instructor-photo"
          hint="Opcional — si no subes una, se genera un avatar con sus iniciales"
        >
          <input
            id="instructor-photo"
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800"
          />
        </FormField>
      </div>

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
        hint="Opcional — una o dos líneas sobre su experiencia, visible para los alumnos"
      >
        <textarea
          id="instructor-bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Instructora certificada en Reformer con 5 años de experiencia..."
          className={inputClass}
        />
      </FormField>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar instructor"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
