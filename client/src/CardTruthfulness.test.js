import { describe, it, expect } from 'vitest';
import { reviewsLine, galleryLine, cardNeedsALink } from './constants/cardText.js';

describe('Nothing is made up for the owner', () => {
  it('writes no line under the title when nothing was written', () => {
    expect(reviewsLine('', '')).toBe('');
    expect(reviewsLine(null, null)).toBe('');
    expect(reviewsLine(undefined, undefined)).toBe('');
  });

  it('never fills in a rating or a number of reviews', () => {
    // The old behaviour: "5.0 ★ (48 reviews)" for everybody.
    expect(reviewsLine('', '')).not.toContain('48');
    expect(reviewsLine('', '')).not.toContain('5.0');
  });

  it('shows only what the owner wrote', () => {
    expect(reviewsLine('4.8', '120')).toBe('4.8 ★ (120 reviews)');
    expect(reviewsLine('4.8', '1')).toBe('4.8 ★ (1 review)');
    expect(reviewsLine('5', '')).toBe('5 ★');
    expect(reviewsLine('', '12')).toBe('12 reviews');
  });

  it('writes no count for a gallery without pictures', () => {
    expect(galleryLine(0)).toBe('');
    expect(galleryLine(3)).toBe('Gallery · 3 items');
    expect(galleryLine(1)).toBe('Gallery · 1 item');
    expect(galleryLine(2, '4 MB')).toBe('Gallery · 2 items · 4 MB');
  });

  it('knows which cards need a link of their own', () => {
    expect(cardNeedsALink('link')).toBe(true);
    expect(cardNeedsALink('reviews')).toBe(true);
    expect(cardNeedsALink('maps')).toBe(true);
    expect(cardNeedsALink('phone')).toBe(true);
    expect(cardNeedsALink('email')).toBe(true);

    // These show something of their own.
    expect(cardNeedsALink('header')).toBe(false);
    expect(cardNeedsALink('collapsible')).toBe(false);
    expect(cardNeedsALink('contact_form')).toBe(false);
  });
});
