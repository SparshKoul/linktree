/**
 * The patterns that can be used as a background.
 *
 * The grid, camo and checker patterns are small and are always here. The
 * organic one is 156 kilobytes of path data, so it is only fetched when
 * somebody actually picks it.
 */

// The grid is small enough to keep here.
const GRID_PATTERN_PATH =
  'M21 19.5H39.5V0H41V19.5H59.5V0H61V19.5H80V21H61V39.5H80V41H61V59.5H80V61H61V80H59.5V61H41V80H39.5V61H21V80H19.5V61H0V59.5H19.5V41H0V39.5H19.5V21H0V19.5H19.5V0H21V19.5ZM21 59.5H39.5V41H21V59.5ZM41 59.5H59.5V41H41V59.5ZM21 39.5H39.5V21H21V39.5ZM41 39.5H59.5V21H41V39.5Z';

let organicPath = null;
let organicLoading = null;

export const isColorLight = (hexColor = '#FFFFFF') => {
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) return true;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) || 0;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 165;
};

export const getContrastingPatternColor = (bgColor = '#FFFFFF') => {
  return isColorLight(bgColor) ? '#000000' : '#FFFFFF';
};

/**
 * Fetch the big organic pattern. It is not needed by most pages.
 * @returns {Promise<void>}
 */
export function loadOrganicPattern() {
  if (organicPath) return Promise.resolve();
  if (!organicLoading) {
    organicLoading = import('./organicPattern.js').then((module) => {
      organicPath = module.ORGANIC_PATTERN_PATH;
    });
  }
  return organicLoading;
}

/**
 * The pattern as a background image.
 * @param {string} patternId
 * @param {string} color
 * @param {number} [opacity]
 * @returns {string}
 */
export const getPatternSvg = (patternId = 'organic', color = '#050F15', opacity) => {
  const isLight = isColorLight(color);
  const finalOpacity = typeof opacity === 'number' ? opacity : isLight ? 0.35 : 0.28;

  if (patternId === 'grid') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" fill-opacity="${finalOpacity}" d="${GRID_PATTERN_PATH}"/></svg>`
    )}`;
  }
  if (patternId === 'camo') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M10 20C20 15 25 30 40 25C48 22 55 35 55 45 42 50 30 48 18 46 8 55 0 45V30C5 30 8 22 10 20Z" fill="${color}" fill-opacity="${finalOpacity}"/><circle cx="45" cy="12" r="8" fill="${color}" fill-opacity="${finalOpacity}"/></svg>`
    )}`;
  }
  if (patternId === 'checker') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect width="16" height="16" fill="${color}" fill-opacity="${finalOpacity}"/><rect x="16" y="16" width="16" height="16" fill="${color}" fill-opacity="${finalOpacity}"/></svg>`
    )}`;
  }

  // The organic pattern is still on its way: show a plain background for now.
  if (!organicPath) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg width="360" height="488" viewBox="0 0 360 488" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="488" fill="${color}" fill-opacity="${finalOpacity}"/></svg>`
    )}`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg width="360" height="488" viewBox="0 0 360 488" xmlns="http://www.w3.org/2000/svg"><path fill="${color}" fill-opacity="${finalOpacity}" d="${organicPath}"/></svg>`
  )}`;
};
