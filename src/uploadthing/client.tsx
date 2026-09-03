import './uploadthing.css';
import { generateUploadDropzone } from '@uploadthing/react';
import type { ComponentProps } from 'react';
import type { AppFileRouter } from '../../server/uploadthing';
import { apiUrl } from '../lib/api';
import { compressImages } from '../lib/compress-images';

function uploadThingUrl(): string {
  const raw = import.meta.env.VITE_UPLOADTHING_URL as string | undefined;
  if (raw?.trim()) {
    return `${raw.replace(/\/$/, '')}/api/uploadthing`;
  }
  return apiUrl('/api/uploadthing');
}

const UploadThingDropzone = generateUploadDropzone<AppFileRouter>({
  url: uploadThingUrl(),
});

type ProjectImageDropzoneProps = ComponentProps<typeof UploadThingDropzone>;

/** CMS image dropzone — compresses images client-side before UploadThing upload. */
export function ProjectImageDropzone({
  onBeforeUploadBegin,
  ...props
}: ProjectImageDropzoneProps) {
  return (
    <UploadThingDropzone
      {...props}
      onBeforeUploadBegin={async (files) => {
        const compressed = await compressImages(files);
        if (!onBeforeUploadBegin) {
          return compressed;
        }
        return onBeforeUploadBegin(compressed);
      }}
    />
  );
}

