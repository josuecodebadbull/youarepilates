/**
 * Studio owners upload photos straight from a phone camera — often 4000px+ and
 * several MB each. Downscaling and re-encoding in the browser before upload keeps
 * Storage costs down and makes the student app's gallery load fast on mobile data,
 * without needing a server-side image pipeline.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.82;

interface OptimizedImage {
  blob: Blob;
  contentType: string;
  extension: string;
}

function supportsWebpEncoding(canvas: HTMLCanvasElement): boolean {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

export async function optimizeImage(file: File, maxDimension = MAX_DIMENSION): Promise<OptimizedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen en este navegador.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const useWebp = supportsWebpEncoding(canvas);
  const contentType = useWebp ? "image/webp" : "image/jpeg";
  const extension = useWebp ? "webp" : "jpg";
  const quality = useWebp ? WEBP_QUALITY : JPEG_QUALITY;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, contentType, quality));
  if (!blob) throw new Error("No se pudo procesar la imagen en este navegador.");

  return { blob, contentType, extension };
}
