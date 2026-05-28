import { memo, useEffect, useRef, useState } from 'react';
import { Skeleton } from './Skeleton';

/** Browser may finish loading (cache) before React runs effects — read `complete` after reset. */
function syncLoadedFromImg(
  img: HTMLImageElement | null,
  setLoaded: (loaded: boolean) => void,
  setFailed: (failed: boolean) => void,
) {
  if (!img?.complete) return;
  if (img.naturalWidth > 0) {
    setLoaded(true);
  } else {
    setFailed(true);
  }
}

type HeroImageProps = {
  src?: string;
  alt: string;
  imgClassName: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export function HeroImageSkeleton() {
  return <Skeleton className="absolute inset-0" />;
}

function HeroImageComponent({
  src,
  alt,
  imgClassName,
  loading,
  fetchPriority,
}: HeroImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    syncLoadedFromImg(imgRef.current, setLoaded, setFailed);
  }, [src]);

  const showSkeleton = !src || !loaded || failed;

  return (
    <>
      <Skeleton
        className={`absolute inset-0 transition-opacity duration-500 ${
          showSkeleton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      {src ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${imgClassName} transition-[opacity,filter,transform] duration-700 ease-out ${
            loaded && !failed ? 'opacity-100 blur-0' : 'opacity-0 blur-xl scale-105'
          }`}
        />
      ) : null}
    </>
  );
}

export const HeroImage = memo(HeroImageComponent);
