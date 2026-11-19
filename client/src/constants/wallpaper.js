/**
 * The wash laid over a wallpaper to keep the text readable.
 *
 * A solid colour is already the owner's choice. A tint left over from an
 * earlier image wallpaper used to darken it as much as 75%, so a light page
 * slowly turned grey/black "on its own". On a solid background the tint is
 * ignored; the owner can pick a darker colour directly instead.
 *
 * @param {object|null} theme the active theme
 * @returns {string|null} a CSS colour, or null when no wash should be drawn
 */
export function tintOverlayColor(theme) {
  if (!theme || typeof theme.tint !== 'number' || theme.tint === 0) return null;
  if (theme.backgroundType === 'solid') return null;
  const alpha = Number(((Math.abs(theme.tint) / 100) * 0.75).toFixed(3));
  return theme.tint < 0
    ? `rgba(0, 0, 0, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
}
