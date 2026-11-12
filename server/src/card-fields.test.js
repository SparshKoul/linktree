import { describe, it, expect } from 'vitest';
import { cardColumnsFrom, formatCardRecord, CARD_COLUMN_BY_FIELD } from './db/db.js';

describe('Card fields', () => {
  it('saves every field of a card, in either spelling', () => {
    const columns = cardColumnsFrom({
      type: 'menu',
      title: 'Restaurant Menu',
      subtitle: 'The description',
      url: 'https://example.com/menu.pdf',
      thumbnailUrl: 'https://example.com/thumb.png',
      position: 3,
      visible: false,
      layout: 'featured',
      animation: 'slide',
      lockType: 'code',
      lockValue: 'open-sesame',
      pinned: true,
      groupName: 'Extras',
      scheduledStart: '2026-01-01T00:00:00.000Z',
      scheduledEnd: '2026-02-01T00:00:00.000Z',
    });

    expect(columns).toEqual({
      type: 'menu',
      title: 'Restaurant Menu',
      subtitle: 'The description',
      url: 'https://example.com/menu.pdf',
      thumbnail_url: 'https://example.com/thumb.png',
      position: 3,
      visible: false,
      layout: 'featured',
      animation: 'slide',
      lock_type: 'code',
      lock_value: 'open-sesame',
      pinned: true,
      group_name: 'Extras',
      scheduled_start: '2026-01-01T00:00:00.000Z',
      scheduled_end: '2026-02-01T00:00:00.000Z',
    });
  });

  it('accepts the snake case spelling of a field', () => {
    const columns = cardColumnsFrom({
      thumbnail_url: 'https://example.com/t.png',
      lock_type: 'age',
      lock_value: '18',
      group_name: 'Extras',
    });

    expect(columns.thumbnail_url).toBe('https://example.com/t.png');
    expect(columns.lock_type).toBe('age');
    expect(columns.lock_value).toBe('18');
    expect(columns.group_name).toBe('Extras');
  });

  it('ignores fields that are not part of a card', () => {
    const columns = cardColumnsFrom({
      id: 12,
      tree_id: 3,
      clicks: 99,
      created_at: 'yesterday',
      somethingElse: 'ignored',
    });

    expect(columns).toEqual({});
  });

  it('reads every field back', () => {
    const card = formatCardRecord({
      id: '7',
      tree_id: '2',
      type: 'menu',
      title: 'Menu',
      subtitle: 'Tasty',
      url: 'https://example.com/menu.pdf',
      thumbnail_url: 'https://example.com/t.png',
      clicks: '4',
      position: 1,
      visible: true,
      layout: 'featured',
      animation: 'fade',
      lock_type: 'code',
      lock_value: 'open-sesame',
      pinned: true,
      group_name: 'Extras',
      scheduled_start: '2026-01-01T00:00:00.000Z',
      scheduled_end: '2026-02-01T00:00:00.000Z',
      settings: { note: 'kept' },
    });

    expect(card.id).toBe(7);
    expect(card.treeId).toBe(2);
    expect(card.thumbnailUrl).toBe('https://example.com/t.png');
    expect(card.lockType).toBe('code');
    expect(card.lockValue).toBe('open-sesame');
    expect(card.pinned).toBe(true);
    expect(card.groupName).toBe('Extras');
    expect(card.scheduledStart).toBe('2026-01-01T00:00:00.000Z');
    expect(card.scheduledEnd).toBe('2026-02-01T00:00:00.000Z');
    expect(card.clicks).toBe(4);
    expect(card.settings.note).toBe('kept');
  });

  it('covers every column of the cards table', () => {
    // A column that is not in the list would be dropped when saving.
    const columns = new Set(Object.values(CARD_COLUMN_BY_FIELD));
    for (const column of [
      'type', 'title', 'subtitle', 'url', 'thumbnail_url', 'position', 'visible',
      'layout', 'animation', 'lock_type', 'lock_value', 'pinned', 'group_name',
      'scheduled_start', 'scheduled_end',
    ]) {
      expect(columns.has(column)).toBe(true);
    }
  });
});
