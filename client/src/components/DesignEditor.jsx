import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  RotateCw,
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
      fontFamily: custom.fontFamily || 'Inter',
      textColor: custom.textColor || '#111111',
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
      : current.buttonStyle === 'soft-shadow'
      ? 'Soft shadow'
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

  const stickerOptions = [
    '✨ Verified',
    '🔥 Trending',
    '⚡️ Founder',
    '🚀 New Project',
    '☕️ Coffee Addict',
    '🎧 On Repeat',
    '💡 Design Lead',
    '🌱 Creator',
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row with Undo, Redo, Cancel, Save matching Reference Image */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center">
          {activeSubview && activeSubview !== 'theme' ? (
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
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              historyIndex > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              historyIndex < history.length - 1
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <RotateCw className="w-4 h-4 stroke-[2.5]" />
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
            className="py-1.5 px-5 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
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
                    style={{ background: current.backgroundValue || '#F3F3F1' }}
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

              {/* Stickers */}
              <div
                onClick={() => setActiveSubview('stickers')}
                className="border border-gray-200/90 rounded-[20px] p-3.5 sm:p-4 flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer bg-white group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200/90 flex items-center justify-center shadow-2xs text-gray-700">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">Stickers</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {current.stickers?.length > 0 ? `${current.stickers.length} added` : 'Decorate your page'}
                  </span>
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
                      });
                    }}
                    className={`w-full h-[106px] sm:h-[112px] rounded-[18px] sm:rounded-[20px] p-2.5 flex flex-col justify-between overflow-hidden relative transition-all cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-2 border-black ring-1 ring-black/10'
                        : 'border border-gray-200/90 hover:border-gray-300'
                    }`}
                    style={{ background: pt.theme.backgroundValue }}
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
                      {pt.isPro && (
                        <span className="w-4 h-4 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-[9px] text-white">
                          ⚡
                        </span>
                      )}
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

      {/* VIEW 3: WALLPAPER SUBVIEW */}
      {activeSubview === 'wallpaper' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Wallpaper Type selector */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
            {['solid', 'gradient', 'image'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (type === 'solid') {
                    commitChange({ backgroundType: 'solid', backgroundValue: '#F3F3F1' });
                  } else if (type === 'gradient') {
                    commitChange({
                      backgroundType: 'gradient',
                      backgroundValue: 'linear-gradient(135deg, #7033FF 0%, #9F7AEA 100%)',
                    });
                  } else if (type === 'image') {
                    wallpaperInputRef.current?.click();
                  }
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  current.backgroundType === type ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
                }`}
              >
                {type === 'solid' ? 'Fill (Solid)' : type}
              </button>
            ))}
          </div>

          {/* Solid Color Palette */}
          {current.backgroundType === 'solid' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-900 block">Preset Fill Colors</label>
              <div className="grid grid-cols-5 gap-2.5">
                {solidColorPresets.map((preset) => {
                  const isSel = current.backgroundValue?.toLowerCase() === preset.value.toLowerCase();
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => commitChange({ backgroundValue: preset.value })}
                      className={`h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs relative ${
                        isSel ? 'border-black ring-2 ring-black' : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    >
                      {isSel && (
                        <span className={`text-xs font-bold ${preset.value === '#0B0B0D' ? 'text-white' : 'text-black'}`}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={current.backgroundValue?.startsWith('#') ? current.backgroundValue : '#F3F3F1'}
                  onChange={(e) => commitChange({ backgroundValue: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={current.backgroundValue || ''}
                  onChange={(e) => commitChange({ backgroundValue: e.target.value })}
                  placeholder="#F3F3F1"
                  className="py-1.5 px-3 border border-gray-200 rounded-xl text-xs font-mono font-medium text-gray-800 flex-1"
                />
              </div>
            </div>
          )}

          {/* Gradient Palette */}
          {current.backgroundType === 'gradient' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-900 block">Gradient Presets</label>
              <div className="grid grid-cols-2 gap-2.5">
                {gradientPresets.map((grad) => {
                  const isSel = current.backgroundValue === grad.value;
                  return (
                    <button
                      key={grad.label}
                      type="button"
                      onClick={() => commitChange({ backgroundValue: grad.value })}
                      className={`h-16 rounded-xl border flex items-center justify-center text-white text-xs font-bold p-2 text-center transition-all cursor-pointer shadow-xs relative ${
                        isSel ? 'border-black ring-2 ring-black' : 'border-gray-200 hover:scale-[1.02]'
                      }`}
                      style={{ background: grad.value }}
                    >
                      <span>{grad.label}</span>
                      {isSel && <div className="absolute top-1.5 right-1.5 text-xs">✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <input
              type="file"
              ref={wallpaperInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleWallpaperUpload}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => wallpaperInputRef.current?.click()}
                className="py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Background Image
              </button>
              {current.backgroundType === 'image' && (
                <button
                  type="button"
                  onClick={() => commitChange({ backgroundType: 'solid', backgroundValue: '#F3F3F1' })}
                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: BUTTONS SUBVIEW */}
      {activeSubview === 'buttons' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Button Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 block">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fill', label: 'Solid' },
                { id: 'outline', label: 'Outline' },
                { id: 'soft-shadow', label: 'Soft Shadow' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => commitChange({ buttonStyle: style.id })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    current.buttonStyle === style.id
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Radius */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 block">Corner Radius</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { radius: 9999, label: 'Pill' },
                { radius: 14, label: 'Rounded' },
                { radius: 4, label: 'Square' },
              ].map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => commitChange({ buttonRadius: r.radius })}
                  className={`py-2 px-3 border text-xs font-bold transition-all cursor-pointer ${
                    current.buttonRadius === r.radius
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                  }`}
                  style={{ borderRadius: `${Math.min(r.radius, 14)}px` }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Colors */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-900 block mb-1.5">Button Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current.buttonColor || '#FFFFFF'}
                  onChange={(e) => commitChange({ buttonColor: e.target.value })}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={current.buttonColor || '#FFFFFF'}
                  onChange={(e) => commitChange({ buttonColor: e.target.value })}
                  className="py-1.5 px-2.5 border border-gray-200 rounded-xl text-xs font-mono w-24"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-900 block mb-1.5">Text & Icon Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current.buttonTextColor || '#111111'}
                  onChange={(e) => commitChange({ buttonTextColor: e.target.value })}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={current.buttonTextColor || '#111111'}
                  onChange={(e) => commitChange({ buttonTextColor: e.target.value })}
                  className="py-1.5 px-2.5 border border-gray-200 rounded-xl text-xs font-mono w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: TEXT & FONTS SUBVIEW */}
      {activeSubview === 'text' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900 block">Font Family</label>
            <div className="space-y-2">
              {fontPresets.map((font) => {
                const isSel = current.fontFamily === font.value;
                return (
                  <button
                    key={font.label}
                    type="button"
                    onClick={() => commitChange({ fontFamily: font.value })}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSel ? 'border-black bg-white shadow-xs' : 'border-gray-200/90 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-sm">
                        {font.sample}
                      </div>
                      <span className="text-xs font-bold text-gray-900" style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </div>
                    {isSel && <div className="text-xs font-bold text-black">✓</div>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold text-gray-900 block mb-1.5">Profile Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={current.textColor || '#111111'}
                onChange={(e) => commitChange({ textColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
              />
              <input
                type="text"
                value={current.textColor || '#111111'}
                onChange={(e) => commitChange({ textColor: e.target.value })}
                className="py-1.5 px-2.5 border border-gray-200 rounded-xl text-xs font-mono w-28"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: COLORS SUBVIEW */}
      {activeSubview === 'colors' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <p className="text-xs text-gray-500 font-medium">
            Fine-tune palette colors across the entire profile page.
          </p>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-2xl bg-white">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Page Background</span>
                <span className="text-[11px] text-gray-400 font-mono">{current.backgroundValue}</span>
              </div>
              <input
                type="color"
                value={current.backgroundValue?.startsWith('#') ? current.backgroundValue : '#F3F3F1'}
                onChange={(e) => commitChange({ backgroundType: 'solid', backgroundValue: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-2xl bg-white">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Button Fill</span>
                <span className="text-[11px] text-gray-400 font-mono">{current.buttonColor || '#FFFFFF'}</span>
              </div>
              <input
                type="color"
                value={current.buttonColor || '#FFFFFF'}
                onChange={(e) => commitChange({ buttonColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-2xl bg-white">
              <div>
                <span className="text-xs font-bold text-gray-900 block">Card Text & Icons</span>
                <span className="text-[11px] text-gray-400 font-mono">{current.buttonTextColor || '#111111'}</span>
              </div>
              <input
                type="color"
                value={current.buttonTextColor || '#111111'}
                onChange={(e) => commitChange({ buttonTextColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 7: STICKERS SUBVIEW */}
      {activeSubview === 'stickers' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <p className="text-xs text-gray-500 font-medium">
            Add decorative profile tags or badge stickers to personalize your card.
          </p>

          <div className="flex flex-wrap gap-2">
            {stickerOptions.map((stk) => {
              const activeList = current.stickers || [];
              const isAdded = activeList.includes(stk);
              return (
                <button
                  key={stk}
                  type="button"
                  onClick={() => {
                    const nextStickers = isAdded
                      ? activeList.filter((s) => s !== stk)
                      : [...activeList, stk];
                    commitChange({ stickers: nextStickers });
                  }}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isAdded
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{stk}</span>
                  {isAdded && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
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
