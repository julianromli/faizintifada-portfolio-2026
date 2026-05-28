import type { CSSProperties } from 'react';

type SkeletonVariant = 'block' | 'text' | 'circle';

type SkeletonProps = {
  className?: string;
  variant?: SkeletonVariant;
  muted?: boolean;
  style?: CSSProperties;
};

const variantClasses: Record<SkeletonVariant, string> = {
  block: '',
  text: 'h-4 rounded',
  circle: 'rounded-full',
};

export function Skeleton({
  className = '',
  variant = 'block',
  muted = false,
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={[
        'skeleton skeleton-shimmer',
        muted ? 'skeleton-muted' : '',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    />
  );
}
