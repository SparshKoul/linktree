/**
 * The fonts of the site.
 *
 * Asking Google for all of them at once meant 376 kilobytes of style sheet
 * that every visitor had to wait for. The three the themes use are in the
 * page itself, the rest are fetched when a tree really uses one.
 */

// The weights each family has, the same as before.
export const FONT_WEIGHTS = {
  'Albert Sans': '400;600;700',
  'Belanosima': '400;700',
  'BioRhyme': '400;700',
  'Bitter': '400;600',
  'Bricolage Grotesque': '400;700',
  'Caudex': '400;700',
  'Corben': '400;700',
  'DM Sans': '400;700',
  'Domine': '400;700',
  'Epilogue': '400;700',
  'Hahmlet': '400;700',
  'IBM Plex Mono': '400;600',
  'IBM Plex Sans': '400;600;700',
  'IBM Plex Serif': '400;600;700',
  'Inter': '400;500;600;700;800',
  'Lato': '400;700',
  'Link Sans': '400;600;700',
  'Lora': '400;700',
  'M PLUS Rounded 1c': '400;700',
  'Manrope': '400;500;600;700;800',
  'Merriweather': '400;700',
  'Noto Serif': '400;700',
  'Old Standard TT': '400;700',
  'Oxanium': '400;700',
  'Playfair Display': '400;700',
  'Poppins': '400;500;600;700',
  'PT Serif': '400;700',
  'Red Hat Display': '400;700',
  'Roboto': '400;500;700',
  'Roboto Serif': '400;700',
  'Roboto Slab': '400;700',
  'Rubik': '400;700',
  'Shantell Sans': '400;700',
  'Source Serif 4': '400;700',
  'Space Grotesk': '400;700',
  'Space Mono': '400;700',
  'Syne': '400;800',};

// The fonts that are in the page from the start.
export const THEME_FONTS = ['Inter', 'Playfair Display', 'Space Grotesk'];

const loaded = new Set(THEME_FONTS);

/**
 * The address of the style sheet for one family.
 * @param {string} family
 * @returns {string}
 */
export function fontStylesheetUrl(family) {
  const weights = FONT_WEIGHTS[family] || '400;500;600;700';
  const name = family.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weights}&display=swap`;
}

/**
 * Fetch the font of a tree when it is not one of the ones that are already
 * there. Nothing happens for a font that is already loaded.
 * @param {string} family
 */
export function loadFont(family) {
  if (!family || loaded.has(family)) return;
  if (typeof document === 'undefined') return;
  if (!FONT_WEIGHTS[family]) return;

  loaded.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontStylesheetUrl(family);
  document.head.appendChild(link);
}
