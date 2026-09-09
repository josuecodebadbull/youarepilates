"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ClassLevel, ClassTypeDoc } from "@/lib/types/firestore";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";

interface ClassType extends ClassTypeDoc {
  id: string;
}

const LEVEL_LABELS: Record<ClassLevel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  embarazo_postparto: "Embarazo / Postparto",
};

const LEVEL_BADGE_CLASSES: Record<ClassLevel, string> = {
  basico: "bg-gray-100 text-gray-700",
  intermedio: "bg-blue-100 text-blue-700",
  avanzado: "bg-purple-100 text-purple-700",
  embarazo_postparto: "bg-pink-100 text-pink-700",
};

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
          icon="🧘"
          title="Todavía no tienes tipos de clase"
          description="Agrega al menos uno (ej. Reformer Básico) para poder programar horarios más adelante."
          action={
            <Button onClick={() => setFormOpen(true)}>+ Agregar mi primer tipo de clase</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classTypes.map((classType) => (
            <div key={classType.id} className="rounded-lg border border-gray-200 p-5">
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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "tenants", tenantId, "classTypes"), {
        name,
        level,
        durationMinutes,
        requiredCredits,
        description,
      } satisfies ClassTypeDoc);
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
      <h2 className="font-semibold text-gray-900">Nuevo tipo de clase</h2>

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
