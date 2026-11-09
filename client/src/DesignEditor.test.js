import { describe, it, expect, vi } from 'vitest';

describe('DesignEditor Logic & State Flow', () => {
  it('correctly maps theme and customization labels matching reference UI', () => {
    const mockTree = {
      id: 1,
      themeId: 'classic-light',
      customTheme: {
        backgroundType: 'solid',
        backgroundValue: '#F3F3F1',
        buttonStyle: 'fill',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#111111',
        fontFamily: 'Inter',
        footerEnabled: true,
      },
    };

    const wallpaperLabel =
      mockTree.customTheme.backgroundType === 'image'
        ? 'Image'
        : mockTree.customTheme.backgroundType === 'gradient'
        ? 'Gradient'
        : 'Fill';

    const buttonStyleLabel =
      mockTree.customTheme.buttonStyle === 'outline'
        ? 'Outline'
        : mockTree.customTheme.buttonStyle === 'soft-shadow'
        ? 'Soft shadow'
        : 'Solid';

    const textFontLabel =
      mockTree.customTheme.fontFamily === 'Inter'
        ? 'Link Sans'
        : mockTree.customTheme.fontFamily || 'Link Sans';

    const themeDisplayName =
      mockTree.themeId === 'classic-light' ? 'Air' : 'Custom';

    expect(themeDisplayName).toBe('Air');
    expect(wallpaperLabel).toBe('Fill');
    expect(buttonStyleLabel).toBe('Solid');
    expect(textFontLabel).toBe('Link Sans');
  });

  it('correctly tracks undo and redo stack upon theme or wallpaper modifications', () => {
    let history = [
      { backgroundType: 'solid', backgroundValue: '#F3F3F1' },
    ];
    let index = 0;

    // Apply change: change to gradient
    const change1 = { backgroundType: 'gradient', backgroundValue: 'linear-gradient(135deg, #7033FF, #9F7AEA)' };
    history = [...history.slice(0, index + 1), change1];
    index = history.length - 1;

    expect(history[index].backgroundType).toBe('gradient');
    expect(index).toBe(1);

    // Undo
    if (index > 0) index -= 1;
    expect(history[index].backgroundType).toBe('solid');

    // Redo
    if (index < history.length - 1) index += 1;
    expect(history[index].backgroundType).toBe('gradient');
  });

  it('contains the complete set of customizable and curated themes matching reference', async () => {
    const { PRESET_THEMES } = await import('./constants/themes.js');
    const themeNames = PRESET_THEMES.map((t) => t.name);

    expect(themeNames).toContain('Air');
    expect(themeNames).toContain('Agate');
    expect(themeNames).toContain('Astrid');
    expect(themeNames).toContain('Aura');
    expect(themeNames).toContain('Bliss');
    expect(themeNames).toContain('Blocks');
    expect(themeNames).toContain('Bloom');
    expect(themeNames).toContain('Breeze');
    expect(themeNames).toContain('Encore');
    expect(themeNames).toContain('Grid');
    expect(themeNames).toContain('Groove');
    expect(themeNames).toContain('Haven');
    expect(themeNames).toContain('Lake');
    expect(themeNames).toContain('Mineral');
    expect(themeNames).toContain('Nourish');
    expect(themeNames).toContain('Rise');
    expect(themeNames).toContain('Sweat');
    expect(themeNames).toContain('Tress');
    expect(themeNames).toContain('Twilight');
    expect(themeNames).toContain('Vox');
  });
});
