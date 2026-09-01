import { memo, useEffect, useRef, useState } from 'react';
import { Skeleton } from './Skeleton';

const DEFAULT_HERO_ASPECT_RATIO = 1.91;

/** Browser may finish loading (cache) before React runs effects — read `complete` after reset. */
function syncLoadedFromImg(
  img: HTMLImageElement | null,
  onReady: (img: HTMLImageElement) => void,
  setFailed: (failed: boolean) => void,
) {
  if (!img?.complete) return;
  if (img.naturalWidth > 0) {
    onReady(img);
  } else {
    setFailed(true);
  }
}

function aspectRatioFromImg(img: HTMLImageElement): number | null {
  if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return null;
  return img.naturalWidth / img.naturalHeight;
}

type HeroImageProps = {
  src?: string;
  alt: string;
  /** Outer frame classes (rounding, animation delays, etc.). */
  className?: string;
  imgClassName?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Used while dimensions are unknown (settings/image still loading). */
  fallbackAspectRatio?: number;
  /** Stretch to fill a flex/grid parent height instead of using aspect-ratio. */
  fill?: boolean;
};

function HeroImageComponent({
  src,
  alt,
  className = '',
  imgClassName = 'absolute inset-0 w-full h-full object-cover object-center',
  loading,
  fetchPriority,
  fallbackAspectRatio = DEFAULT_HERO_ASPECT_RATIO,
  fill = false,
}: HeroImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setAspectRatio(fallbackAspectRatio);
    syncLoadedFromImg(
      imgRef.current,
      (img) => {
        const next = aspectRatioFromImg(img);
        if (next != null) setAspectRatio(next);
        setLoaded(true);
      },
      setFailed,
    );
  }, [src, fallbackAspectRatio]);

  const showSkeleton = !src || !loaded || failed;

  return (
    <div
      className={`relative w-full overflow-hidden bg-surface-nested ${fill ? 'h-full' : ''} ${className}`}
      style={fill ? undefined : { aspectRatio }}
    >
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
          onLoad={(event) => {
            const img = event.currentTarget;
            const next = aspectRatioFromImg(img);
            if (next != null) setAspectRatio(next);
            setLoaded(true);
          }}
          onError={() => setFailed(true)}
          className={`${imgClassName} transition-[opacity,filter,transform] duration-700 ease-out ${
            loaded && !failed ? 'opacity-100 blur-0' : 'opacity-0 blur-xl scale-105'
          }`}
        />
      ) : null}
    </div>
  );
}

export const HeroImage = memo(HeroImageComponent);
