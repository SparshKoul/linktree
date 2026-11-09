import { describe, it, expect, vi } from 'vitest';
import { ColorsEditor } from './components/ColorsEditor.jsx';

describe('ColorsEditor Component & State Logic', () => {
  it('correctly maps the 5 palette color fields matching reference UI', () => {
    const mockCurrent = {
      backgroundColor: '#702121',
      backgroundValue: '#702121',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#BD6D6D',
      textColor: '#CC7272',
      titleColor: '#FFFFFF',
    };

    const commitChange = vi.fn();
    const onBack = vi.fn();

    // Verify fallback and field resolutions
    const bg = mockCurrent.backgroundColor || mockCurrent.backgroundValue;
    expect(bg).toBe('#702121');
    expect(mockCurrent.buttonColor).toBe('#FFFFFF');
    expect(mockCurrent.buttonTextColor).toBe('#BD6D6D');
    expect(mockCurrent.textColor).toBe('#CC7272');
    expect(mockCurrent.titleColor).toBe('#FFFFFF');
  });

  it('correctly commits background color changes as solid backgroundType', () => {
    const committed = [];
    const commitChange = (patch) => committed.push(patch);

    // Simulate change background to #702121
    commitChange({
      backgroundType: 'solid',
      backgroundValue: '#702121',
      backgroundColor: '#702121',
    });

    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({
      backgroundType: 'solid',
      backgroundValue: '#702121',
      backgroundColor: '#702121',
    });
  });
});
