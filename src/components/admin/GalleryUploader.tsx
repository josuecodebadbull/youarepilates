"use client";

import { useRef, useState } from "react";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Loader2, Plus, X } from "lucide-react";

import { db, storage } from "@/lib/firebase/client";
import { optimizeImage } from "@/lib/optimizeImage";

interface GalleryUploaderProps {
  tenantId: string;
  branchId: string;
  photoUrls: string[];
}

/** A multi-photo gallery manager: a grid of the branch's photos (the first one is the
 * cover) plus a "+ Foto" tile to add several at once — each is downscaled and
 * re-encoded in the browser before upload. Writes straight to the branch's `photoUrls`. */
export function GalleryUploader({ tenantId, branchId, photoUrls }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const branchRef = doc(db, "tenants", tenantId, "branches", branchId);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.slice(0, 10).map(async (file) => {
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
      if (inputRef.current) inputRef.current.value = "";
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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {photoUrls.map((url, index) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/75 px-[7px] py-0.5 text-[10px] font-bold text-white">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={removingUrl === url}
              aria-label="Quitar foto"
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white opacity-100 transition-opacity disabled:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              {removingUrl === url ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-ink/[0.18] bg-canvas text-xs font-semibold text-ink-soft hover:border-ink/30 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={2} />
              Subiendo…
            </>
          ) : (
            <>
              <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
              Foto
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
