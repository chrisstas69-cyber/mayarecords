"use client";

import Image from 'next/image';
import { useState } from 'react';

export function ArtistPortrait({ src, name, sizes, priority = false, className = '' }: {
  src: string | null;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src) return (
    <div className="flex h-full items-center justify-center" role="img" aria-label={`${name} — photo unavailable`}>
      <span className="display-md text-faint" aria-hidden="true">{name.charAt(0)}</span>
    </div>
  );
  return <Image src={src} alt={name} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} onError={() => setFailedSource(src)} />;
}
