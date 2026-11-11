/**
 * Card links are shown to every visitor, so only safe address types are
 * allowed. A link like "javascript:..." would run code on the site's own
 * address when a visitor clicks it.
 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

// Images and PDFs may be stored inline. SVG is not on the list because an SVG
// file can carry script.
const SAFE_DATA_URL = /^data:(image\/(png|jpeg|jpg|gif|webp|avif)|application\/pdf);base64,/i;

/**
 * Is this address safe to put in a link?
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeCardUrl(url) {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (SAFE_DATA_URL.test(value)) return true;
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * The address to store, or an empty string when it is not safe.
 * @param {string} url
 * @returns {string}
 */
export function sanitizeCardUrl(url) {
  return isSafeCardUrl(url) ? url.trim() : '';
}

/**
 * Clean the addresses that live inside the settings of a card.
 * @param {object} settings
 * @returns {object}
 */
export function sanitizeCardSettings(settings) {
  if (!settings || typeof settings !== 'object') return settings || {};

  const cleaned = { ...settings };
  for (const key of ['url', 'pdfUrl', 'image', 'thumbnailUrl']) {
    if (typeof cleaned[key] === 'string') {
      cleaned[key] = sanitizeCardUrl(cleaned[key]);
    }
  }
  if (Array.isArray(cleaned.images)) {
    cleaned.images = cleaned.images.map((item) => {
      if (typeof item === 'string') return sanitizeCardUrl(item);
      if (item && typeof item === 'object' && typeof item.url === 'string') {
        return { ...item, url: sanitizeCardUrl(item.url) };
      }
      return item;
    });
  }
  return cleaned;
}
