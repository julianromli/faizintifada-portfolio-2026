import { generateUploadDropzone } from '@uploadthing/react';
import type { AppFileRouter } from '../../server/uploadthing';
import { apiUrl } from '../lib/api';

function uploadThingUrl(): string {
  const raw = import.meta.env.VITE_UPLOADTHING_URL as string | undefined;
  if (raw?.trim()) {
    return `${raw.replace(/\/$/, '')}/api/uploadthing`;
  }
  return apiUrl('/api/uploadthing');
}

export const ProjectImageDropzone = generateUploadDropzone<AppFileRouter>({
  url: uploadThingUrl(),
});

export { uploadThingUrl };
