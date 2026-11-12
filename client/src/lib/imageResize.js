/**
 * Make a picture smaller before it is sent to the server.
 *
 * A picture of a few megabytes is downloaded by every visitor before the
 * page can be used. The browser can make it smaller on the spot, with a
 * canvas, so the owner keeps the same picture and everybody waits less.
 *
 * Pictures that are small already, videos, PDFs and drawings are left
 * alone.
 */

/**
 * Read a file as a data address.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('the file could not be read'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load a picture so it can be drawn on a canvas.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('the picture could not be read'));
    image.src = src;
  });
}

/**
 * Make a picture smaller, if it is worth it.
 *
 * The picture keeps its look: a picture with a transparent part stays
 * transparent (webp keeps the transparent part, and a browser that does not
 * know webp gives a png back by itself).
 *
 * @param {File} file
 * @param {object} [options]
 * @param {number} [options.maxWidth] the widest the picture may be
 * @param {number} [options.maxHeight] the tallest the picture may be
 * @param {number} [options.quality] from 0 to 1
 * @param {number} [options.minBytes] pictures below this are left alone
 * @param {string} [options.dataUrl] the picture, when it was already read
 * @returns {Promise<{dataUrl: string, filename: string}|null>} null when
 *          the picture is already small enough
 */
export async function shrinkPicture(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    minBytes = 300 * 1024,
    dataUrl: given,
  } = options;

  if (!file || typeof file.type !== 'string') return null;
  if (!file.type.startsWith('image/')) return null;
  // A drawing cannot be made smaller with a canvas.
  if (file.type === 'image/svg+xml') return null;
  if (file.size < minBytes) return null;

  try {
    const original = given || (await readAsDataUrl(file));
    const image = await loadImage(original);
    if (!image.width || !image.height) return null;

    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // The browser gives a png back when it does not know webp.
    const dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/')) return null;
    if (dataUrl.length >= original.length) return null;

    const extension = dataUrl.startsWith('data:image/webp') ? 'webp' : 'png';
    const name = (file.name || 'picture').replace(/\.[^.]+$/, '');
    return { dataUrl, filename: `${name}.${extension}` };
  } catch {
    // The picture stays as it is.
    return null;
  }
}
