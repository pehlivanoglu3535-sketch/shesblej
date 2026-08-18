/**
 * Downscale + re-encode an image in the browser before upload.
 *
 * Phone cameras produce 3-5 MB JPEGs; storing those raw burns through the
 * storage quota roughly ten times faster than needed and makes listing pages
 * slow to load on mobile connections. Listing photos are only ever displayed
 * at a few hundred pixels, so a long-edge cap plus JPEG re-encode is lossless
 * in practice for our use.
 *
 * Falls back to the original file if anything goes wrong — a slightly bigger
 * upload is much better than a failed one.
 */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  // Already small enough that re-encoding would mostly add artefacts.
  if (file.size <= 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
