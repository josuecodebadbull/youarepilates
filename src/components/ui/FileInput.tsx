"use client";

import { useState } from "react";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/kibo/dropzone";

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
 * truncating. This wraps kibo-ui's Dropzone instead, for real drag-and-drop plus a
 * layout that's ours to control.
 */
export function FileInput({ id, accept, onChange, buttonLabel = "Elegir archivo" }: FileInputProps) {
  const [file, setFile] = useState<File | null>(null);

  function handleDrop(acceptedFiles: File[]) {
    const nextFile = acceptedFiles[0] ?? null;
    setFile(nextFile);
    onChange(nextFile);
  }

  return (
    <Dropzone
      id={id}
      accept={accept ? { [accept]: [] } : undefined}
      src={file ? [file] : undefined}
      onDrop={handleDrop}
      className="min-h-0 p-4"
    >
      <DropzoneEmptyState>
        <p className="text-sm font-medium text-ink">{buttonLabel}</p>
        <p className="mt-0.5 text-xs text-ink-soft">Arrastra o haz clic para subir</p>
      </DropzoneEmptyState>
      <DropzoneContent />
    </Dropzone>
  );
}
