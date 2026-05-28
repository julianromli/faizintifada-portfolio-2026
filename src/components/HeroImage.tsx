import { memo, useEffect, useState } from 'react';
import { Skeleton } from './Skeleton';

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

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
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
