"use client";

import { useState } from "react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, Loader2, X } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";
import { Dropzone, DropzoneEmptyState } from "@/components/kibo/dropzone";

interface GalleryUploaderProps {
  tenantId: string;
  branchId: string;
  photoUrls: string[];
}

/** A multi-photo gallery manager: drag-and-drop (or tap) to add several photos at
 * once — each is downscaled and re-encoded in the browser before upload — plus a
 * grid to remove any of them. Writes straight to the branch's `photoUrls` array. */
export function GalleryUploader({ tenantId, branchId, photoUrls }: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const branchRef = doc(db, "tenants", tenantId, "branches", branchId);

  async function handleDrop(files: File[]) {
    setError(null);
    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { blob, contentType, extension } = await optimizeImage(file);
          const photoRef = ref(
            storage,
            `tenants/${tenantId}/branches/${branchId}/gallery-${crypto.randomUUID()}.${extension}`,
          );
          await uploadBytes(photoRef, blob, { contentType });
          return getDownloadURL(photoRef);
        }),
      );
      await updateDoc(branchRef, { photoUrls: arrayUnion(...uploadedUrls) });
    } catch {
      setError("No se pudieron subir una o más fotos. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url: string) {
    setRemovingUrl(url);
    try {
      await updateDoc(branchRef, { photoUrls: arrayRemove(url) });
    } finally {
      setRemovingUrl(null);
    }
  }

  return (
    <div>
      {photoUrls.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photoUrls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={removingUrl === url}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
              >
                {removingUrl === url ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <Dropzone
        accept={{ "image/*": [] }}
        maxFiles={10}
        disabled={uploading}
        onDrop={handleDrop}
        onError={() => setError("No se pudieron subir una o más fotos. Intenta de nuevo.")}
        className="min-h-0 p-6"
      >
        <DropzoneEmptyState>
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-ink-soft" strokeWidth={1.75} />
              <p className="mt-2 text-sm font-medium text-ink">Subiendo y optimizando...</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-ink-soft" strokeWidth={1.75} />
              <p className="mt-2 text-sm font-medium text-ink">Agregar fotos</p>
              <p className="mt-0.5 text-xs text-ink-soft">Arrastra o haz clic — puedes elegir varias a la vez</p>
            </>
          )}
        </DropzoneEmptyState>
      </Dropzone>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
