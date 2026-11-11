/**
 * Canonical URL utilities for IndiaTaps platform
 */
export function getCanonicalTreeUrl(slug) {
  if (!slug) return 'https://indiataps.vercel.app';
  const cleanSlug = String(slug).replace(/^@/, '').trim();
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    /^192\.168\./.test(window.location.hostname)
  );
  const host = isLocal ? 'indiataps.vercel.app' : (window?.location?.host || 'indiataps.vercel.app');
  return `https://${host}/${cleanSlug}`;
}

export function getCanonicalDisplayDomain() {
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    /^192\.168\./.test(window.location.hostname)
  );
  return isLocal ? 'indiataps.vercel.app' : (window?.location?.host || 'indiataps.vercel.app');
}
