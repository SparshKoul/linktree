/**
 * Take away the events that are too old to be of use.
 *
 * The table of the events grows with every view and every click. The
 * numbers on the screen are worked out of the last weeks, so the old
 * events are of no use to anybody, and they only make the questions to
 * the database slower.
 *
 * The events of the last ANALYTICS_RETENTION_DAYS days are kept (180 days
 * by default).
 *
 * node scripts/clean-old-events.mjs          (shows what it would do)
 * node scripts/clean-old-events.mjs --write  (does it)
 */
import { supabase } from '../src/db/supabase.js';

const write = process.argv.includes('--write');
const days = Number(process.env.ANALYTICS_RETENTION_DAYS || 180);

async function main() {
  const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', before);

  if (error) {
    console.error('cannot count the events:', error.message);
    process.exit(1);
  }

  const { count: total } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true });

  console.log(`events in the table: ${total}`);
  console.log(`older than ${days} days: ${count}`);

  if (!count) {
    console.log('nothing to take away');
    process.exit(0);
  }

  if (!write) {
    console.log('use --write to take them away');
    process.exit(0);
  }

  // The table is taken away in pieces, so the database is never busy for
  // long and the request does not time out.
  let removed = 0;
  for (let round = 0; round < 50; round++) {
    const { data, error: deleteError } = await supabase
      .from('analytics_events')
      .delete()
      .lt('created_at', before)
      .limit(5000)
      .select('id');

    if (deleteError) {
      console.error('could not take them away:', deleteError.message);
      break;
    }
    if (!data || data.length === 0) break;
    removed += data.length;
    console.log(`  ${removed} events taken away`);
    if (data.length < 5000) break;
  }

  const { count: left } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true });

  console.log(`${removed} events taken away, ${left} are left`);
  process.exit(0);
}

main();
