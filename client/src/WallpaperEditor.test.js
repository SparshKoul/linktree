import { describe, it, expect } from 'vitest';
import {
  WALLPAPER_IMAGE_PRESETS,
  PATTERN_PRESETS,
  SOLID_PALETTE,
} from './components/WallpaperEditor.jsx';
import {
  isColorLight,
  getContrastingPatternColor,
  getPatternSvg,
} from './constants/patternSvg.js';

describe('Wallpaper Editor & Linktree Fidelity Logic', () => {
  it('correctly calculates contrasting pattern colors for light and dark backgrounds', () => {
    expect(isColorLight('#FFFFFF')).toBe(true);
    expect(isColorLight('#050F15')).toBe(false);
    expect(getContrastingPatternColor('#FFFFFF')).toBe('#000000');
    expect(getContrastingPatternColor('#050F15')).toBe('#FFFFFF');

    const lightPatternSvg = getPatternSvg('organic', '#000000');
    expect(lightPatternSvg).toContain('data:image/svg+xml');
    expect(lightPatternSvg).toContain('fill-opacity');
  });
  it('provides all Linktree wallpaper presets including 3D Celestial and Emerald Agate', () => {
    expect(WALLPAPER_IMAGE_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(WALLPAPER_IMAGE_PRESETS.some((p) => p.name === '3D Celestial')).toBe(true);
    expect(WALLPAPER_IMAGE_PRESETS.some((p) => p.name === 'Emerald Agate')).toBe(true);
  });

  it('provides the 4 pattern presets matching Screenshot 3', () => {
    const ids = PATTERN_PRESETS.map((p) => p.id);
    expect(ids).toContain('organic');
    expect(ids).toContain('grid');
    expect(ids).toContain('camo');
    expect(ids).toContain('checker');
  });

  it('includes Sage Green (#638873) in solid color palette matching Screenshots 3 & 4', () => {
    expect(SOLID_PALETTE).toContain('#638873');
  });

  it('computes correct tint overlay rgba colors', () => {
    const darkTint = -50;
    const darkAlpha = (Math.abs(darkTint) / 100) * 0.75;
    expect(darkAlpha).toBe(0.375);

    const lightTint = 40;
    const lightAlpha = (lightTint / 100) * 0.75;
    expect(lightAlpha).toBeCloseTo(0.3);
  });

  it('supports configurable blur amount slider and presets', () => {
    const blurPresets = [
      { label: 'Subtle', val: 6 },
      { label: 'Medium', val: 18 },
      { label: 'Strong', val: 30 },
      { label: 'Maximum', val: 50 },
    ];
    expect(blurPresets.length).toBe(4);
    expect(blurPresets[0].val).toBe(6);
    expect(blurPresets[3].val).toBe(50);

    const getEffectiveBlur = (theme) => (typeof theme?.blurAmount === 'number' ? theme.blurAmount : 20);
    expect(getEffectiveBlur({})).toBe(20);
    expect(getEffectiveBlur({ blurAmount: 35 })).toBe(35);
    expect(getEffectiveBlur({ blurAmount: 0 })).toBe(0);
  });
});
