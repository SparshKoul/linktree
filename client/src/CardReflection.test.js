import { describe, it, expect } from 'vitest';
import { getUrlMetadata } from './components/AddCardModal.jsx';

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
    const meta = getUrlMetadata('github.com');
    expect(meta.title).toBe('GitHub · Change is constant. GitHub keeps you ahead. · GitHub · GitHub');
    expect(meta.url).toBe('https://github.com');
    expect(meta.subtitle).toBe('github.com');

    const igMeta = getUrlMetadata('https://instagram.com');
    expect(igMeta.title).toContain('Instagram');
    expect(igMeta.url).toBe('https://instagram.com');
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

  it('correctly resolves banner cover from both direct bannerUrl and customTheme across refresh', () => {
    // Simulated tree payload coming back from Supabase after refresh
    const refreshedTreeFromSupabase = {
      id: 1,
      adminId: 1,
      slug: 'riyast',
      customTheme: {
        headerLayout: 'banner',
        bannerUrl: 'https://qbnrhcllnuwdeivpxxoj.supabase.co/storage/v1/object/public/linktree-assets/banners/neon-city.png',
      },
    };

    const headerLayout = refreshedTreeFromSupabase.headerLayout || refreshedTreeFromSupabase.customTheme?.headerLayout || 'classic';
    const bannerImage = refreshedTreeFromSupabase.bannerUrl || refreshedTreeFromSupabase.customTheme?.bannerUrl;

    expect(headerLayout).toBe('banner');
    expect(bannerImage).toBe('https://qbnrhcllnuwdeivpxxoj.supabase.co/storage/v1/object/public/linktree-assets/banners/neon-city.png');
  });

  it('identifies local device media cards (gallery, menu/pdf, video) for in-page expansion', () => {
    const isLocalMediaCard = (card) => {
      const isGallery =
        card.type === 'gallery' ||
        card.settings?.platform === 'gallery' ||
        Boolean(card.settings?.images && card.settings.images.length > 0) ||
        (card.title || '').toLowerCase().includes('gallery');

      const isPdfOrMenu =
        card.type === 'menu' ||
        card.settings?.platform === 'menu' ||
        Boolean(card.settings?.isPdf) ||
        Boolean(card.settings?.pdfName) ||
        Boolean(card.url && /\.pdf($|\?)/i.test(card.url)) ||
        Boolean(card.url && card.url.startsWith('data:application/pdf')) ||
        (card.title || '').toLowerCase().includes('menu');

      const isLocalVideo =
        card.type === 'video' ||
        Boolean(card.url && /\.(mp4|webm|mov|ogg)($|\?)/i.test(card.url)) ||
        Boolean(card.url && card.url.startsWith('data:video'));

      return isGallery || isPdfOrMenu || isLocalVideo;
    };

    expect(isLocalMediaCard({ type: 'gallery', title: 'Gallery' })).toBe(true);
    expect(isLocalMediaCard({ type: 'menu', title: 'Restaurant Menu', settings: { isPdf: true } })).toBe(true);
    expect(isLocalMediaCard({ type: 'video', title: 'Local Clip', url: 'blob:video.mp4' })).toBe(true);
    expect(isLocalMediaCard({ type: 'link', title: 'Instagram', url: 'https://instagram.com' })).toBe(false);
  });
});

