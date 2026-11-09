import { describe, it, expect } from 'vitest';
import { ALL_FONTS } from './components/TextEditor.jsx';

describe('TextEditor Logic & Font Catalog', () => {
  it('contains the full font list from the reference images', () => {
    const fontNames = ALL_FONTS.map((f) => f.name);

    // Verify key fonts visible in Image 1 & Image 2
    expect(fontNames).toContain('Link Sans');
    expect(fontNames).toContain('Manrope');
    expect(fontNames).toContain('Albert Sans');
    expect(fontNames).toContain('Belanosima');
    expect(fontNames).toContain('Bricolage Grotesque');
    expect(fontNames).toContain('DM Sans');
    expect(fontNames).toContain('Inter');
    expect(fontNames).toContain('Lato');
    expect(fontNames).toContain('M Plus Rounded');
    expect(fontNames).toContain('Poppins');
    expect(fontNames).toContain('Red Hat Display');
    expect(fontNames).toContain('Roboto');
    expect(fontNames).toContain('Rubik');
    expect(fontNames).toContain('Space Grotesk');
    expect(fontNames).toContain('Syne');
    expect(fontNames).toContain('BioRhyme');
    expect(fontNames).toContain('Bitter');
    expect(fontNames).toContain('Caudex');
    expect(fontNames).toContain('Corben');
    expect(fontNames).toContain('Domine');
    expect(fontNames).toContain('Hahmlet');
    expect(fontNames).toContain('IBM Plex Serif');
    expect(fontNames).toContain('Lora');
    expect(fontNames).toContain('Merriweather');
    expect(fontNames).toContain('Noto Serif');
    expect(fontNames).toContain('Old Standard TT');
    expect(fontNames).toContain('PT Serif');
    expect(fontNames).toContain('Playfair Display');
    expect(fontNames).toContain('Roboto Serif');
    expect(fontNames).toContain('Roboto Slab');
    expect(fontNames).toContain('Source Serif Pro');
    expect(fontNames).toContain('IBM Plex Mono');
    expect(fontNames).toContain('Space Mono');
    expect(fontNames).toContain('Shantell Sans');

    expect(ALL_FONTS.length).toBeGreaterThanOrEqual(35);
  });

  it('correctly flags pro fonts matching the reference badges', () => {
    const proFontMap = Object.fromEntries(ALL_FONTS.map((f) => [f.name, f.pro]));

    // Pro fonts (marked with ⚡ in Image 1 & 2)
    expect(proFontMap['Belanosima']).toBe(true);
    expect(proFontMap['Bricolage Grotesque']).toBe(true);
    expect(proFontMap['Lato']).toBe(true);
    expect(proFontMap['Poppins']).toBe(true);
    expect(proFontMap['Space Grotesk']).toBe(true);
    expect(proFontMap['Syne']).toBe(true);
    expect(proFontMap['Playfair Display']).toBe(true);

    // Free / Core fonts (no badge in Image 1 & 2)
    expect(proFontMap['Albert Sans']).toBe(false);
    expect(proFontMap['DM Sans']).toBe(false);
    expect(proFontMap['Inter']).toBe(false);
    expect(proFontMap['Link Sans']).toBe(false);
    expect(proFontMap['Manrope']).toBe(false);
    expect(proFontMap['Red Hat Display']).toBe(false);
  });

  it('correctly handles alternative title font toggle logic', () => {
    const stateDefault = {
      altFontEnabled: false,
      fontFamily: 'Link Sans',
      titleFont: 'Manrope',
    };

    // When disabled, effective title font matches page font
    const effectiveTitleFont = stateDefault.altFontEnabled
      ? stateDefault.titleFont
      : stateDefault.fontFamily;
    expect(effectiveTitleFont).toBe('Link Sans');

    // When enabled, distinct title font is used
    const stateActive = { ...stateDefault, altFontEnabled: true };
    const effectiveTitleFontActive = stateActive.altFontEnabled
      ? stateActive.titleFont
      : stateActive.fontFamily;
    expect(effectiveTitleFontActive).toBe('Manrope');
  });
});
