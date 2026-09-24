"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

const ToastContext = createContext<(message: string) => void>(() => {});

/** Brief confirmation after an action ("Pago confirmado", "Clase programada"). */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((next: string) => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-10px_rgba(22,24,29,0.5)] lg:bottom-7"
        >
          <Check className="h-[18px] w-[18px] shrink-0 text-brand-300" strokeWidth={2.2} />
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
