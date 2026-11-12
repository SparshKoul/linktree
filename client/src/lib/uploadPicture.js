/**
 * Send a picture to the storage of the site.
 *
 * A big picture is made smaller in the browser first, so the visitors do
 * not have to wait for megabytes they do not need.
 */
import { shrinkPicture, readAsDataUrl } from './imageResize.js';

/**
 * Put a picture on the storage and give its address back.
 * @param {File} file the picture the owner picked
 * @param {object} [options]
 * @param {string} [options.folder] where the picture is kept
 * @param {number|string} [options.treeId] the card the picture belongs to
 * @param {number} [options.maxWidth] the widest the picture may be
 * @param {number} [options.maxHeight] the tallest the picture may be
 * @param {string} [options.dataUrl] the picture, when it was already read
 * @returns {Promise<string|null>} the address of the picture, or null
 */
export async function uploadPicture(file, options = {}) {
  const { folder = 'uploads', treeId, maxWidth, maxHeight, dataUrl } = options;
  if (!file) return null;

  try {
    const small = await shrinkPicture(file, { maxWidth, maxHeight, dataUrl });
    const picture = small ? small.dataUrl : dataUrl || (await readAsDataUrl(file));
    const filename = small ? small.filename : file.name || 'picture';

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        file: picture,
        filename,
        folder,
        treeId: treeId ? Number(treeId) : undefined,
      }),
    });

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!body?.url || body.fallback) return null;
    return body.url;
  } catch {
    return null;
  }
}
