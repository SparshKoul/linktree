/**
 * Make the pictures of the trees smaller.
 *
 * A picture of a few megabytes is downloaded by every visitor before the
 * page can be used. This makes the pictures of the trees smaller, puts the
 * small ones on the storage and writes the new addresses in their place.
 *
 * The picture keeps its look. Nothing is deleted: the old file stays on
 * the storage.
 *
 * node scripts/shrink-tree-pictures.mjs          (shows what it would do)
 * node scripts/shrink-tree-pictures.mjs --write  (does it)
 */
import crypto from 'crypto';
import { supabase } from '../src/db/supabase.js';
import { shrinkImageUrl } from './shrink-image-url.mjs';

const write = process.argv.includes('--write');
const base = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
const userId = Number(process.env.SHOOT_USER_ID || 1);

const secret =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

function signSession(id) {
  const payload = Buffer.from(
    JSON.stringify({ uid: Number(id), exp: Date.now() + 3600 * 1000 })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

const isStored = (value) =>
  typeof value === 'string' && value.includes('/storage/v1/object/public/linktree-assets/');

async function sizeOf(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const length = res.headers.get('content-length');
    return length ? Number(length) : 0;
  } catch {
    return 0;
  }
}

async function main() {
  const { data: trees, error } = await supabase
    .from('trees')
    .select('id, slug, title, admin_id, custom_theme, avatar_url, banner_url, hero_url, logo_url');
  if (error) {
    console.error('cannot read the trees:', error.message);
    process.exit(1);
  }

  const token = signSession(userId);
  // The same picture is often used in two places. It is made smaller once.
  const done = new Map();

  for (const tree of trees || []) {
    const theme = { ...(tree.custom_theme || {}) };
    const changes = {};

    const fields = ['wallpaperVideoUrl', 'backgroundImageUrl', 'avatarUrl'];
    for (const field of fields) {
      const url = theme[field];
      // A picture that is still inside the tree has to go to the storage.
      if (typeof url === 'string' && url.startsWith('data:image')) {
        const small = await shrinkImageUrl(url, { maxWidth: 1600, maxHeight: 1600 });
        if (small) {
          const newUrl = await upload(small.dataUrl, field === 'avatarUrl' ? 'avatars' : 'wallpapers');
          if (newUrl) {
            changes[field] = newUrl;
            console.log(`tree ${tree.id} (@${tree.slug}): ${field} inside the tree -> ${newUrl}`);
          }
        }
        continue;
      }
      if (!isStored(url)) continue;
      if (done.has(url)) {
        if (done.get(url)) changes[field] = done.get(url);
        continue;
      }

      const bytes = await sizeOf(url);
      if (!bytes || bytes < 400 * 1024) {
        done.set(url, null);
        continue;
      }

      console.log(`tree ${tree.id} (@${tree.slug}): ${field} is ${(bytes / 1024).toFixed(0)} KB, making it smaller`);
      const small = await shrinkImageUrl(url, { maxWidth: 1920, maxHeight: 1920 });
      if (!small) {
        console.log('  could not make it smaller');
        done.set(url, null);
        continue;
      }

      const newUrl = await upload(small.dataUrl, 'wallpapers');
      if (!newUrl) {
        console.log('  could not upload it');
        done.set(url, null);
        continue;
      }
      changes[field] = newUrl;
      done.set(url, newUrl);
      console.log(`  -> ${small.width}x${small.height}, ${(small.dataUrl.length / 1024).toFixed(0)} KB, ${newUrl}`);
    }

    if (Object.keys(changes).length === 0) continue;

    if (!write) {
      console.log('  (use --write to do it)');
      continue;
    }

    const res = await fetch(`${base}/api/admin/trees/${tree.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `it_session=${token}`,
      },
      body: JSON.stringify({ customTheme: { ...theme, ...changes } }),
    });
    console.log(res.ok ? '  saved' : `  could not save: ${res.status}`);
  }

  process.exit(0);
}

async function upload(dataUrl, folder) {
  try {
    const res = await fetch(`${base}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `it_session=${signSession(userId)}` },
      body: JSON.stringify({ file: dataUrl, filename: 'wallpaper.webp', folder }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.url && !body.fallback ? body.url : null;
  } catch {
    return null;
  }
}

main();
