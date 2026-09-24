"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * "dialog": centered card (landing, student app).
 * "sheet": bottom sheet on phones/tablets and a right-side panel on desktop — the admin
 * panel provides this through `ModalStyleProvider` so every admin modal gets it.
 */
type ModalStyle = "dialog" | "sheet";

const ModalStyleContext = createContext<ModalStyle>("dialog");

export function ModalStyleProvider({ value, children }: { value: ModalStyle; children: ReactNode }) {
  return <ModalStyleContext.Provider value={value}>{children}</ModalStyleContext.Provider>;
}

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky action bar at the bottom of the sheet. */
  footer?: ReactNode;
}

export function Modal({ title, subtitle, onClose, children, footer }: ModalProps) {
  const style = useContext(ModalStyleContext);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (style === "sheet") {
    return (
      <div className="fixed inset-0 z-50">
        <div onClick={onClose} className="absolute inset-0 bg-ink/40" aria-hidden />
        <div
          role="dialog"
          aria-modal
          aria-label={title}
          className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-3xl bg-white shadow-[0_-20px_50px_-20px_rgba(22,24,29,0.3)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[460px] lg:rounded-none lg:shadow-[-20px_0_50px_-20px_rgba(22,24,29,0.3)]"
        >
          <div className="flex justify-center pb-0.5 pt-2.5 lg:hidden" aria-hidden>
            <span className="h-[5px] w-10 rounded-full bg-[#DAD8D2]" />
          </div>
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-3.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-[22px] font-semibold leading-tight text-ink">{title}</h2>
              {subtitle && <p className="truncate text-[13px] text-ink-soft">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F2EE] text-ink hover:bg-[#EAE8E3]"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">{children}</div>
          {footer && (
            <div className="flex shrink-0 gap-2 border-t border-ink/[0.08] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div onClick={onClose} className="absolute inset-0" aria-hidden />
      <div className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{title}</h2>
            {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex shrink-0 gap-2 border-t border-gray-200 p-4">{footer}</div>}
      </div>
    </div>
  );
}
