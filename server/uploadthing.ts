import { createUploadthing, UploadThingError } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/types';
import { CMS_UPLOAD_TOKEN_HEADER } from '../src/lib/cms-auth-headers.js';
import { normalizeCmsAdminSecret, tokenFromAuthorizationHeader } from '../src/lib/normalize-cms-admin-secret.js';

const f = createUploadthing();

function assertCmsAuth(req: Request) {
  const expected = normalizeCmsAdminSecret(process.env.CMS_ADMIN_TOKEN);
  if (!expected) {
    throw new UploadThingError({
      code: 'BAD_REQUEST',
      message: 'Server CMS token is not configured',
    });
  }
  const fromBearer = normalizeCmsAdminSecret(
    tokenFromAuthorizationHeader(req.headers.get('authorization')),
  );
  const fromHeader = normalizeCmsAdminSecret(req.headers.get(CMS_UPLOAD_TOKEN_HEADER));
  const provided = fromBearer || fromHeader;
  if (provided !== expected) {
    throw new UploadThingError({
      code: 'FORBIDDEN',
      message:
        'CMS auth failed: log in again at /admin with the same value as CMS_ADMIN_TOKEN, or restart the API after changing .env.',
    });
  }
}

export const uploadRouter = {
  pageImage: f(
    {
      image: { maxFileSize: '16MB', maxFileCount: 1 },
    },
    { awaitServerData: false },
  )
    .middleware(({ req }) => {
      assertCmsAuth(req);
      return {};
    })
    .onUploadComplete(() => {
      /** URLs are returned to the client via UploadThing; settings save happens in the CMS form */
    }),

  projectCover: f(
    {
      image: { maxFileSize: '16MB', maxFileCount: 1 },
    },
    { awaitServerData: false },
  )
    .middleware(({ req }) => {
      assertCmsAuth(req);
      return {};
    })
    .onUploadComplete(() => {
      /** URLs are returned to the client via UploadThing; no DB sync here */
    }),

  projectGallery: f(
    {
      image: { maxFileSize: '16MB', maxFileCount: 10 },
    },
    { awaitServerData: false },
  )
    .middleware(({ req }) => {
      assertCmsAuth(req);
      return {};
    })
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
