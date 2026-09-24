"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useWeekClassCounts } from "@/lib/admin/data";
import type { ClassLevel, ClassTypeDoc } from "@/lib/types/firestore";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/lib/classLevel";
import { chipClass, sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge } from "@/components/admin/ClassRow";
import { useToast } from "@/components/admin/Toast";
import { AddTile, PrimaryAction, SheetFooter, Stepper, fieldLabelClass, textareaClass } from "@/components/admin/ui";

interface ClassType extends ClassTypeDoc {
  id: string;
}

const DURATION_OPTIONS = [45, 50, 55, 60];

export default function TiposDeClasePage() {
  const { tenant, tenantId } = useTenant();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loaded, setLoaded] = useState(false);
  // `undefined` = closed, `null` = creating, a class type = editing it.
  const [dialog, setDialog] = useState<ClassType | null | undefined>(undefined);
  const closeDialog = useCallback(() => setDialog(undefined), []);
  const { byType } = useWeekClassCounts(tenantId);

  useEffect(() => {
    const classTypesQuery = query(collection(db, "tenants", tenantId, "classTypes"), orderBy("name"));
    return onSnapshot(classTypesQuery, (snapshot) => {
      setClassTypes(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ClassTypeDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  return (
    <div>
      <PageHeader
        title="Tipos de clase"
        description="Las modalidades que ofreces. El nivel controla quién puede reservar cada clase."
        action={<PrimaryAction onClick={() => setDialog(null)}>Nuevo tipo</PrimaryAction>}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3.5">
        {classTypes.map((classType) => {
          const colors = LEVEL_COLORS[classType.level];
          const count = byType[classType.id] ?? 0;
          return (
            <button
              key={classType.id}
              onClick={() => setDialog(classType)}
              className="flex flex-col overflow-hidden rounded-[22px] border border-ink/[0.08] bg-white text-left text-ink transition-colors hover:border-ink/[0.16]"
            >
              <div
                className="relative flex h-28 items-end p-[18px]"
                style={{ background: colors.blockBg, color: colors.blockFg }}
              >
                {classType.photoUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={classType.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  </>
                )}
                <span
                  className={`relative font-display text-2xl font-semibold leading-[1.1] tracking-[-0.01em] ${
                    classType.photoUrl ? "text-white" : ""
                  }`}
                >
                  {classType.name}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 px-[18px] pb-[18px] pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge classType={classType} />
                  <span className="text-[13px] text-ink-soft">
                    {classType.durationMinutes} min · {classType.requiredCredits}{" "}
                    {classType.requiredCredits === 1 ? "crédito" : "créditos"}
                  </span>
                </div>
                {classType.description && (
                  <p className="line-clamp-2 text-[13px] leading-normal text-ink-soft">{classType.description}</p>
                )}
                <span className="mt-auto text-xs font-semibold text-brand-700">
                  {count} {count === 1 ? "clase" : "clases"} esta semana
                </span>
              </div>
            </button>
          );
        })}
        {loaded && (
          <AddTile
            label={classTypes.length === 0 ? "Crea tu primer tipo de clase" : "Nuevo tipo"}
            onClick={() => setDialog(null)}
            className="min-h-[220px]"
          />
        )}
      </div>

      {dialog !== undefined && (
        <ClassTypeSheet
          tenantId={tenantId}
          classType={dialog ?? undefined}
          minBasicClasses={tenant.settings.minBasicClassesForAdvanced}
          onDone={closeDialog}
        />
      )}
    </div>
  );
}

function ClassTypeSheet({
  tenantId,
  classType,
  minBasicClasses,
  onDone,
}: {
  tenantId: string;
  classType?: ClassType;
  minBasicClasses: number;
  onDone: () => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(classType?.name ?? "");
  const [level, setLevel] = useState<ClassLevel>(classType?.level ?? "basico");
  const [durationMinutes, setDurationMinutes] = useState(classType?.durationMinutes ?? 50);
  const [requiredCredits, setRequiredCredits] = useState(classType?.requiredCredits ?? 1);
  const [description, setDescription] = useState(classType?.description ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const durationOptions = DURATION_OPTIONS.includes(durationMinutes)
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, durationMinutes].sort((a, b) => a - b);
  const displayedPhoto = photoPreviewUrl ?? classType?.photoUrl ?? null;

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
      const data = { name: name.trim(), level, durationMinutes, requiredCredits, description: description.trim() };
      const docRef = classType
        ? doc(db, "tenants", tenantId, "classTypes", classType.id)
        : await addDoc(collection(db, "tenants", tenantId, "classTypes"), {
            ...data,
            photoUrl: null,
          } satisfies ClassTypeDoc);
      if (classType) await updateDoc(docRef, data);

      if (photoFile) {
        const { blob, contentType, extension } = await optimizeImage(photoFile);
        const photoRef = ref(storage, `tenants/${tenantId}/classTypes/${docRef.id}/photo.${extension}`);
        await uploadBytes(photoRef, blob, { contentType });
        const photoUrl = await getDownloadURL(photoRef);
        await updateDoc(docRef, { photoUrl });
      }

      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      toast(classType ? "Cambios guardados" : "Tipo de clase creado");
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={classType ? "Editar tipo de clase" : "Nuevo tipo de clase"}
      subtitle="Se muestra en el catálogo de la app"
      onClose={onDone}
      footer={
        <SheetFooter
          formId="classtype-form"
          onCancel={onDone}
          submitting={submitting}
          label={classType ? "Guardar cambios" : "Crear tipo"}
        />
      }
    >
      <form id="classtype-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={fieldLabelClass}>
          Nombre
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Reformer Cardio Jump"
            className={sheetInputClass}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Nivel</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(LEVEL_LABELS) as ClassLevel[]).map((value) => (
              <button key={value} type="button" onClick={() => setLevel(value)} className={chipClass(level === value)}>
                {LEVEL_LABELS[value]}
              </button>
            ))}
          </div>
          <span className="text-xs leading-[1.45] text-ink-faint">
            {level === "avanzado"
              ? `Solo pueden reservar alumnos con ${minBasicClasses} clases básicas validadas (cámbialo en Configuración).`
              : "Todos los alumnos pueden reservar este nivel."}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Duración</span>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDurationMinutes(minutes)}
                className={chipClass(durationMinutes === minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">Créditos por reserva</span>
            <span className="text-xs text-ink-soft">Normalmente 1</span>
          </div>
          <Stepper
            label="créditos"
            value={requiredCredits}
            onDecrement={() => setRequiredCredits((n) => Math.max(1, n - 1))}
            onIncrement={() => setRequiredCredits((n) => Math.min(10, n + 1))}
          />
        </div>

        <label className={fieldLabelClass}>
          Descripción
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué trabaja la clase y para quién es"
            className={textareaClass}
          />
        </label>

        <div className="flex items-center gap-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F2EE] text-xs text-ink-faint">
            {displayedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayedPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              "Sin foto"
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-10 self-start rounded-xl border border-ink/[0.14] bg-white px-3.5 text-[13px] font-semibold text-ink"
            >
              {displayedPhoto ? "Cambiar portada" : "Subir portada"}
            </button>
            <span className="text-xs text-ink-faint">Opcional. Sin foto se usa el color del nivel.</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          />
        </div>
      </form>
    </Modal>
  );
}
