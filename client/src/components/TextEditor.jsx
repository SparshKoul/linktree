import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, X } from 'lucide-react';
import { ColorPickerPopover } from './ButtonEditor.jsx';

export const ALL_FONTS = [
  { id: 'albert-sans', name: 'Albert Sans', family: "'Albert Sans', sans-serif", pro: false },
  { id: 'belanosima', name: 'Belanosima', family: "'Belanosima', sans-serif", pro: true },
  { id: 'bricolage-grotesque', name: 'Bricolage Grotesque', family: "'Bricolage Grotesque', sans-serif", pro: true },
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif", pro: false },
  { id: 'epilogue', name: 'Epilogue', family: "'Epilogue', sans-serif", pro: false },
  { id: 'ibm-plex-sans', name: 'IBM Plex Sans', family: "'IBM Plex Sans', sans-serif", pro: false },
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", pro: false },
  { id: 'lato', name: 'Lato', family: "'Lato', sans-serif", pro: true },
  { id: 'link-sans', name: 'Link Sans', family: "'Inter', system-ui, -apple-system, sans-serif", pro: false },
  { id: 'm-plus-rounded', name: 'M Plus Rounded', family: "'M PLUS Rounded 1c', sans-serif", pro: true },
  { id: 'manrope', name: 'Manrope', family: "'Manrope', sans-serif", pro: false },
  { id: 'oxanium', name: 'Oxanium', family: "'Oxanium', cursive", pro: false },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", pro: true },
  { id: 'red-hat-display', name: 'Red Hat Display', family: "'Red Hat Display', sans-serif", pro: false },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", pro: true },
  { id: 'rubik', name: 'Rubik', family: "'Rubik', sans-serif", pro: true },
  { id: 'space-grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", pro: true },
  { id: 'syne', name: 'Syne', family: "'Syne', sans-serif", pro: true },
  { id: 'biorhyme', name: 'BioRhyme', family: "'BioRhyme', serif", pro: true },
  { id: 'bitter', name: 'Bitter', family: "'Bitter', serif", pro: true },
  { id: 'caudex', name: 'Caudex', family: "'Caudex', serif", pro: false },
  { id: 'corben', name: 'Corben', family: "'Corben', serif", pro: false },
  { id: 'domine', name: 'Domine', family: "'Domine', serif", pro: false },
  { id: 'hahmlet', name: 'Hahmlet', family: "'Hahmlet', serif", pro: false },
  { id: 'ibm-plex-serif', name: 'IBM Plex Serif', family: "'IBM Plex Serif', serif", pro: true },
  { id: 'lora', name: 'Lora', family: "'Lora', serif", pro: true },
  { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', serif", pro: true },
  { id: 'noto-serif', name: 'Noto Serif', family: "'Noto Serif', serif", pro: true },
  { id: 'old-standard-tt', name: 'Old Standard TT', family: "'Old Standard TT', serif", pro: true },
  { id: 'pt-serif', name: 'PT Serif', family: "'PT Serif', serif", pro: true },
  { id: 'playfair-display', name: 'Playfair Display', family: "'Playfair Display', serif", pro: true },
  { id: 'roboto-serif', name: 'Roboto Serif', family: "'Roboto Serif', serif", pro: false },
  { id: 'roboto-slab', name: 'Roboto Slab', family: "'Roboto Slab', serif", pro: true },
  { id: 'source-serif-pro', name: 'Source Serif Pro', family: "'Source Serif 4', 'Source Serif Pro', serif", pro: true },
  { id: 'ibm-plex-mono', name: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace", pro: true },
  { id: 'space-mono', name: 'Space Mono', family: "'Space Mono', monospace", pro: false },
  { id: 'shantell-sans', name: 'Shantell Sans', family: "'Shantell Sans', cursive", pro: true },
];

export function TextEditor({ current, commitChange, onBack }) {
  const [modalTarget, setModalTarget] = useState(null); // null | 'pageFont' | 'titleFont'
  const [activePicker, setActivePicker] = useState(null); // null | 'pageTextColor' | 'titleColor'

  const currentFontFamily = current.fontFamily || 'Link Sans';
  const currentTitleFont = current.titleFont || 'Manrope';
  const altFontEnabled = current.altFontEnabled === true;

  // Resolve display name for the selector button
  const getFontDisplayName = (val) => {
    const found = ALL_FONTS.find(
      (f) => f.name.toLowerCase() === (val || '').toLowerCase() || f.family === val || f.id === val
    );
    if (found) return found.name;
    if (val === 'Inter' || val === 'system-ui') return 'Link Sans';
    return val || 'Link Sans';
  };

  const handleSelectFont = (font) => {
    if (modalTarget === 'pageFont') {
      commitChange({ fontFamily: font.name });
    } else if (modalTarget === 'titleFont') {
      commitChange({ titleFont: font.name });
    }
    setModalTarget(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 relative">
      {/* 1. Header with back button "< Text" matching Reference Image 0 */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer text-gray-700"
          title="Back to Design"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-[#111111]">Text</h2>
      </div>

      <div className="space-y-5 max-w-[440px]">
        {/* 2. Page font row */}
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-gray-900">Page font</label>
          <button
            type="button"
            onClick={() => setModalTarget('pageFont')}
            className="w-56 sm:w-64 h-11 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center justify-between px-4 cursor-pointer transition-all shadow-2xs group"
          >
            <span className="text-xs sm:text-sm font-medium text-gray-900">
              {getFontDisplayName(currentFontFamily)}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-800 transition-colors" />
          </button>
        </div>

        {/* 3. Page text color row */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-gray-900">Page text color</label>
            <button
              type="button"
              onClick={() =>
                setActivePicker(activePicker === 'pageTextColor' ? null : 'pageTextColor')
              }
              className="w-28 sm:w-32 h-10 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center px-3 py-1.5 gap-2.5 cursor-pointer transition-all shadow-2xs"
            >
              <div
                className="w-5 h-5 rounded-md border border-gray-200 shadow-2xs shrink-0"
                style={{ backgroundColor: current.textColor || '#FFFFFF' }}
              />
              <span className="text-xs font-mono font-medium text-gray-900 tracking-wider">
                {current.textColor || '#FFFFFF'}
              </span>
            </button>
          </div>

          {/* Color Picker Popover for Page Text Color */}
          {activePicker === 'pageTextColor' && (
            <div className="absolute left-0 -top-24 sm:-top-28 z-50">
              <ColorPickerPopover
                color={current.textColor || '#FFFFFF'}
                onChange={(newColor) => commitChange({ textColor: newColor })}
                onClose={() => setActivePicker(null)}
              />
            </div>
          )}
        </div>

        {/* 4. Alternative title font toggle row matching Reference Image 0 */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="text-xs sm:text-sm font-bold text-gray-900 block leading-tight">
              Alternative title font
            </label>
            <span className="text-[11px] text-gray-500 font-normal">
              Matches page font by default
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* iOS Green Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={altFontEnabled}
              onClick={() => commitChange({ altFontEnabled: !altFontEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                altFontEnabled ? 'bg-[#128A3C]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  altFontEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. Title font row (Shown when Alternative title font is enabled) */}
        {altFontEnabled && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-gray-900">Title font</label>
              <button
                type="button"
                onClick={() => setModalTarget('titleFont')}
                className="w-56 sm:w-64 h-11 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center justify-between px-4 cursor-pointer transition-all shadow-2xs group"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {getFontDisplayName(currentTitleFont)}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-800 transition-colors" />
              </button>
            </div>

            {/* 6. Title color row */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-gray-900">Title color</label>
                <button
                  type="button"
                  onClick={() =>
                    setActivePicker(activePicker === 'titleColor' ? null : 'titleColor')
                  }
                  className="w-28 sm:w-32 h-10 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center px-3 py-1.5 gap-2.5 cursor-pointer transition-all shadow-2xs"
                >
                  <div
                    className="w-5 h-5 rounded-md border border-gray-200 shadow-2xs shrink-0"
                    style={{ backgroundColor: current.titleColor || '#FFFFFF' }}
                  />
                  <span className="text-xs font-mono font-medium text-gray-900 tracking-wider">
                    {current.titleColor || '#FFFFFF'}
                  </span>
                </button>
              </div>

              {/* Color Picker Popover for Title Color */}
              {activePicker === 'titleColor' && (
                <div className="absolute left-0 -top-24 sm:-top-28 z-50">
                  <ColorPickerPopover
                    color={current.titleColor || '#FFFFFF'}
                    onChange={(newColor) => commitChange({ titleColor: newColor })}
                    onClose={() => setActivePicker(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Font Selection Modal matching Reference Images 1 & 2 */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-[480px] max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative px-6 py-4 border-b border-gray-100 flex items-center justify-center">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {modalTarget === 'pageFont' ? 'Page font' : 'Title font'}
              </h3>
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="absolute right-4 p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal 2-Column Font Grid matching Image 1 & 2 */}
            <div className="p-4 sm:p-5 overflow-y-auto card-scrollbar max-h-[calc(85vh-65px)]">
              <div className="grid grid-cols-2 gap-3">
                {ALL_FONTS.map((font) => {
                  const activeVal =
                    modalTarget === 'pageFont' ? currentFontFamily : currentTitleFont;
                  const isSelected =
                    activeVal?.toLowerCase() === font.name.toLowerCase() ||
                    activeVal?.toLowerCase() === font.id.toLowerCase() ||
                    activeVal === font.family ||
                    (font.name === 'Link Sans' && (activeVal === 'Inter' || activeVal === 'system-ui'));

                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => handleSelectFont(font)}
                      className={`h-13 rounded-2xl px-3.5 py-2.5 transition-all flex items-center justify-center cursor-pointer border-2 relative select-none ${
                        isSelected
                          ? 'border-black bg-white shadow-xs text-black font-semibold'
                          : 'border-transparent bg-[#F6F6F6] hover:bg-[#ECECEC] text-gray-800'
                      }`}
                    >
                      <span
                        className="truncate text-xs sm:text-sm text-center font-medium"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
