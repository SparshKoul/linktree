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

    // The picture is sent as it is, not as a long text. A picture of a few
    // megabytes is a third smaller this way, and the server does not have
    // to turn a text into a picture again.
    const bytes = dataUrlToBytes(picture);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': bytes.mimeType,
        'x-file-name': filename,
        'x-file-folder': folder,
        ...(treeId ? { 'x-tree-id': String(Number(treeId)) } : {}),
      },
      credentials: 'include',
      body: bytes.buffer,
    });

    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!body?.url || body.fallback) return null;
    return body.url;
  } catch {
    return null;
  }
}

/**
 * The bytes of a data address.
 * @param {string} dataUrl
 * @returns {{buffer: Uint8Array, mimeType: string}}
 */
function dataUrlToBytes(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { buffer: new Uint8Array(0), mimeType: 'application/octet-stream' };
  }
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { buffer: bytes, mimeType: match[1] };
}
