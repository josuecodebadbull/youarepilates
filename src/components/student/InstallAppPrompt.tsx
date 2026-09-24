"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "yap-install-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Instala la app" banner for the student PWA. Chrome/Android fire `beforeinstallprompt`,
 * which we hold until the user taps the button (browsers only allow the native prompt from
 * a click). iOS Safari has no such API, so there we show the manual Share → "Agregar a
 * inicio" steps instead. Landing links arrive with `?instalar=1`, which makes the banner
 * show even if it was dismissed before.
 */
export function InstallAppPrompt() {
  const searchParams = useSearchParams();
  const forced = searchParams.get("instalar") === "1";
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage can be blocked (private mode); just show the banner.
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      if (!dismissed || forced) setVisible(true);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) {
      setIos(true);
      if (!dismissed || forced) setVisible(true);
    } else if (forced) {
      // Desktop browsers without an install event still get a hint about the browser menu.
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [forced]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Not persisting the dismissal is harmless.
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: "var(--tenant-primary)" }}
        >
          <Download className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Instala la app en tu celular</p>
          <p className="mt-0.5 text-xs text-gray-600">
            Reserva más rápido y ábrela como cualquier otra app, sin pasar por la tienda.
          </p>

          {installEvent && (
            <button
              onClick={install}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--tenant-primary)" }}
            >
              Instalar app
            </button>
          )}

          {!installEvent && ios && (
            <>
              <button
                onClick={() => setShowIosSteps((v) => !v)}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--tenant-primary)" }}
              >
                {showIosSteps ? "Ocultar pasos" : "Cómo instalarla"}
              </button>
              {showIosSteps && (
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
                  <li>
                    Abre esta página en <strong>Safari</strong>.
                  </li>
                  <li>
                    Toca el botón <Share className="mx-0.5 inline h-4 w-4" /> <strong>Compartir</strong>.
                  </li>
                  <li>
                    Elige <strong>Agregar a inicio</strong> y confirma.
                  </li>
                </ol>
              )}
            </>
          )}

          {!installEvent && !ios && (
            <p className="mt-2 text-xs text-gray-600">
              En tu navegador, abre el menú (⋮) y elige <strong>Instalar app</strong> o{" "}
              <strong>Agregar a la pantalla de inicio</strong>.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="-mr-1 -mt-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
