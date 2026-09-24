"use client";

import { useState } from "react";

import { PilatesBedIcon } from "@/components/ui/PilatesBedIcon";
import {
  AdminDesktopMock,
  AdminPhoneMock,
  PhoneFrame,
  ScaledFrame,
  StudentStudioMock,
  type AdminPhoneScreen,
} from "@/components/marketing/Mockups";

/** Dark stage under the hero: browser with the panel + phone with the student app. */
export function HeroStage() {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-brand-900 px-4 pb-[22px] pt-7 md:px-[30px] md:pb-0 md:pt-9 lg:rounded-[36px] lg:px-[60px] lg:pt-14">
      {/* Tablet / desktop */}
      <div className="relative hidden md:block">
        <div className="mx-auto max-w-[1040px] overflow-hidden rounded-t-2xl bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div className="flex h-10 items-center gap-3.5 border-b border-ink/[0.08] bg-[#F3F2EE] px-3.5">
            <div className="flex gap-[7px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-[11px] w-[11px] rounded-full bg-[#E0DED8]" />
              ))}
            </div>
            <span className="mx-auto flex h-[26px] w-full max-w-[360px] items-center justify-center rounded-lg bg-white text-xs text-ink-soft">
              youarepilates.app/admin
            </span>
          </div>
          <ScaledFrame width={1280} height={800}>
            <AdminDesktopMock />
          </ScaledFrame>
        </div>
        <div className="absolute -bottom-[84px] right-[-18px] w-[187px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)] lg:-bottom-[110px] lg:right-[-32px] lg:w-[242px]">
          <ScaledFrame width={390} height={800}>
            <PhoneFrame>
              <StudentStudioMock />
            </PhoneFrame>
          </ScaledFrame>
        </div>
      </div>

      {/* Phones */}
      <div className="md:hidden">
        <div className="flex justify-center gap-3">
          <ScaledFrame width={390} height={800} className="w-1/2 max-w-[187px]">
            <PhoneFrame>
              <AdminPhoneMock />
            </PhoneFrame>
          </ScaledFrame>
          <ScaledFrame width={390} height={800} className="w-1/2 max-w-[187px]">
            <PhoneFrame>
              <StudentStudioMock />
            </PhoneFrame>
          </ScaledFrame>
        </div>
        <div className="mt-3.5 flex justify-center gap-3 text-center text-xs font-semibold text-brand-200">
          <span className="w-1/2 max-w-[187px]">Tu panel</span>
          <span className="w-1/2 max-w-[187px]">App de tus alumnos</span>
        </div>
      </div>
    </div>
  );
}

const TAKEN = new Set([1, 2, 5, 7, 8, 9]);

/** "Cero sobreventa" demo: tap a free bed to take it. */
export function BedPicker() {
  const [bed, setBed] = useState(4);
  return (
    <div className="mt-auto flex flex-col gap-3.5">
      <span className="self-center text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-300">Frente · espejo</span>
      {[
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
      ].map((row, i) => (
        <div key={i} className="flex flex-wrap justify-center gap-2.5">
          {row.map((n) => {
            const taken = TAKEN.has(n);
            const mine = bed === n;
            return (
              <button
                key={n}
                type="button"
                disabled={taken}
                onClick={() => setBed(n)}
                aria-label={taken ? `Cama ${n} ocupada` : mine ? `Cama ${n}, tu lugar` : `Elegir cama ${n}`}
                aria-pressed={mine}
                className={`relative flex h-[66px] w-[50px] items-center justify-center rounded-[14px] transition-colors ${
                  mine
                    ? "bg-brand-400 text-[#0F2E28]"
                    : taken
                      ? "cursor-not-allowed bg-white/[0.06] text-white/30"
                      : "bg-white/[0.12] text-brand-200 hover:bg-white/20"
                }`}
              >
                <PilatesBedIcon className="h-[50px] w-[30px]" filled />
                <span
                  className={`absolute font-bold ${mine ? "text-[11px] text-[#0F2E28]" : taken ? "text-xs text-white/35" : "text-xs text-white"}`}
                >
                  {mine ? "Tú" : n}
                </span>
              </button>
            );
          })}
        </div>
      ))}
      <span className="self-center text-[13px] text-white/70" aria-live="polite">
        Cama {bed} reservada · toca otra libre
      </span>
    </div>
  );
}

