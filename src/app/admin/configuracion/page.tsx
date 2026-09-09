"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { Sparkles, TriangleAlert } from "lucide-react";

import { functions } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

const RESET_CONFIRM_WORD = "REINICIAR";

export default function ConfiguracionPage() {
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleGenerateDemo() {
    setGenerating(true);
    setGenerateMessage(null);
    setGenerateError(null);
    try {
      const generateDemoData = httpsCallable(functions, "generateDemoData");
      await generateDemoData();
      setGenerateMessage("Listo — se crearon 2 sedes, salas, tipos de clase, instructores, paquetes y 12 días de horarios.");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "No se pudieron generar los datos de prueba.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setResetMessage(null);
    setResetError(null);
    try {
      const resetTenantData = httpsCallable(functions, "resetTenantData");
      await resetTenantData();
      setResetMessage("Listo — todos los datos del estudio se borraron. Ya puedes empezar desde cero.");
      setConfirmText("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "No se pudo reiniciar el estudio.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Herramientas para probar la plataforma antes de lanzarla con alumnos reales."
      />

      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold text-ink">Crear datos de demostración</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Genera 2 sedes con salas, 4 tipos de clase, 3 instructores, 3 paquetes y
                12 días de horarios ya programados — para poder probar el flujo completo
                (reservar, comprar un paquete, etc.) sin capturar nada a mano primero.
                Puedes usarlo varias veces; cada vez agrega más datos, no reemplaza los
                que ya tienes.
              </p>

              {generateMessage && <p className="mt-3 text-sm text-brand-700">{generateMessage}</p>}
              {generateError && <p className="mt-3 text-sm text-red-600">{generateError}</p>}

              <Button onClick={handleGenerateDemo} disabled={generating} className="mt-4">
                {generating ? "Generando..." : "Generar datos de prueba"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-red-900">Reiniciar todo</h2>
              <p className="mt-1 text-sm text-red-800">
                Borra permanentemente todas las sedes, salas, tipos de clase,
                instructores, paquetes, horarios, reservas, lista de espera, créditos
                de alumnos y firmas de responsiva de tu estudio. No se puede deshacer.
                Las cuentas de tus alumnos y tu configuración de perfil/responsiva{" "}
                <span className="font-semibold">no</span> se borran.
              </p>

              {resetMessage && <p className="mt-3 text-sm text-red-900">{resetMessage}</p>}
              {resetError && <p className="mt-3 text-sm text-red-900">{resetError}</p>}

              <label htmlFor="reset-confirm" className="mt-4 block text-xs font-medium text-red-900">
                Escribe {RESET_CONFIRM_WORD} para confirmar
              </label>
              <input
                id="reset-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-ink focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 sm:w-64"
                placeholder={RESET_CONFIRM_WORD}
              />

              <div>
                <Button
                  onClick={handleReset}
                  disabled={resetting || confirmText !== RESET_CONFIRM_WORD}
                  className="mt-3 !bg-red-600 hover:!bg-red-700"
                >
                  {resetting ? "Reiniciando..." : "Reiniciar todo"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
