/**
 * Canonical URL utilities for IndiaTaps platform
 */

// Only these address types may be used in a card link. Anything else, for
// example "javascript:...", would run code on this site's own address when a
// visitor clicks it.
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const SAFE_DATA_URL = /^data:(image\/(png|jpeg|jpg|gif|webp|avif)|application\/pdf);base64,/i;

/**
 * The address to put in an href. Returns null when the address is not safe,
 * so the card is shown without a link.
 * @param {string} url
 * @returns {string|null}
 */
export function safeHref(url) {
  if (typeof url !== 'string') return null;
  const value = url.trim();
  if (!value) return null;
  if (SAFE_DATA_URL.test(value)) return value;
  try {
    const protocol = new URL(value, window.location.origin).protocol.toLowerCase();
    if (!SAFE_PROTOCOLS.includes(protocol)) return null;
    return value;
  } catch {
    return null;
  }
}

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

export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern Async Clipboard API if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Reliable fallback using textarea + execCommand for HTTP / LAN IPs (e.g. 192.168.x.x)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