const OWNER_STEPS: [string, string, AdminPhoneScreen][] = [
  ["Crea tu estudio", "Regístrate con tu correo y en menos de un minuto tienes tu panel y el link único de reservas de tu estudio.", "resumen"],
  ["Arma tu catálogo", "Sedes y salas con el número exacto de camas, tipos de clase, instructores y paquetes de créditos.", "sedes"],
  ["Programa tus horarios", "Calendario por semana o por día. El sistema no te deja encimar dos clases en la misma sala.", "horarios"],
  ["Personaliza tu presencia", "Logo, fotos, descripción, redes, políticas y tu carta responsiva, todo con tu marca.", "perfil"],
  ["Comparte tu link", "Cópialo desde el panel y mándalo por WhatsApp. Tus alumnos instalan la app sin tiendas.", "resumen"],
  ["Opera el día a día", "Alumnos y sus créditos, pagos por confirmar y el resumen de tu estudio en vivo.", "pagos"],
];

const STUDENT_STEPS: [string, string][] = [
  ["Entran a tu link", "Crean su cuenta y pueden instalar la app directo en su celular como cualquier otra."],
  ["Exploran el horario", "Ven las clases disponibles por semana o mes y filtran por nivel o instructor."],
  ["Reservan su lugar", "Eligen su cama o dejan que se asigne sola. Si está llena, entran a la lista de espera."],
  ["Firman una vez", "Firman tu carta responsiva desde su perfil, con registro de nombre, versión y fecha."],
  ["Compran sus créditos", "Ven tus paquetes en Precios y piden el suyo; tú confirmas el pago y sus créditos se activan."],
  ["Todo en su perfil", "Próxima clase, historial, créditos vigentes y cómo llegar a tu estudio, con mapa."],
];

export function HowItWorks() {
  const [tab, setTab] = useState<"owner" | "student">("owner");
  const [step, setStep] = useState(0);
  const steps = tab === "owner" ? OWNER_STEPS : STUDENT_STEPS;
  const ownerScreen = OWNER_STEPS[step]?.[2] ?? "resumen";

  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-brand-700">Cómo funciona</span>
          <h2 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink [text-wrap:balance] md:text-[42px] lg:text-[52px]">
            Dos apps listas desde el día uno.
          </h2>
          <p className="max-w-[520px] text-base leading-normal text-ink-soft">
            Tu panel de administración y la app con la que tus alumnos reservan. Sin programadores ni configuraciones
            raras.
          </p>
        </div>
        <div className="flex self-start rounded-full bg-[#EDEBE6] p-1" role="tablist">
          {(
            [
              ["owner", "Tú, como dueño(a)"],
              ["student", "Tus alumnos"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setStep(0);
              }}
              className={`h-[42px] whitespace-nowrap rounded-full px-[18px] text-sm font-semibold ${
                tab === key ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ol className="flex flex-col">
          {steps.map(([title, desc], i) => {
            const open = step === i;
            return (
              <li key={title}>
                <button
                  onClick={() => setStep(i)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-4 border-t border-ink/[0.08] py-4 text-left text-ink"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold transition-colors ${
                      open ? (tab === "owner" ? "bg-brand-700 text-white" : "bg-ink text-white") : "bg-[#EDEBE6] text-ink-soft"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base font-bold">{title}</span>
                    {open && <span className="text-sm leading-normal text-ink-soft [text-wrap:pretty]">{desc}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-col items-center gap-3.5 rounded-[32px] bg-brand-50 px-0 py-6 md:p-8">
        <div className="w-[min(304px,calc(100vw-80px))] drop-shadow-[0_24px_30px_rgba(18,58,51,0.25)] md:w-[257px] lg:w-[304px]">
          <ScaledFrame width={390} height={800}>
            <PhoneFrame>{tab === "owner" ? <AdminPhoneMock screen={ownerScreen} /> : <StudentStudioMock />}</PhoneFrame>
          </ScaledFrame>
        </div>
        <span className="px-4 text-center text-[13px] text-ink-soft">
          {tab === "owner" ? "Tu panel · así se ve en tu celular" : "La app de tu estudio · así la ven tus alumnos"}
        </span>
      </div>
    </div>
  );
}
