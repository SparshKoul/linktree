import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ColorPickerPopover } from './ButtonEditor.jsx';

export function ColorsEditor({ current, commitChange, onBack }) {
  const [activePicker, setActivePicker] = useState(null); // null | 'background' | 'buttons' | 'buttonText' | 'pageText' | 'title'

  // Resolve current colors with defaults matching Linktree reference
  const backgroundColor =
    current.backgroundColor ||
    (current.backgroundValue?.startsWith('#') ? current.backgroundValue : '#702121');
  const buttonColor = current.buttonColor || '#FFFFFF';
  const buttonTextColor = current.buttonTextColor || '#BD6D6D';
  const pageTextColor = current.textColor || '#CC7272';
  const titleColor = current.titleColor || '#FFFFFF';

  const colorItems = [
    {
      id: 'background',
      label: 'Background',
      color: backgroundColor,
      onChange: (val) =>
        commitChange({
          backgroundType: 'solid',
          backgroundValue: val,
          backgroundColor: val,
        }),
    },
    {
      id: 'buttons',
      label: 'Buttons',
      color: buttonColor,
      onChange: (val) => commitChange({ buttonColor: val }),
    },
    {
      id: 'buttonText',
      label: 'Button text',
      color: buttonTextColor,
      onChange: (val) => commitChange({ buttonTextColor: val }),
    },
    {
      id: 'pageText',
      label: 'Page text',
      color: pageTextColor,
      onChange: (val) => commitChange({ textColor: val }),
    },
    {
      id: 'title',
      label: 'Title',
      color: titleColor,
      onChange: (val) => commitChange({ titleColor: val }),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 relative">
      {/* 1. Header with back button "< Colors" matching Reference Image */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer text-gray-700"
          title="Back to Design"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-[#111111]">Colors</h2>
      </div>

      {/* 2. Color Options List matching Reference Image */}
      <div className="space-y-5 max-w-[440px] relative">
        {colorItems.map((item) => (
          <div key={item.id} className="relative">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-gray-900 block">
                {item.label}
              </label>

              {/* Swatch Pill Button */}
              <button
                type="button"
                onClick={() =>
                  setActivePicker(activePicker === item.id ? null : item.id)
                }
                className="w-28 sm:w-32 h-10 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center px-3 py-1.5 gap-2.5 cursor-pointer transition-all shadow-2xs"
              >
                <div
                  className="w-5 h-5 rounded-md border border-gray-200 shadow-2xs shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-mono font-medium text-gray-900 tracking-wider uppercase">
                  {item.color}
                </span>
              </button>
            </div>

            {/* Color Picker Popover anchored on the left */}
            {activePicker === item.id && (
              <div className="absolute left-0 -top-24 sm:-top-28 z-50">
                <ColorPickerPopover
                  color={item.color}
                  onChange={item.onChange}
                  onClose={() => setActivePicker(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
