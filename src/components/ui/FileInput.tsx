"use client";

import { useState, type ChangeEvent } from "react";

interface FileInputProps {
  id: string;
  accept?: string;
  onChange: (file: File | null) => void;
  buttonLabel?: string;
}

/**
 * A native `<input type="file">` renders its "Choose file / No file chosen" text with
 * an intrinsic width the browser controls, not CSS — inside a narrow flex/grid cell it
 * overflows the container (and the whole page, on mobile) instead of wrapping or
 * truncating. This hides the native input and drives the picker via a `<label>`
 * (the standard accessible way to trigger a hidden file input), rendering our own
 * button + truncated filename text instead.
 */
export function FileInput({ id, accept, onChange, buttonLabel = "Elegir archivo" }: FileInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onChange(file);
  }

  return (
    <div className="flex min-w-0 max-w-full items-center gap-3">
      <label
        htmlFor={id}
        className="shrink-0 cursor-pointer rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        {buttonLabel}
      </label>
      <input id={id} type="file" accept={accept} onChange={handleChange} className="sr-only" />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
        {fileName ?? "Ningún archivo seleccionado"}
      </span>
    </div>
  );
}
