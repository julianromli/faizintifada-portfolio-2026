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
