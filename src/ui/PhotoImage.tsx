import { usePhotoUrl } from '@/data/hooks';
import type { ReactNode } from 'react';

export function PhotoImage({
  photoId,
  variant = 'thumb',
  alt,
  className = '',
  fallback,
}: {
  photoId: string | undefined;
  variant?: 'thumb' | 'full';
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const url = usePhotoUrl(photoId, variant);
  if (!url) return <>{fallback ?? <div className={`bg-ink-700 ${className}`} />}</>;
  return <img src={url} alt={alt} className={className} draggable={false} />;
}
