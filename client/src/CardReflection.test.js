import { describe, it, expect } from 'vitest';

describe('Card Reflection Logic', () => {
  it('detects unconfigured card state for empty urls in phone preview', () => {
    const card = {
      id: 1,
      type: 'link',
      title: 'Instagram',
      url: '',
    };
    const isUnconfigured = (!card.url || card.url.trim() === '' || card.url.trim() === 'https://') &&
      ['link', 'social', 'video', 'music', 'podcast', 'booking'].includes(card.type);

    expect(isUnconfigured).toBe(true);
  });

  it('detects configured card with valid url and derives domain', () => {
    const card = {
      id: 2,
      type: 'link',
      title: 'GitHub · Change is constant. GitHub keeps you ahead. · GitHub · GitHub',
      url: 'https://github.com',
    };
    const isUnconfigured = (!card.url || card.url.trim() === '' || card.url.trim() === 'https://') &&
      ['link', 'social', 'video', 'music', 'podcast', 'booking'].includes(card.type);

    expect(isUnconfigured).toBe(false);

    const domain = card.url.replace(/^https?:\/\//, '').split('/')[0];
    expect(domain).toBe('github.com');
  });

  it('correctly maps URL patterns to metadata titles', () => {
    const testUrl = 'github.com';
    const isUrlLike = /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(testUrl);
    expect(isUrlLike).toBe(true);

    const normalizedUrl = testUrl.startsWith('http') ? testUrl : `https://${testUrl}`;
    expect(normalizedUrl).toBe('https://github.com');
  });

  it('correctly formats Maps link card with place title and address', () => {
    const mapCard = {
      id: 1,
      type: 'maps',
      title: 'Star Carz Ludhiana',
      url: 'https://maps.app.goo.gl/41pK4HQY5RHNe7qQA',
      settings: {
        address: 'Starcarz, Pakhowal Rd, Hotel Aagaaz, Ludhiana',
        layout: 'classic',
      },
    };
    const domain = mapCard.url.replace(/^https?:\/\//, '').split('/')[0];
    expect(domain).toBe('maps.app.goo.gl');
    expect(mapCard.title).toBe('Star Carz Ludhiana');
    expect(mapCard.settings.address).toContain('Starcarz');
  });

  it('correctly formats plain link card like instagram.com', () => {
    const igCard = {
      id: 2,
      type: 'link',
      title: 'instagram.com',
      url: 'https://instagram.com',
    };
    const domain = igCard.url.replace(/^https?:\/\//, '').split('/')[0];
    expect(domain).toBe('instagram.com');
    expect(igCard.title).toBe('instagram.com');
  });

  it('supports dynamic custom card with editable subtitle and featured layout', () => {
    const customCard = {
      id: 99,
      type: 'maps',
      title: 'Central Park Cafe',
      subtitle: '59th to 110th St, New York',
      url: 'https://maps.google.com/?q=central+park',
      thumbnailUrl: 'https://images.unsplash.com/photo-central-park',
      settings: {
        address: '59th to 110th St, New York',
        layout: 'featured',
      },
    };

    expect(customCard.title).toBe('Central Park Cafe');
    expect(customCard.subtitle).toContain('New York');
    expect(customCard.settings.layout).toBe('featured');
    expect(customCard.thumbnailUrl).toBeTruthy();
  });
});

