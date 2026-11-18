import { describe, it, expect } from 'vitest';
import { formatTreeRecord } from './db/db.js';
import { sanitizeTreeForPublic } from './lib/public-payload.js';

describe('Blocking a whole page', () => {
  it('reads the block flag back, so the console and the owner can show it', () => {
    expect(formatTreeRecord({ id: 2, admin_id: 1, slug: 'bistro', blocked: true }).blocked).toBe(true);
    expect(formatTreeRecord({ id: 2, admin_id: 1, slug: 'bistro', blocked: false }).blocked).toBe(false);
    // A row written before the column existed counts as not blocked.
    expect(formatTreeRecord({ id: 2, admin_id: 1, slug: 'bistro' }).blocked).toBe(false);
  });

  it('blocks the page as one unit, never an attribute inside it', () => {
    const cards = [
      { id: 10, title: 'Instagram', url: 'https://instagram.com/x' },
      { id: 11, title: 'Menu', url: 'https://example.com/menu' },
    ];
    const tree = formatTreeRecord({ id: 2, admin_id: 1, slug: 'bistro', blocked: true }, cards);
    expect(tree.blocked).toBe(true);
    // The cards themselves are untouched; the whole page is what is down.
    expect(tree.cards).toHaveLength(2);
    expect(tree.cards.every((c) => c.blocked === undefined)).toBe(true);
  });

  it('carries the flag in the public payload, so a cached copy is still checked', () => {
    const publicTree = sanitizeTreeForPublic(
      formatTreeRecord({ id: 2, admin_id: 1, slug: 'bistro', blocked: true })
    );
    expect(publicTree.blocked).toBe(true);
  });
});
