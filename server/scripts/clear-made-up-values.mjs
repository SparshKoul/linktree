/**
 * Take away the things the app made up for the owner.
 *
 * When a card was added, it came with a rating, a number of reviews, an
 * address, a phone number or a link that nobody had written. Those are
 * taken away here, so the card only shows what the owner really put in.
 *
 * The script prints every card it touches. Nothing is deleted: only the
 * made up values are taken away.
 *
 * node scripts/clear-made-up-values.mjs          (shows what it would do)
 * node scripts/clear-made-up-values.mjs --write  (does it)
 */
import { supabase } from '../src/db/supabase.js';

const write = process.argv.includes('--write');

// The values the app wrote itself when a card was added.
const MADE_UP_COUNTS = [48, 142];
const MADE_UP_ADDRESS = 'Store or Office address';
const MADE_UP_URLS = ['https://google.com'];
// The lines the app wrote under the title.
const MADE_UP_LINES = [
  'Store or Office address',
  'Location address',
  'Location Pin',
  'Gallery · 0 items',
  'PDF Menu · View items & prices',
  'PDF Resume · View & download',
  'Add or drag & drop an existing link',
  '4.8 ★ (142 reviews)',
  '5.0 ★ (48 reviews)',
];
// "5.0 ★ (48 reviews)" and the broken "5 ★ ( reviews)".
const MADE_UP_SUBTITLE = /^\s*[\d.]*\s*★\s*\(\s*[\d]*\s*reviews?\s*\)\s*$/;

async function main() {
  const { data: cards, error } = await supabase.from('cards').select('id, tree_id, type, title, subtitle, url, settings');
  if (error) {
    console.error('cannot read the cards:', error.message);
    process.exit(1);
  }

  let touched = 0;

  for (const card of cards || []) {
    const settings = { ...(card.settings || {}) };
    const changes = [];
    const newSettings = { ...settings };

    if (card.type === 'reviews') {
      const count = settings.reviewCount ?? settings.reviewsCount;
      if (count != null && MADE_UP_COUNTS.includes(Number(count))) {
        delete newSettings.rating;
        delete newSettings.reviewCount;
        delete newSettings.reviewsCount;
        changes.push(`the made up rating ${settings.rating} and ${count} reviews`);
      }
      if (settings.rating != null && Number(settings.rating) === 5 && !MADE_UP_COUNTS.includes(Number(count))) {
        // A rating of 5 with a count of 0 is the empty form of the editor.
        if (Number(count) === 0) {
          delete newSettings.reviewCount;
          delete newSettings.reviewsCount;
          changes.push('the empty review count');
        }
      }
    }

    if (settings.address === MADE_UP_ADDRESS) {
      delete newSettings.address;
      changes.push('the made up address');
    }

    // The line under the title, when it lives inside the settings.
    const settingsLine = settings.subtitle;
    if (typeof settingsLine === 'string' && (MADE_UP_LINES.includes(settingsLine) || MADE_UP_SUBTITLE.test(settingsLine))) {
      delete newSettings.subtitle;
      changes.push(`the made up line "${settingsLine}"`);
    }

    // The link inside the settings, when it is the one the app made up.
    if (typeof settings.url === 'string' && MADE_UP_URLS.includes(settings.url)) {
      delete newSettings.url;
      changes.push(`the made up link ${settings.url}`);
    }

    if (card.subtitle && (MADE_UP_LINES.includes(card.subtitle) || MADE_UP_SUBTITLE.test(card.subtitle))) {
      changes.push(`the made up line "${card.subtitle}"`);
    }

    if (card.url && MADE_UP_URLS.includes(card.url)) {
      changes.push(`the made up link ${card.url}`);
    }

    if (changes.length === 0) continue;

    const patch = { settings: newSettings };
    if (card.subtitle && (MADE_UP_LINES.includes(card.subtitle) || MADE_UP_SUBTITLE.test(card.subtitle))) {
      patch.subtitle = '';
    }
    if (card.url && MADE_UP_URLS.includes(card.url)) {
      patch.url = '';
    }

    console.log(`card ${card.id} (tree ${card.tree_id}, ${card.type}, "${card.title || 'no name'}"):`);
    for (const change of changes) console.log(`  - ${change}`);
    touched += 1;

    if (write) {
      const { error: writeError } = await supabase.from('cards').update(patch).eq('id', card.id);
      if (writeError) {
        console.error(`  could not save: ${writeError.message}`);
        continue;
      }
      console.log('  saved');
    }
  }

  console.log(
    write
      ? `${touched} card(s) are cleaned`
      : `${touched} card(s) would be cleaned. Use --write to do it.`
  );
  process.exit(0);
}

main();
