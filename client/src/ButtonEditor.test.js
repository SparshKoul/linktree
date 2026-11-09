import { describe, it, expect } from 'vitest';
import { hexToHsv, hsvToHex, hsvToRgb } from './components/ButtonEditor.jsx';

describe('ButtonEditor Logic & Color Conversions', () => {
  it('correctly converts HEX to HSV and back', () => {
    // Pure Red
    const redHsv = hexToHsv('#FF0000');
    expect(redHsv.h).toBe(0);
    expect(redHsv.s).toBe(100);
    expect(redHsv.v).toBe(100);
    expect(hsvToHex(0, 100, 100)).toBe('#FF0000');

    // Pure White
    const whiteHsv = hexToHsv('#FFFFFF');
    expect(whiteHsv.s).toBe(0);
    expect(whiteHsv.v).toBe(100);
    expect(hsvToHex(0, 0, 100)).toBe('#FFFFFF');

    // Pure Black
    const blackHsv = hexToHsv('#000000');
    expect(blackHsv.v).toBe(0);
    expect(hsvToHex(0, 0, 0)).toBe('#000000');

    // Reddish-coral #BD6D6D from Image 2
    const coralHsv = hexToHsv('#BD6D6D');
    expect(coralHsv.h).toBe(0); // Hue ~0 deg
    expect(Math.round(coralHsv.s)).toBe(42);
    expect(Math.round(coralHsv.v)).toBe(74);
    expect(hsvToHex(coralHsv.h, coralHsv.s, coralHsv.v)).toBe('#BD6D6D');
  });

  it('correctly maps button corner roundness options', () => {
    const getActiveCornerIndex = (radius) => {
      if (radius == null || radius >= 24) return 3; // Pill
      if (radius > 12) return 2; // Medium (16)
      if (radius > 4) return 1; // Subtle (8)
      return 0; // Square (0)
    };

    expect(getActiveCornerIndex(9999)).toBe(3);
    expect(getActiveCornerIndex(undefined)).toBe(3);
    expect(getActiveCornerIndex(16)).toBe(2);
    expect(getActiveCornerIndex(8)).toBe(1);
    expect(getActiveCornerIndex(0)).toBe(0);
  });

  it('determines visibility of Button Color based on style', () => {
    const isButtonColorVisible = (style) => style !== 'glass';

    expect(isButtonColorVisible('glass')).toBe(false);
    expect(isButtonColorVisible('outline')).toBe(true);
    expect(isButtonColorVisible('solid')).toBe(true);
    expect(isButtonColorVisible('fill')).toBe(true);
  });
});
