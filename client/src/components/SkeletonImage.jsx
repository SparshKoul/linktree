import React, { useState } from 'react';

/**
 * A picture that shows a neutral skeleton while it loads.
 *
 * Without this the coloured box behind the picture shows through until the
 * file is decoded, which reads as a red flash on a page that is loading.
 */
export function SkeletonImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  fallback = null,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src) return fallback;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-black/10" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        className={`${imgClassName || 'w-full h-full object-cover'} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
