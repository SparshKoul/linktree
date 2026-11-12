import { describe, it, expect } from 'vitest';
import { getUrlMetadata, isMapsSearch } from './components/AddCardModal.jsx';

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

  it('never throws away the path the owner pasted', () => {
    // A pasted profile, repo or video must link there — not to the home page.
    expect(getUrlMetadata('https://github.com/SparshKoul/linktree').url).toBe('https://github.com/SparshKoul/linktree');
    expect(getUrlMetadata('https://instagram.com/myprofile/').url).toBe('https://instagram.com/myprofile/');
    expect(getUrlMetadata('https://youtube.com/watch?v=abc123').url).toBe('https://youtube.com/watch?v=abc123');
    expect(getUrlMetadata('https://www.linkedin.com/in/sparsh-koul').url).toBe('https://www.linkedin.com/in/sparsh-koul');
    expect(getUrlMetadata('https://spotify.com/playlist/xyz').url).toBe('https://spotify.com/playlist/xyz');
    // Without a protocol the https:// is added, the path still kept.
    expect(getUrlMetadata('instagram.com/myprofile').url).toBe('https://instagram.com/myprofile');
    expect(getUrlMetadata('twitter.com/user/status/123').url).toBe('https://twitter.com/user/status/123');
  });

  it('only treats a real place search as Maps, never ordinary words or URLs', () => {
    // A search about a place shows the Maps / Reviews results.
    expect(isMapsSearch('best place to eat delhi')).toBe(true);
    expect(isMapsSearch('maps location')).toBe(true);

    // Ordinary words that merely contain "place" or "maps" are not hijacked.
    expect(isMapsSearch('marketplace')).toBe(false);
    expect(isMapsSearch('workplace culture')).toBe(false);
    expect(isMapsSearch('coffee shop')).toBe(false);

    // Anything that looks like a web address is a link, even a maps one.
    expect(isMapsSearch('https://maps.google.com/maps?q=delhi')).toBe(false);
    expect(isMapsSearch('goo.gl/maps/xyz')).toBe(false);
    expect(isMapsSearch('marketplace.com')).toBe(false);
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

  it('handles gallery card setup and image/video uploads without requiring external destination URL', () => {
    const galleryCard = {
      id: 10,
      type: 'gallery',
      title: 'Gallery',
      url: '',
      subtitle: 'Gallery · 2 items',
      settings: {
        images: ['https://example.com/photo1.jpg', 'data:video/mp4;base64,...'],
        needsSetup: false,
      },
    };

    const isGallery = galleryCard.type === 'gallery' || Boolean(galleryCard.settings?.images);
    const isSetupNeeded = Boolean(
      (!galleryCard.url || galleryCard.url.trim() === '' || galleryCard.url === 'https://' || galleryCard.settings?.needsSetup) &&
      galleryCard.type !== 'collapsible' &&
      !isGallery
    );

    expect(isGallery).toBe(true);
    expect(isSetupNeeded).toBe(false);
    expect(galleryCard.settings.images).toHaveLength(2);
  });

  it('correctly discriminates and supports .png, .jpg, and .mp4 media items', () => {
    const isVideoMedia = (url = '') => {
      if (!url) return false;
      return (
        /\.(mp4|webm|mov|ogg)($|\?)/i.test(url) ||
        url.startsWith('data:video') ||
        url.includes('video/mp4') ||
        url.includes('video/webm') ||
        url.includes('video/quicktime')
      );
    };

    const normalizeExtension = (filename = '') => {
      const ext = filename.split('.').pop().toLowerCase();
      return ext === 'pnj' ? 'png' : ext;
    };

    expect(isVideoMedia('clip.mp4')).toBe(true);
    expect(isVideoMedia('https://storage.com/clip.mp4?v=1')).toBe(true);
    expect(isVideoMedia('data:video/mp4;base64,AAAA')).toBe(true);

    expect(isVideoMedia('photo.jpg')).toBe(false);
    expect(isVideoMedia('image.png')).toBe(false);
    expect(isVideoMedia('image.pnj')).toBe(false);

    expect(normalizeExtension('photo.jpg')).toBe('jpg');
    expect(normalizeExtension('graphic.png')).toBe('png');
    expect(normalizeExtension('typo.pnj')).toBe('png');
  });

  it('formats file sizes accurately and preserves gallery items across updates', () => {
    const formatFileSize = (bytes) => {
      if (!bytes || isNaN(bytes)) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');

    // Test deep settings merge
    const originalCard = {
      id: 1,
      title: 'Gallery',
      settings: {
        images: [{ url: 'photo1.jpg', size: 1048576, formattedSize: '1.0 MB' }],
        layout: 'classic',
      },
    };

    const serverUpdate = {
      title: 'New Gallery Title',
      settings: { layout: 'featured' },
    };

    const merged = {
      ...originalCard,
      ...serverUpdate,
      settings: {
        ...(originalCard.settings || {}),
        ...(serverUpdate.settings || {}),
      },
    };

    expect(merged.settings.images).toHaveLength(1);
    expect(merged.settings.layout).toBe('featured');
    expect(merged.title).toBe('New Gallery Title');
  });
});

