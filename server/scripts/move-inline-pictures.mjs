/**
 * Move the pictures that are kept inside a tree to the storage.
 *
 * A wallpaper that was put into a tree as a long "data:image/..." string
 * makes every page of that tree slow to open, because the whole string is
 * read and sent again and again. This script puts those pictures into the
 * storage and writes the address of the picture in their place.
 *
 * Nothing is written when the upload does not work, so a tree never loses
 * its picture.
 *
 * node scripts/move-inline-pictures.mjs          (looks at every tree)
 * node scripts/move-inline-pictures.mjs 1        (looks at tree 1 only)
 */
import { db } from '../src/db/db.js';
import { supabase } from '../src/db/supabase.js';

const onlyTree = process.argv[2] ? Number(process.argv[2]) : null;

const isPicture = (value) =>
  typeof value === 'string' && value.startsWith('data:image') && value.length > 2000;

const fields = ['wallpaperVideoUrl', 'backgroundImageUrl'];

async function main() {
  let query = supabase.from('trees').select('id, slug, custom_theme');
  if (onlyTree) query = query.eq('id', onlyTree);

  const { data: trees, error } = await query;
  if (error) {
    console.error('cannot read the trees:', error.message);
    process.exit(1);
  }

  let moved = 0;

  for (const tree of trees || []) {
    const theme = tree.custom_theme || {};
    const changes = {};

    for (const field of fields) {
      const value = theme[field];
      if (!isPicture(value)) continue;

      console.log(`tree ${tree.id} (@${tree.slug}): ${field} holds ${value.length} characters, moving it to the storage`);

      const url = await db.uploadAsset({
        base64Data: value,
        filename: `${field}.png`,
        folder: 'wallpapers',
        treeId: tree.id,
      });

      if (!url) {
        console.log(`  could not upload, the tree keeps its picture`);
        continue;
      }

      changes[field] = url;
      console.log(`  -> ${url}`);
    }

    if (Object.keys(changes).length === 0) continue;

    const { error: writeError } = await supabase
      .from('trees')
      .update({ custom_theme: { ...theme, ...changes } })
      .eq('id', tree.id);

    if (writeError) {
      console.error(`  could not write the tree: ${writeError.message}`);
      continue;
    }

    moved += 1;
    console.log(`tree ${tree.id} is saved`);
  }

  console.log(moved === 0 ? 'nothing to move' : `${moved} tree(s) are lighter now`);
  process.exit(0);
}

main();
