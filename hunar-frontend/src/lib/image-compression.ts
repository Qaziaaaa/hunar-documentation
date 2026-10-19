/**
 * Zero-dependency HTML5 Canvas Client-Side Image Compressor.
 * Downscales images to max dimensions and optimizes compression quality
 * to reduce 5MB-10MB mobile camera photos down to ~150KB-250KB before upload.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  fileOrBlob: File | Blob,
  options: CompressImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.8,
    mimeType = "image/jpeg",
  } = options;

  // If running in SSR or canvas is unavailable, return original file
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fileOrBlob;
  }

  // Non-image formats (e.g. PDF) don't need canvas compression
  if (fileOrBlob.type && !fileOrBlob.type.startsWith("image/")) {
    return fileOrBlob;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Calculate new dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(fileOrBlob);
        return;
      }

      // Draw and compress to blob
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < fileOrBlob.size) {
            resolve(blob);
          } else {
            // If compressed is somehow larger (rare), keep the original
            resolve(fileOrBlob);
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fileOrBlob);
    };

    img.src = objectUrl;
  });
}
