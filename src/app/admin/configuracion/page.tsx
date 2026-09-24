"use client";

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "@/lib/firebase/client";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { TenantDoc } from "@/lib/types/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/admin/Toast";
import { Stepper, cardClass } from "@/components/admin/ui";

const RESET_CONFIRM_WORD = "REINICIAR";

type Settings = TenantDoc["settings"];

const RULES: {
  key: keyof Settings;
  label: string;
  help: string;
  unit: string;
  min: number;
  max: number;
}[] = [
  {
    key: "cancelWindowHours",
    label: "Cancelación sin penalización",
    help: "Hasta cuántas horas antes pueden cancelar y recuperar su crédito.",
    unit: "h",
    min: 0,
    max: 72,
  },
  {
    key: "lateCancelPenaltyCredits",
    label: "Penalización por cancelar tarde",
    help: "Créditos que se descuentan si cancelan fuera de tiempo.",
    unit: "créd.",
    min: 0,
    max: 3,
  },
  {
    key: "minBasicClassesForAdvanced",
    label: "Clases básicas para Avanzado",
    help: "Clases básicas validadas antes de poder reservar nivel avanzado.",
    unit: "clases",
    min: 0,
    max: 30,
  },
];

export default function ConfiguracionPage() {
  const { tenantId, tenant } = useTenant();
  const toast = useToast();
  const [settings, setSettings] = useState<Settings>(tenant.settings);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // Steppers save on their own, debounced so tapping "+" five times is one write.
  function changeSetting(key: keyof Settings, value: number) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateDoc(doc(db, "tenants", tenantId), { settings: next });
      toast("Reglas guardadas");
    }, 600);
  }

  async function handleGenerateDemo() {
    setGenerating(true);
    setGenerateError(null);
    try {
      await httpsCallable(functions, "generateDemoData")();
      toast("Datos de prueba generados");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "No se pudieron generar los datos de prueba.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setResetError(null);
    try {
      await httpsCallable(functions, "resetTenantData")();
      setConfirmText("");
      toast("Estudio reiniciado");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "No se pudo reiniciar el estudio.");
    } finally {
      setResetting(false);
    }
  }

  const resetReady = confirmText.trim() === RESET_CONFIRM_WORD && !resetting;

  return (
    <div className="flex max-w-[760px] flex-col gap-[18px]">
      <PageHeader title="Configuración" description="Reglas de reserva y herramientas de prueba." />

      <section className={`-mt-6 flex flex-col gap-1 p-5 ${cardClass}`}>
        <h2 className="mb-2 text-xl font-semibold text-ink">Reglas de reservas</h2>
        {RULES.map((rule) => (
          <div key={rule.key} className="flex items-center justify-between gap-3.5 border-t border-ink/[0.06] py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{rule.label}</span>
              <span className="text-xs leading-[1.45] text-ink-soft">{rule.help}</span>
            </div>
            <Stepper
              label={rule.unit}
              valueClassName="min-w-14"
              value={`${settings[rule.key]} ${rule.unit}`}
              onDecrement={() => changeSetting(rule.key, Math.max(rule.min, settings[rule.key] - 1))}
              onIncrement={() => changeSetting(rule.key, Math.min(rule.max, settings[rule.key] + 1))}
            />
          </div>
        ))}
      </section>

      <section className={`flex flex-wrap items-center justify-between gap-3.5 p-5 ${cardClass}`}>
        <div className="flex flex-[1_1_300px] flex-col gap-1">
          <h2 className="text-xl font-semibold text-ink">Datos de demostración</h2>
          <p className="text-[13px] leading-normal text-ink-soft">
            Crea 2 sedes, 4 tipos de clase, 3 instructores, 3 paquetes y 12 días de horarios para probar el flujo
            completo. Se suman a lo que ya tienes.
          </p>
          {generateError && <p className="text-sm text-red-600">{generateError}</p>}
        </div>
        <button
          onClick={handleGenerateDemo}
          disabled={generating}
          className="h-11 rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-50"
        >
          {generating ? "Generando..." : "Generar datos"}
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] border border-[#F4C7C3] bg-[#FDF3F2] p-5">
        <h2 className="text-xl font-semibold text-[#7A1A12]">Reiniciar todo</h2>
        <p className="text-[13px] leading-[1.55] text-[#8F2A20]">
          Borra para siempre sedes, salas, tipos de clase, instructores, paquetes, horarios, reservas, lista de espera,
          créditos y firmas. No se borran las cuentas de tus alumnos ni tu perfil o responsiva.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Escribe ${RESET_CONFIRM_WORD}`}
            aria-label={`Escribe ${RESET_CONFIRM_WORD} para confirmar`}
            className="h-[46px] min-w-0 flex-[1_1_200px] rounded-xl border border-[#E8A39C] bg-white px-3.5 text-sm font-semibold tracking-[0.06em] text-ink placeholder:font-medium placeholder:tracking-normal focus:border-red-600 focus:outline-none"
          />
          <button
            onClick={handleReset}
            disabled={!resetReady}
            className={`h-[46px] shrink-0 rounded-xl px-[18px] text-sm font-semibold text-white ${
              resetReady ? "bg-[#B42318]" : "cursor-default bg-[#EFC9C4]"
            }`}
          >
            {resetting ? "Reiniciando..." : "Reiniciar todo"}
          </button>
        </div>
        {resetError && <p className="text-sm text-[#7A1A12]">{resetError}</p>}
      </section>
    </div>
  );
}
