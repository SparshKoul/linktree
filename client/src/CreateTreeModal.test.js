import { describe, it, expect } from 'vitest';

describe('Client-Side Slug Sanitization & Rules', () => {
  function formatSlug(input) {
    return input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  it('converts uppercase and spaces into clean url slugs', () => {
    expect(formatSlug('Riyast Boutique')).toBe('riyast-boutique');
    expect(formatSlug('Summer Collection 2026')).toBe('summer-collection-2026');
  });

  it('strips invalid characters', () => {
    expect(formatSlug('shop!@#$%')).toBe('shop');
    expect(formatSlug('my_business')).toBe('mybusiness');
  });
});

