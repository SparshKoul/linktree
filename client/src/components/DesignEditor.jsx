import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Trash2,
  Upload,
  Sparkles,
  Shuffle,
  Smile,
  Type,
  Square,
  Paintbrush,
  CheckCircle2,
} from 'lucide-react';
import { PRESET_THEMES } from '../constants/themes.js';
import { WallpaperEditor } from './WallpaperEditor.jsx';
import { ButtonEditor } from './ButtonEditor.jsx';
import { TextEditor } from './TextEditor.jsx';
import { ColorsEditor } from './ColorsEditor.jsx';

export function DesignEditor({ currentTree, onUpdateTree }) {
  const [activeSubview, setActiveSubview] = useState(null); // null | 'theme' | 'wallpaper' | 'buttons' | 'text' | 'colors' | 'stickers' | 'footer'
  const [themeTab, setThemeTab] = useState('customizable'); // 'customizable' | 'curated'
  const [savedToast, setSavedToast] = useState(false);
  const wallpaperInputRef = useRef(null);

  // Snapshot of tree design state for undo / redo / cancel
  const extractSnapshot = (tree) => {
    const custom = tree?.customTheme || {};
    return {
      themeId: tree?.themeId || 'classic-light',
      backgroundType: custom.backgroundType || 'solid',
      backgroundValue: custom.backgroundValue || '#F3F3F1',
      buttonStyle: custom.buttonStyle || 'fill',
      buttonColor: custom.buttonColor || '#FFFFFF',
      buttonTextColor: custom.buttonTextColor || '#111111',
      buttonRadius: custom.buttonRadius ?? 9999,
      fontFamily: custom.fontFamily || tree?.fontFamily || 'Inter',
      textColor: custom.textColor || tree?.textColor || '#111111',
      altFontEnabled: custom.altFontEnabled ?? tree?.altFontEnabled ?? false,
      titleFont: custom.titleFont || tree?.titleFont || 'Manrope',
      titleColor: custom.titleColor || tree?.titleColor || '#111111',
      footerEnabled: custom.footerEnabled !== false,
      footerText: custom.footerText || 'Get your own Linktree',
      stickers: custom.stickers || [],
      ...custom,
    };
  };

  const initialSnapshot = useRef(extractSnapshot(currentTree));
  const [history, setHistory] = useState([initialSnapshot.current]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const current = history[historyIndex] || initialSnapshot.current;

  // Re-sync if switching tree id
  useEffect(() => {
    if (currentTree) {
      const snap = extractSnapshot(currentTree);
      initialSnapshot.current = snap;
      setHistory([snap]);
      setHistoryIndex(0);
    }
  }, [currentTree?.id]);

  const commitChange = (patch) => {
    const updated = { ...current, ...patch };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Apply live to tree state
    const customThemeUpdate = {
      ...(currentTree?.customTheme || {}),
      ...updated,
    };

    onUpdateTree({
      ...(patch.themeId ? { themeId: patch.themeId } : {}),
      customTheme: customThemeUpdate,
      ...(patch.fontFamily ? { fontFamily: patch.fontFamily } : {}),
      ...(patch.textColor ? { textColor: patch.textColor } : {}),
      ...(patch.altFontEnabled !== undefined ? { altFontEnabled: patch.altFontEnabled } : {}),
      ...(patch.titleFont ? { titleFont: patch.titleFont } : {}),
      ...(patch.titleColor ? { titleColor: patch.titleColor } : {}),
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      const target = history[nextIdx];
      onUpdateTree({
        themeId: target.themeId,
        customTheme: { ...(currentTree?.customTheme || {}), ...target },
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const target = history[nextIdx];
      onUpdateTree({
        themeId: target.themeId,
        customTheme: { ...(currentTree?.customTheme || {}), ...target },
      });
    }
  };

  const handleCancel = () => {
    const snap = initialSnapshot.current;
    setHistory([snap]);
    setHistoryIndex(0);
    onUpdateTree({
      themeId: snap.themeId,
      customTheme: { ...(currentTree?.customTheme || {}), ...snap },
    });
    setActiveSubview(null);
  };

  const handleSave = () => {
    onUpdateTree({
      themeId: current.themeId,
      customTheme: { ...(currentTree?.customTheme || {}), ...current },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleShuffleTheme = () => {
    const list = PRESET_THEMES.filter((p) => p.id !== 'classic-light');
    const randomTheme = list[Math.floor(Math.random() * list.length)];
    if (randomTheme) {
      commitChange({
        themeId: randomTheme.id,
        backgroundType: randomTheme.theme.backgroundType,
        backgroundValue: randomTheme.theme.backgroundValue,
        buttonStyle: randomTheme.theme.buttonStyle,
        buttonColor: randomTheme.theme.buttonColor,
        buttonTextColor: randomTheme.theme.buttonTextColor,
        buttonRadius: randomTheme.theme.buttonRadius,
        fontFamily: randomTheme.theme.fontFamily,
        textColor: randomTheme.theme.textColor,
      });
    }
  };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl === 'string') {
        const bgVal = `url("${rawDataUrl}") center / cover no-repeat`;
        commitChange({ backgroundType: 'image', backgroundValue: bgVal });

        // Background CDN upload to Supabase Storage
        fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ file: rawDataUrl, filename: file.name, folder: 'wallpapers' }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.url) {
              const cdnBg = `url("${data.url}") center / cover no-repeat`;
              commitChange({ backgroundType: 'image', backgroundValue: cdnBg });
            }
          })
          .catch(() => {});
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Find active theme display name
  const currentThemeObj =
    PRESET_THEMES.find((t) => t.id === current.themeId) ||
    PRESET_THEMES.find((t) => t.id === 'classic-light');
  const themeDisplayName = currentThemeObj?.id === 'classic-light' ? 'Air' : currentThemeObj?.name || 'Air';

  // Derived label values matching Reference Image
  const wallpaperLabel =
    current.backgroundType === 'image'
      ? 'Image'
      : current.backgroundType === 'gradient'
      ? 'Gradient'
      : 'Fill';

  const buttonStyleLabel =
    current.buttonStyle === 'outline'
      ? 'Outline'
      : current.buttonStyle === 'glass'
      ? 'Glass'
      : 'Solid';

  const textFontLabel =
    current.fontFamily === 'Inter' ? 'Link Sans' : current.fontFamily || 'Link Sans';

  // Preset Colors for Fast Picking
  const solidColorPresets = [
    { label: 'Air Off-White', value: '#F3F3F1' },
    { label: 'Pure White', value: '#FFFFFF' },
    { label: 'Soft Slate', value: '#EEF1F6' },
    { label: 'Midnight Black', value: '#0B0B0D' },
    { label: 'Warm Cream', value: '#FFFBEB' },
    { label: 'Lavender Mist', value: '#F5F3FF' },
    { label: 'Blush Pink', value: '#FDF2F8' },
    { label: 'Sage Mint', value: '#F0FDF4' },
    { label: 'Charcoal', value: '#1E1E24' },
    { label: 'Deep Forest', value: '#064E3B' },
  ];

  const gradientPresets = [
    { label: 'Royal Violet', value: 'linear-gradient(135deg, #7033FF 0%, #9F7AEA 100%)' },
    { label: 'Sunset Glow', value: 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)' },
    { label: 'Ocean Cyan', value: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)' },
    { label: 'Berry Blast', value: 'linear-gradient(135deg, #FF007A 0%, #7928CA 100%)' },
    { label: 'Emerald Breeze', value: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' },
    { label: 'Midnight Velvet', value: 'linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)' },
  ];

  const fontPresets = [
    { label: 'Link Sans', value: 'Inter', sample: 'Aa' },
    { label: 'Poppins', value: 'Poppins', sample: 'Aa' },
    { label: 'Space Grotesk', value: 'Space Grotesk', sample: 'Aa' },
    { label: 'Playfair Display', value: 'Playfair Display', sample: 'Aa' },
    { label: 'JetBrains Mono', value: 'monospace', sample: 'Aa' },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row with Undo, Redo, Cancel, Save matching Reference Image */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center">
          {activeSubview &&
          activeSubview !== 'theme' &&
          activeSubview !== 'buttons' &&
          activeSubview !== 'text' &&
          activeSubview !== 'colors' ? (
            <button
              onClick={() => setActiveSubview(null)}
              className="flex items-center gap-2 hover:text-gray-600 transition-colors cursor-pointer text-xl font-bold text-[#111111]"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              <span className="capitalize">{activeSubview}</span>
            </button>
          ) : !activeSubview ? (
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111]">Design</h1>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              historyIndex > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              historyIndex < history.length - 1
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={handleCancel}
            className="py-1.5 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            className="py-1.5 px-4 sm:px-5 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            {savedToast ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: MAIN DESIGN MENU (Exactly matches Reference Image) */}
      {!activeSubview && (
        <div className="space-y-6">
          {/* 1. Theme Card Row */}
          <div
            onClick={() => setActiveSubview('theme')}
            className="border border-gray-200/90 rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
          >
            <div className="flex items-center gap-3.5">
              {/* Theme Thumbnail Preview Box */}
              <div className="w-10 h-11 rounded-xl bg-[#F3F3F1] border border-gray-200/90 flex flex-col p-1.5 justify-between shadow-2xs group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-[10px] text-gray-800 leading-none">Aa</span>
                <div className="w-full h-2 rounded bg-white shadow-2xs border border-gray-100" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Theme</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">{themeDisplayName}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* 2. Customize Section */}
          <div>
            <h2 className="text-xs font-bold text-gray-900 tracking-tight mb-2.5">Customize</h2>

            <div className="space-y-2">
              {/* Wallpaper */}
              <div
                onClick={() => setActiveSubview('wallpaper')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-9 h-9 rounded-xl border border-gray-200/90 flex items-center justify-center shadow-2xs overflow-hidden"
                    style={{
                      background: current.backgroundValue || '#F3F3F1',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <span className="text-[13px] font-semibold text-gray-900">Wallpaper</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{wallpaperLabel}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Buttons */}
              <div
                onClick={() => setActiveSubview('buttons')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200/90 flex items-center justify-center p-1.5 shadow-2xs">
                    <div
                      className="w-full h-4 rounded-full border border-gray-300 bg-white"
                      style={{
                        borderRadius: `${Math.min(current.buttonRadius || 9999, 14)}px`,
                        backgroundColor: current.buttonColor || '#FFFFFF',
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">Buttons</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{buttonStyleLabel}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Text */}
              <div
                onClick={() => setActiveSubview('text')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200/90 flex items-center justify-center shadow-2xs">
                    <span className="font-extrabold text-xs text-gray-800">Aa</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">Text</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">{textFontLabel}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Colors */}
              <div
                onClick={() => setActiveSubview('colors')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  {/* Half white / half black split circle matching reference image */}
                  <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden flex shadow-2xs">
                    <div className="w-1/2 h-full bg-white" />
                    <div className="w-1/2 h-full bg-[#111111]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">Colors</span>
                </div>

                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Footer */}
              <div
                onClick={() => setActiveSubview('footer')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200/90 flex items-center justify-center shadow-2xs text-gray-800 font-extrabold text-sm">
                    ✱
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">Footer</span>
                </div>

                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: THEMES SUBVIEW (Matching Reference Images 0 & 1) */}
      {activeSubview === 'theme' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Subview Header with Round Back Arrow and Shuffle Button */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveSubview(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Back to Design"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 stroke-[2.5]" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-[#111111]">Theme</h2>
            </div>

            <button
              type="button"
              onClick={handleShuffleTheme}
              className="py-1 px-3.5 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 text-xs font-semibold text-gray-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-gray-600" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Customizable vs Curated Tabs */}
          <div className="flex items-center gap-6 border-b border-gray-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setThemeTab('customizable')}
              className={`pb-2.5 transition-colors cursor-pointer relative ${
                themeTab === 'customizable'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Customizable
            </button>
            <button
              type="button"
              onClick={() => setThemeTab('curated')}
              className={`pb-2.5 transition-colors cursor-pointer relative ${
                themeTab === 'curated'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Curated
            </button>
          </div>

          {/* Curated Collaboration Info Banner matching Reference Image */}
          {themeTab === 'curated' && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-[18px] bg-[#EEF7FE] border border-[#BFDBFE] text-[#0369A1] text-xs font-medium">
              <div className="w-4 h-4 rounded-full border border-[#0284C7] flex items-center justify-center text-[10px] font-bold shrink-0 text-[#0284C7]">
                i
              </div>
              <span className="leading-snug">
                Curated themes are made in collaboration with creators and can't be customized.
              </span>
            </div>
          )}

          {/* 5-Column Theme Grid Matching Linktree Screenshot */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
            {themeTab === 'customizable' && (
              /* Custom theme card */
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActiveSubview('wallpaper')}
                  className="w-full h-[106px] sm:h-[112px] rounded-[18px] sm:rounded-[20px] bg-[#EEEEEE] border border-gray-200/80 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-all shadow-2xs group"
                >
                  <Paintbrush className="w-5 h-5 text-gray-600 stroke-[1.5] group-hover:scale-110 transition-transform" />
                </button>
                <span className="text-[11px] font-medium text-gray-700 text-center mt-1.5">Custom</span>
              </div>
            )}

            {PRESET_THEMES.filter(
              (pt) =>
                pt.id !== 'classic-light' &&
                (pt.category === themeTab || (themeTab === 'customizable' && !pt.category))
            ).map((pt) => {
              const isSelected =
                current.themeId === pt.id || (pt.id === 'air' && current.themeId === 'classic-light');
              return (
                <div key={pt.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      commitChange({
                        themeId: pt.id,
                        backgroundType: pt.theme.backgroundType,
                        backgroundValue: pt.theme.backgroundValue,
                        buttonStyle: pt.theme.buttonStyle,
                        buttonColor: pt.theme.buttonColor,
                        buttonTextColor: pt.theme.buttonTextColor,
                        buttonRadius: pt.theme.buttonRadius,
                        fontFamily: pt.theme.fontFamily,
                        textColor: pt.theme.textColor,
                        footerText: pt.theme.footerText || 'Get your own Linktree',
                      });
                    }}
                    className={`w-full h-[106px] sm:h-[112px] rounded-[18px] sm:rounded-[20px] p-2.5 flex flex-col justify-between overflow-hidden relative transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-2 border-black ring-1 ring-black/10'
                        : 'border border-gray-200/90 hover:border-gray-300'
                    }`}
                    style={{
                      background: pt.theme.backgroundValue,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Top row: Typography sample & Pro badge */}
                    <div className="w-full flex items-center justify-between">
                      <span
                        className="font-bold text-xs sm:text-sm tracking-tight leading-none"
                        style={{
                          color: pt.theme.textColor || '#111111',
                          fontFamily: pt.theme.fontFamily || 'Inter',
                        }}
                      >
                        Aa
                      </span>
                    </div>

                    {/* Bottom row: Pill button preview */}
                    <div
                      className="w-full h-4 sm:h-5 rounded-full flex items-center justify-center shadow-2xs"
                      style={{
                        backgroundColor: pt.theme.buttonColor,
                        color: pt.theme.buttonTextColor,
                        borderRadius: `${Math.min(pt.theme.buttonRadius || 9999, 12)}px`,
                        border:
                          pt.theme.buttonStyle === 'outline'
                            ? `1px solid ${pt.theme.buttonTextColor}`
                            : 'none',
                      }}
                    />
                  </button>
                  <span className="text-[11px] font-medium text-gray-700 text-center mt-1.5">{pt.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: WALLPAPER SUBVIEW (Matching Linktree Screenshots) */}
      {activeSubview === 'wallpaper' && (
        <WallpaperEditor current={current} commitChange={commitChange} />
      )}

      {/* VIEW 4: BUTTONS SUBVIEW (Matching Reference Images 0, 1 & 2) */}
      {activeSubview === 'buttons' && (
        <ButtonEditor
          current={current}
          commitChange={commitChange}
          onBack={() => setActiveSubview(null)}
        />
      )}

      {/* VIEW 5: TEXT & FONTS SUBVIEW (Matching Reference Images 0, 1 & 2) */}
      {activeSubview === 'text' && (
        <TextEditor
          current={current}
          commitChange={commitChange}
          onBack={() => setActiveSubview(null)}
        />
      )}

      {/* VIEW 6: COLORS SUBVIEW (Matching Reference Image) */}
      {activeSubview === 'colors' && (
        <ColorsEditor
          current={current}
          commitChange={commitChange}
          onBack={() => setActiveSubview(null)}
        />
      )}

      {/* VIEW 8: FOOTER SUBVIEW */}
      {activeSubview === 'footer' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Show Linktree footer badge</span>
              <span className="text-[11px] text-gray-500">
                Display the clean "Get your own Linktree" footer badge at the bottom of the page.
              </span>
            </div>
            <button
              type="button"
              onClick={() => commitChange({ footerEnabled: !current.footerEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                current.footerEnabled ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.5 ${
                  current.footerEnabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
