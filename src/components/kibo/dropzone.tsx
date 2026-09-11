"use client";

import { UploadIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/kibo/ui/button";
import { cn } from "@/lib/utils";

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  id?: string;
  src?: File[];
  className?: string;
  onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
  onError?: (error: Error) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  id,
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  children,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const message = fileRejections.at(0)?.errors.at(0)?.message ?? "Archivo rechazado";
        onError?.(new Error(message));
        return;
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });

  return (
    <DropzoneContext.Provider key={JSON.stringify(src)} value={{ src, accept, maxSize, minSize, maxFiles }}>
      <Button
        id={id}
        className={cn("relative h-auto w-full flex-col overflow-hidden p-8", isDragActive && "ring-2 ring-ring", className)}
        disabled={disabled}
        type="button"
        variant="outline"
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);
  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }
  return context;
};

export type DropzoneContentProps = {
  children?: ReactNode;
  className?: string;
};

export const DropzoneContent = ({ children, className }: DropzoneContentProps) => {
  const { src } = useDropzoneContext();

  if (!src) return null;
  if (children) return children;

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full truncate font-medium text-sm">
        {src.length > 1 ? `${src.length} archivos seleccionados` : src[0]?.name}
      </p>
      <p className="w-full text-wrap text-muted-foreground text-xs">Arrastra o haz clic para reemplazar</p>
    </div>
  );
};

export type DropzoneEmptyStateProps = {
  children?: ReactNode;
  className?: string;
};

export const DropzoneEmptyState = ({ children, className }: DropzoneEmptyStateProps) => {
  const { src, maxFiles } = useDropzoneContext();

  if (src) return null;
  if (children) return children;

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full truncate text-wrap font-medium text-sm">
        Sube {maxFiles === 1 ? "un archivo" : "archivos"}
      </p>
      <p className="w-full truncate text-wrap text-muted-foreground text-xs">Arrastra o haz clic para subir</p>
    </div>
  );
};
