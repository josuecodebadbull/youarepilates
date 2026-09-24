"use client";

import { useState, type ReactNode } from "react";
import { Download, Share } from "lucide-react";

import { useInstallPrompt } from "@/components/pwa/useInstallPrompt";
import { Modal } from "@/components/ui/Modal";

/**
 * "Descargar app" for the studio-owner panel (the PWA installed from the landing).
 * With a native prompt available it installs in one click; otherwise it opens a short
 * how-to for the browser the visitor is on. Hidden once the app is already installed.
 */
export function InstallAdminButton({
  className,
  children = "Descargar app",
  showIcon = true,
}: {
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
}) {
  const { installed, canPrompt, ios, install } = useInstallPrompt();
  const [helpOpen, setHelpOpen] = useState(false);

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => (canPrompt ? void install() : setHelpOpen(true))}
      >
        {showIcon && <Download className="h-4 w-4" strokeWidth={2} />}
        {children}
      </button>

      {helpOpen && (
        <Modal title="Instala el panel en tu dispositivo" onClose={() => setHelpOpen(false)}>
          <p className="text-sm text-ink-soft">
            Ábrelo como una app más, con su propio ícono y sin la barra del navegador.
          </p>
          {ios ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>
                Abre esta página en <strong>Safari</strong>.
              </li>
              <li>
                Toca <Share className="mx-0.5 inline h-4 w-4" /> <strong>Compartir</strong>.
              </li>
              <li>
                Elige <strong>Agregar a inicio</strong> y confirma.
              </li>
            </ol>
          ) : (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>
                Abre esta página en <strong>Chrome</strong> o <strong>Edge</strong>.
              </li>
              <li>
                En el celular: menú <strong>⋮</strong> → <strong>Instalar app</strong> o{" "}
                <strong>Agregar a la pantalla de inicio</strong>.
              </li>
              <li>
                En computadora: el ícono de instalar al final de la barra de direcciones.
              </li>
            </ol>
          )}
        </Modal>
      )}
    </>
  );
}
