import imageCompression from 'browser-image-compression';

/**
 * Client-side image compression run before UploadThing sends files. Photos from
 * phones/cameras are often 4–8MB; this resizes to a sensible max dimension and
 * targets a smaller size so uploads and page loads stay fast. Runs entirely in
 * the browser — the raw file never touches our server.
 *
 * If compression fails (e.g. an unsupported type), the original file is kept so
 * the upload still succeeds.
 */
export interface CompressImagesOptions {
  /** Longest edge in pixels. Default 1600. */
  maxWidthOrHeight?: number;
  /** Target size in MB. Default 1. */
  maxSizeMB?: number;
}

/** Hero testimonial thumbs are size-10 (40px); 96px covers ~2.4× retina + scale-110. */
const TESTIMONIAL_AVATAR_MAX_EDGE = 96;
/** Soft ceiling; 96px AVIF/WebP is typically a few KB. */
const TESTIMONIAL_AVATAR_MAX_MB = 0.05;
const TESTIMONIAL_AVATAR_AVIF_QUALITY = 0.6;
const TESTIMONIAL_AVATAR_WEBP_QUALITY = 0.75;

export async function compressImages(
  files: File[],
  options?: CompressImagesOptions,
): Promise<File[]> {
  const maxWidthOrHeight = options?.maxWidthOrHeight ?? 1600;
  const maxSizeMB = options?.maxSizeMB ?? 1;

  return Promise.all(
    files.map(async (file) => {
      if (!file.type.startsWith('image/')) {
        return file;
      }
      try {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight,
          maxSizeMB,
          useWebWorker: true,
          // Keep the original file name so the uploaded URL stays readable.
          fileType: file.type,
        });
        // If compression somehow produced a larger file, keep the original.
        return compressed.size < file.size ? compressed : file;
      } catch {
        return file;
      }
    }),
  );
}

function stemFromFileName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').trim();
  return stem || 'avatar';
}

function asNamedFile(blob: Blob, fileName: string, mime: string): File {
  return new File([blob], fileName, { type: mime, lastModified: Date.now() });
}

/**
 * Resize + convert testimonial avatars before UploadThing.
 * Prefers AVIF; falls back to WebP when the browser cannot encode AVIF.
 */
export async function compressTestimonialAvatars(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressTestimonialAvatar));
}

async function compressTestimonialAvatar(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const stem = stemFromFileName(file.name);

  try {
    const avif = await imageCompression(file, {
      maxWidthOrHeight: TESTIMONIAL_AVATAR_MAX_EDGE,
      maxSizeMB: TESTIMONIAL_AVATAR_MAX_MB,
      useWebWorker: true,
      fileType: 'image/avif',
      initialQuality: TESTIMONIAL_AVATAR_AVIF_QUALITY,
    });
    if (avif.type === 'image/avif') {
      return asNamedFile(avif, `${stem}.avif`, 'image/avif');
    }
  } catch {
    // Encode unsupported or compression failed — try WebP next.
  }

  try {
    const webp = await imageCompression(file, {
      maxWidthOrHeight: TESTIMONIAL_AVATAR_MAX_EDGE,
      maxSizeMB: TESTIMONIAL_AVATAR_MAX_MB,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: TESTIMONIAL_AVATAR_WEBP_QUALITY,
    });
    if (webp.type === 'image/webp') {
      return asNamedFile(webp, `${stem}.webp`, 'image/webp');
    }
  } catch {
    // Keep original so the upload still succeeds.
  }

  return file;
}
