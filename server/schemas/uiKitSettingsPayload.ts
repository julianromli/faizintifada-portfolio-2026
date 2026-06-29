import { z } from 'zod';

function isHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Root-relative public asset path, e.g. `/ui-kit/ui-kit-1.webp`. Excludes protocol-relative `//host`. */
function isRootRelativePath(raw: string): boolean {
  return raw.startsWith('/') && !raw.startsWith('//') && !raw.includes(' ');
}

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, 'URL is required')
  .refine(isHttpUrl, 'Use a valid http(s) URL');

/** Accepts an empty string (clears the field) or a valid http(s) URL. */
const optionalHttpUrlSchema = z
  .string()
  .trim()
  .refine((val) => val === '' || isHttpUrl(val), 'Use a valid http(s) URL or leave empty');

/** Screenshots may be http(s) URLs (UploadThing/CDN) or root-relative public assets (/ui-kit/*.webp). */
const screenshotUrlSchema = z
  .string()
  .trim()
  .min(1, 'Screenshot URL is required')
  .refine(
    (val) => isHttpUrl(val) || isRootRelativePath(val),
    'Use a valid http(s) URL or root-relative path like /ui-kit/x.webp',
  );

const screenshotsSchema = z
  .array(screenshotUrlSchema)
  .min(1, 'At least one screenshot is required')
  .max(12, 'Up to 12 screenshots supported');

export const uiKitSettingsPayloadSchema = z.object({
  screenshots: screenshotsSchema,
  previewVideoUrl: httpUrlSchema,
  featuresVideoUrl: optionalHttpUrlSchema,
  installVideoUrl: optionalHttpUrlSchema,
});

export type UiKitSettingsPayload = z.infer<typeof uiKitSettingsPayloadSchema>;
