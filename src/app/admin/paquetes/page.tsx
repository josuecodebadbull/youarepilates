"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { formatMoney } from "@/lib/admin/data";
import type { PackageDoc } from "@/lib/types/firestore";
import { chipClass, sheetInputClass } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { AddTile, PrimaryAction, SheetFooter, Switch, Tag, fieldLabelClass } from "@/components/admin/ui";

interface PackageItem extends PackageDoc {
  id: string;
}

const VALIDITY_OPTIONS = [7, 30, 45, 60, 90];

export default function PaquetesPage() {
  const { tenantId } = useTenant();
  const toast = useToast();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // `undefined` = closed, `null` = creating, a package = editing it.
  const [dialog, setDialog] = useState<PackageItem | null | undefined>(undefined);
  const closeDialog = useCallback(() => setDialog(undefined), []);

  useEffect(() => {
    const packagesQuery = query(collection(db, "tenants", tenantId, "packages"), orderBy("name"));
    return onSnapshot(packagesQuery, (snapshot) => {
      setPackages(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PackageDoc) })));
      setLoaded(true);
    });
  }, [tenantId]);

  async function toggleVisible(pkg: PackageItem) {
    const active = pkg.active === false;
    await updateDoc(doc(db, "tenants", tenantId, "packages", pkg.id), { active });
    toast(active ? `${pkg.name} visible en la app` : `${pkg.name} oculto en la app`);
  }

  return (
    <div>
      <PageHeader
        title="Paquetes"
        description="Lo que tus alumnos compran para reservar. Cada clase cuesta sus créditos y el paquete vence al terminar su vigencia."
        action={<PrimaryAction onClick={() => setDialog(null)}>Nuevo paquete</PrimaryAction>}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
        {packages.map((pkg) => {
          const visible = pkg.active !== false;
          return (
            <div
              key={pkg.id}
              className={`flex flex-col gap-3.5 rounded-[22px] border border-ink/[0.08] bg-white p-5 ${visible ? "" : "opacity-60"}`}
            >
              <button onClick={() => setDialog(pkg)} className="flex flex-col gap-3 text-left text-ink">
                <span className="text-[15px] font-bold">{pkg.name}</span>
                <span className="font-display text-[38px] font-semibold leading-none tracking-[-0.02em]">
                  {formatMoney(pkg.price)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Tag>
                    {pkg.creditAmount} {pkg.creditAmount === 1 ? "crédito" : "créditos"}
                  </Tag>
                  <Tag>{pkg.validityDays} días</Tag>
                </div>
                <span className="text-[13px] text-ink-soft">
                  {pkg.creditAmount > 1
                    ? `${formatMoney(Math.round(pkg.price / pkg.creditAmount))} por clase`
                    : "Precio por clase"}
                </span>
              </button>
              <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-ink/[0.06] pt-3">
                <span className="text-[13px] font-semibold text-ink">
                  {visible ? "Visible en la app" : "Oculto en la app"}
                </span>
                <Switch checked={visible} onChange={() => toggleVisible(pkg)} label="Visible en la app" />
              </div>
            </div>
          );
        })}
        {loaded && (
          <AddTile
            label={packages.length === 0 ? "Crea tu primer paquete" : "Nuevo paquete"}
            onClick={() => setDialog(null)}
            className="min-h-[220px]"
          />
        )}
      </div>

      {dialog !== undefined && (
        <PackageSheet tenantId={tenantId} pkg={dialog ?? undefined} onDone={closeDialog} />
      )}
    </div>
  );
}

function PackageSheet({ tenantId, pkg, onDone }: { tenantId: string; pkg?: PackageItem; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(pkg?.name ?? "");
  const [creditAmount, setCreditAmount] = useState(pkg?.creditAmount ?? 10);
  const [price, setPrice] = useState<number | "">(pkg?.price ?? "");
  const [validityDays, setValidityDays] = useState(pkg?.validityDays ?? 45);
  const [submitting, setSubmitting] = useState(false);

  const validityOptions = VALIDITY_OPTIONS.includes(validityDays)
    ? VALIDITY_OPTIONS
    : [...VALIDITY_OPTIONS, validityDays].sort((a, b) => a - b);
  const priceValue = price === "" ? 0 : price;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const data = { name: name.trim(), creditAmount, price: priceValue, validityDays };
      if (pkg) {
        await updateDoc(doc(db, "tenants", tenantId, "packages", pkg.id), data);
      } else {
        await addDoc(collection(db, "tenants", tenantId, "packages"), { ...data, active: true });
      }
      toast(pkg ? "Paquete actualizado" : "Paquete creado");
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={pkg ? "Editar paquete" : "Nuevo paquete"}
      subtitle="Así lo verán tus alumnos al comprar"
      onClose={onDone}
      footer={
        <SheetFooter
          formId="package-form"
          onCancel={onDone}
          submitting={submitting}
          label={pkg ? "Guardar cambios" : "Crear paquete"}
        />
      }
    >
      <form id="package-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={fieldLabelClass}>
          Nombre del paquete
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pack 10 clases"
            className={sheetInputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <div className={fieldLabelClass}>
            Créditos
            <div className="flex h-12 items-center justify-between rounded-xl bg-[#F3F2EE] p-1">
              <button
                type="button"
                onClick={() => setCreditAmount((n) => Math.max(1, n - 1))}
                aria-label="Menos créditos"
                className="h-10 w-10 rounded-[10px] bg-white text-lg font-semibold"
              >
                −
              </button>
              <span className="text-[15px] font-bold tabular-nums">{creditAmount}</span>
              <button
                type="button"
                onClick={() => setCreditAmount((n) => Math.min(200, n + 1))}
                aria-label="Más créditos"
                className="h-10 w-10 rounded-[10px] bg-white text-lg font-semibold"
              >
                +
              </button>
            </div>
          </div>
          <label className={fieldLabelClass}>
            Precio
            <span className="flex h-12 items-center overflow-hidden rounded-xl border border-ink/[0.14] bg-white focus-within:border-brand-600">
              <span className="pl-3.5 pr-1 font-semibold text-ink-faint">$</span>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="1800"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-none focus-visible:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Vigencia desde la compra</span>
          <div className="flex flex-wrap gap-2">
            {validityOptions.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setValidityDays(days)}
                className={chipClass(validityDays === days)}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        <p className="rounded-2xl bg-brand-50 p-3.5 text-sm font-semibold text-brand-800">
          {creditAmount} {creditAmount === 1 ? "clase" : "clases"} por {formatMoney(priceValue)} ·{" "}
          {formatMoney(Math.round(priceValue / creditAmount))} por clase · vence en {validityDays} días
        </p>
      </form>
    </Modal>
  );
}

