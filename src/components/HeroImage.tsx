import { memo, useEffect, useState } from 'react';

type HeroImageProps = {
  src?: string;
  alt: string;
  imgClassName: string;
  placeholderClassName?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

function HeroImageComponent({
  src,
  alt,
  imgClassName,
  placeholderClassName = 'bg-gray-100',
  loading,
  fetchPriority,
}: HeroImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const showPlaceholder = !src || !loaded || failed;

  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-500 ${
          showPlaceholder ? 'opacity-100' : 'opacity-0'
        } ${placeholderClassName}`}
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
