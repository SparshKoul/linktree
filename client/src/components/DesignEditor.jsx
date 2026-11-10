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
  X,
  User,
  Zap,
  Share2,
  Plus,
} from 'lucide-react';
import { CardRenderer } from '../cards/CardRenderer.jsx';
import { PRESET_THEMES } from '../constants/themes.js';
import { WallpaperEditor } from './WallpaperEditor.jsx';
import { ButtonEditor } from './ButtonEditor.jsx';
import { TextEditor } from './TextEditor.jsx';
import { ColorsEditor } from './ColorsEditor.jsx';

export function DesignEditor({ currentTree, onUpdateTree, onBack, onOpenHeader, initialSubview = null }) {
  const [activeSubview, setActiveSubview] = useState(initialSubview); // null | 'theme' | 'header' | 'wallpaper' | 'buttons' | 'text' | 'colors' | 'stickers' | 'footer'
  const [themeTab, setThemeTab] = useState('customizable'); // 'customizable' | 'curated'
  const [savedToast, setSavedToast] = useState(false);
  const wallpaperInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Sync initialSubview when prop updates
  useEffect(() => {
    if (initialSubview !== undefined) {
      setActiveSubview(initialSubview);
    }
  }, [initialSubview]);

  const previewScrollRef = useRef(null);

  useEffect(() => {
    if (activeSubview && previewScrollRef.current) {
      previewScrollRef.current.scrollTop = 0;
    }
  }, [activeSubview]);

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
      footerEnabled: tree?.footerEnabled !== undefined ? tree.footerEnabled : custom.footerEnabled !== false,
      footerText: custom.footerText || 'Get your own IndiaTaps',
      stickers: custom.stickers || [],
      headerLayout: tree?.headerLayout || custom.headerLayout || 'classic',
      avatarUrl: tree?.avatarUrl || custom.avatarUrl || null,
      bannerUrl: tree?.bannerUrl || custom.bannerUrl || null,
      heroUrl: tree?.heroUrl || custom.heroUrl || null,
      title: tree?.title ?? `@${tree?.slug || 'riyast'}`,
      bio: tree?.bio ?? '',
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
      ...(patch.footerEnabled !== undefined ? { footerEnabled: patch.footerEnabled } : {}),
      ...(patch.fontFamily ? { fontFamily: patch.fontFamily } : {}),
      ...(patch.textColor ? { textColor: patch.textColor } : {}),
      ...(patch.altFontEnabled !== undefined ? { altFontEnabled: patch.altFontEnabled } : {}),
      ...(patch.titleFont ? { titleFont: patch.titleFont } : {}),
      ...(patch.titleColor ? { titleColor: patch.titleColor } : {}),
      ...(patch.headerLayout ? { headerLayout: patch.headerLayout } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl } : {}),
      ...(patch.bannerUrl !== undefined ? { bannerUrl: patch.bannerUrl } : {}),
      ...(patch.heroUrl !== undefined ? { heroUrl: patch.heroUrl } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
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
        headerLayout: target.headerLayout,
        avatarUrl: target.avatarUrl,
        bannerUrl: target.bannerUrl,
        heroUrl: target.heroUrl,
        title: target.title,
        bio: target.bio,
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
        headerLayout: target.headerLayout,
        avatarUrl: target.avatarUrl,
        bannerUrl: target.bannerUrl,
        heroUrl: target.heroUrl,
        title: target.title,
        bio: target.bio,
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
      headerLayout: snap.headerLayout,
      avatarUrl: snap.avatarUrl,
      bannerUrl: snap.bannerUrl,
      heroUrl: snap.heroUrl,
      title: snap.title,
      bio: snap.bio,
    });
    setActiveSubview(null);
  };

  const handleSave = () => {
    onUpdateTree({
      themeId: current.themeId,
      customTheme: { ...(currentTree?.customTheme || {}), ...current },
      headerLayout: current.headerLayout,
      avatarUrl: current.avatarUrl,
      bannerUrl: current.bannerUrl,
      heroUrl: current.heroUrl,
      title: current.title,
      bio: current.bio,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl === 'string') {
        commitChange({ avatarUrl: rawDataUrl });
        onUpdateTree({ avatarUrl: rawDataUrl });

        // Background CDN upload to Supabase Storage
        fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ file: rawDataUrl, filename: file.name, folder: 'avatars' }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.url) {
              commitChange({ avatarUrl: data.url });
              onUpdateTree({ avatarUrl: data.url });
            }
          })
          .catch(() => {});
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyPresetTheme = (themeObj) => {
    commitChange({
      themeId: themeObj.id,
      backgroundType: themeObj.theme.backgroundType,
      backgroundValue: themeObj.theme.backgroundValue,
      backgroundColor: themeObj.theme.backgroundType === 'solid' ? themeObj.theme.backgroundValue : null,
      backgroundImageUrl: null,
      wallpaperVideoUrl: null,
      wallpaperStyle: themeObj.theme.backgroundType === 'solid' ? 'fill' : null,
      effect: 'none',
      tint: 0,
      noise: false,
      patternType: null,
      buttonStyle: themeObj.theme.buttonStyle,
      buttonColor: themeObj.theme.buttonColor,
      buttonTextColor: themeObj.theme.buttonTextColor,
      buttonRadius: themeObj.theme.buttonRadius,
      fontFamily: themeObj.theme.fontFamily,
      textColor: themeObj.theme.textColor,
      footerText: themeObj.theme.footerText || 'Get your own IndiaTaps',
    });
  };

  const handleShuffleTheme = () => {
    const list = PRESET_THEMES.filter((p) => p.id !== 'classic-light');
    const randomTheme = list[Math.floor(Math.random() * list.length)];
    if (randomTheme) {
      applyPresetTheme(randomTheme);
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

  const previewTheme = {
    backgroundType: current.backgroundType,
    backgroundValue: current.backgroundValue,
    buttonStyle: current.buttonStyle,
    buttonColor: current.buttonColor,
    buttonTextColor: current.buttonTextColor,
    buttonRadius: current.buttonRadius,
    fontFamily: current.fontFamily,
    textColor: current.textColor,
    footerEnabled: current.footerEnabled,
    footerText: current.footerText,
  };

  const isLogo = (currentTree?.titleStyle || currentTree?.customTheme?.titleStyle) === 'logo';
  const logoUrl = currentTree?.logoUrl || currentTree?.customTheme?.logoUrl;
  const titleText = currentTree?.title || `@${currentTree?.slug || 'riyast'}`;
  const bioText = currentTree?.bio || '';
  const titleFont = current.altFontEnabled ? (current.titleFont || 'Manrope') : (current.fontFamily || 'inherit');
  const titleColor = current.altFontEnabled ? (current.titleColor || current.textColor || '#FFFFFF') : (current.textColor || '#FFFFFF');
  const visibleCards = (currentTree?.cards || []).filter((c) => c.visible !== false);

  const currentHeaderLayout = current.headerLayout || currentTree?.headerLayout || currentTree?.customTheme?.headerLayout || 'classic';
  const demoGirlImg = current.avatarUrl || currentTree?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="w-full h-full flex flex-col">
      {/* 1. DESKTOP VIEW (hidden on mobile, 100% UNTOUCHED desktop layout) */}
      <div className="hidden lg:block w-full space-y-6 animate-in fade-in duration-200">
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
                    onClick={() => applyPresetTheme(pt)}
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
              <span className="text-xs font-bold text-gray-900 block">Show IndiaTaps footer badge</span>
              <span className="text-[11px] text-gray-500">
                Display the clean "Get your own IndiaTaps" footer badge at the bottom of the page.
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

      {/* 2. MOBILE VIEW (Visible ONLY on mobile screens < lg, matches user screenshots) */}
      <div className="lg:hidden fixed inset-0 z-40 flex flex-col h-[100dvh] w-full bg-white select-none overflow-hidden">
        {/* Mobile Top Action Bar */}
        <div className="h-13 bg-white px-3 flex items-center justify-between border-b border-gray-200 shrink-0 z-20 shadow-2xs">
          {/* Back button returns to Content rail */}
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            title="Back to Content"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex items-center gap-1.5">
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
                historyIndex < history.length - 1 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <Redo2 className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={handleCancel}
              className="py-1 px-3 rounded-full border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* ⚡ Save Purple Pill Button */}
            <button
              type="button"
              onClick={handleSave}
              className="py-1 px-3.5 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{savedToast ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Center Mobile Phone Preview Area */}
        <div
          className={`flex-1 flex bg-white ${
            activeSubview ? 'items-start justify-center pt-2 max-h-[46dvh] px-2' : 'items-stretch p-0'
          } overflow-hidden relative transition-all duration-300`}
        >
          <div
            className={`transition-all duration-300 select-none ${
              activeSubview
                ? 'w-[410px] h-[820px] origin-top scale-[0.45] sm:scale-[0.5] rounded-[48px] border-[6px] border-[#1C1C1E] shadow-2xl shrink-0 -mb-[430px]'
                : 'w-full h-full max-w-[440px] rounded-none border-0 shadow-none mx-auto'
            } relative overflow-hidden flex flex-col`}
            style={{
              background: current.backgroundValue || current.backgroundColor || '#111111',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: current.textColor || '#FFFFFF',
              fontFamily: current.fontFamily || "'Inter', sans-serif",
            }}
          >
            {/* Top iOS Frame Bar */}
            <div className="px-5 pt-4 pb-1 flex items-center justify-between text-xs shrink-0 z-10" style={{ color: current.textColor || '#FFFFFF' }}>
              <span className="font-black text-base text-white select-none">✱</span>
              <button
                type="button"
                onClick={handleSave}
                className="p-1 text-white hover:opacity-80 transition-opacity cursor-pointer"
                title="Share"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* Scroll Area */}
            <div
              ref={previewScrollRef}
              className="flex-1 overflow-y-auto px-4 sm:px-5 py-2 flex flex-col items-center no-scrollbar [&::-webkit-scrollbar]:hidden"
            >
              <div className="w-full max-w-[440px] flex flex-col items-center flex-1 pt-2 sm:pt-3">
                {/* Header Layout Rendering */}
                {currentHeaderLayout === 'hero' ? (
                  <div className="w-full h-44 sm:h-48 rounded-2xl overflow-hidden relative shadow-xs bg-rose-600 mb-2 shrink-0">
                    <img src={current.heroUrl || currentTree?.heroUrl || current.avatarUrl || currentTree?.avatarUrl || demoGirlImg} alt="Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ) : currentHeaderLayout === 'banner' ? (
                  <div className="w-full flex flex-col items-center mb-2 shrink-0">
                    <div className="w-full h-28 sm:h-32 rounded-2xl overflow-hidden relative shadow-xs bg-gradient-to-r from-[#FF007A] via-[#C026D3] to-[#7928CA] shrink-0">
                      {current.bannerUrl || currentTree?.bannerUrl ? (
                        <img src={current.bannerUrl || currentTree.bannerUrl} alt="Banner" className="w-full h-full object-cover object-center" />
                      ) : (
                        <div className="w-full h-full opacity-90 bg-gradient-to-r from-[#FF007A] via-[#A855F7] to-[#7928CA]" />
                      )}
                    </div>
                    <div className="-mt-10 mb-2 relative ring-4 ring-white rounded-full shadow-md w-20 h-20 aspect-square shrink-0 overflow-hidden bg-white flex items-center justify-center z-10">
                      {current.avatarUrl || currentTree?.avatarUrl ? (
                        <img src={current.avatarUrl || currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-center" />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                ) : currentHeaderLayout === 'cutout' ? (
                  <div className="w-24 h-28 rounded-t-full overflow-hidden filter drop-shadow-xs mb-2 shrink-0">
                    <img src={current.avatarUrl || currentTree?.avatarUrl || demoGirlImg} alt="Cutout" className="w-full h-full object-cover" />
                  </div>
                ) : currentHeaderLayout === 'shape' ? (
                  <div className="w-24 h-20 relative flex items-center justify-center overflow-hidden mb-2 shrink-0 shadow-2xs" style={{ clipPath: 'url(#linktree-organic-shape)' }}>
                    <img src={current.avatarUrl || currentTree?.avatarUrl || demoGirlImg} alt="Shape" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  /* Classic Avatar matching Image */
                  <div className="w-32 h-32 sm:w-36 sm:h-36 aspect-square rounded-full bg-[#B5B9BE] flex items-center justify-center overflow-hidden mt-10 sm:mt-12 mb-4 shadow-lg ring-1 ring-white/15 shrink-0">
                    {current.avatarUrl || currentTree?.avatarUrl ? (
                      <img src={current.avatarUrl || currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-center" />
                    ) : (
                      <User className="w-18 h-18 text-white" />
                    )}
                  </div>
                )}

                {/* Title */}
                {isLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-12 max-w-[220px] object-contain mt-2.5 mb-1.5" />
                ) : (
                  <h2
                    className="font-black text-[28px] sm:text-[32px] leading-tight text-center tracking-tight"
                    style={{
                      color: titleColor,
                      fontFamily: titleFont !== 'inherit' ? `'${titleFont}', sans-serif` : 'inherit',
                    }}
                  >
                    {current.title ?? titleText}
                  </h2>
                )}

                {/* Bio */}
                {(current.bio ?? bioText) && (
                  <p
                    className="text-sm sm:text-[15px] font-medium leading-relaxed max-w-[280px] text-gray-300 mt-1 mb-4 text-center"
                    style={{ color: current.textColor ? `${current.textColor}cc` : '#D1D5DB' }}
                  >
                    {current.bio ?? bioText}
                  </p>
                )}

                {/* Links List - using CardRenderer */}
                <div className="w-full space-y-3.5 my-3 flex-1 px-1">
                  {visibleCards.map((card) => (
                    <CardRenderer key={card.id} card={card} theme={previewTheme} isPreview />
                  ))}
                </div>

                {/* Footer */}
                {current.footerEnabled !== false && (
                  <div className="mt-auto pt-6 pb-6 text-center text-[10px] text-gray-400 leading-tight shrink-0">
                    <div>Cookie Preferences • Report • Privacy</div>
                    <div className="mt-0.5">More from IndiaTaps</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Toolbar (Image 1: When drawer is closed) */}
        {!activeSubview && (
          <div className="h-16 bg-white border-t border-gray-200 px-2 flex items-center justify-between shrink-0 z-20 shadow-sm animate-in fade-in duration-150">
            {/* 1. Theme */}
            <button
              type="button"
              onClick={() => setActiveSubview('theme')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 p-1 flex flex-col justify-between items-center group-hover:scale-105 transition-transform">
                <span className="text-[9px] font-black text-gray-800 leading-none">Aa</span>
                <div className="w-full h-1.5 rounded-full bg-white border border-gray-200" />
              </div>
              <span className="text-[10px] font-medium text-gray-700">Theme</span>
            </button>

            {/* 2. Header (with red dot notification matching Image 1) */}
            <button
              type="button"
              onClick={() => setActiveSubview('header')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                <User className="w-4 h-4 text-gray-600" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
              </div>
              <span className="text-[10px] font-medium text-gray-700">Header</span>
            </button>

            {/* 3. Wallpaper */}
            <button
              type="button"
              onClick={() => setActiveSubview('wallpaper')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div
                className="w-8 h-8 rounded-lg border border-gray-300 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform"
                style={{
                  background: current.backgroundValue || '#111111',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <span className="text-[10px] font-medium text-gray-700">Wallpaper</span>
            </button>

            {/* 4. Text */}
            <button
              type="button"
              onClick={() => setActiveSubview('text')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-xs font-black text-gray-800">Aa</span>
              </div>
              <span className="text-[10px] font-medium text-gray-700">Text</span>
            </button>

            {/* 5. Buttons */}
            <button
              type="button"
              onClick={() => setActiveSubview('buttons')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-300 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                <div
                  className="w-full h-2.5 rounded-full border border-gray-400"
                  style={{ backgroundColor: current.buttonColor || '#FFFFFF' }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-700">Buttons</span>
            </button>

            {/* 6. Colors */}
            <button
              type="button"
              onClick={() => setActiveSubview('colors')}
              className="flex flex-col items-center gap-1 group cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                <div className="w-1/2 h-full bg-[#FA5252]" />
                <div className="w-1/2 h-full bg-[#FD7E14]" />
              </div>
              <span className="text-[10px] font-medium text-gray-700">Colors</span>
            </button>
          </div>
        )}

        {/* Mobile Bottom Sheet Drawer (Images 0, 2 & 3: When drawer is open) */}
        {activeSubview && (
          <div className="h-[50dvh] sm:h-[52dvh] max-h-[460px] bg-white rounded-t-[32px] border-t border-gray-200/90 shadow-2xl flex flex-col shrink-0 z-30 animate-in slide-in-from-bottom duration-200">
            {/* Top Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

            {/* Drawer Header with Title & (X) Close button */}
            <div className="px-5 py-2 flex items-center justify-between shrink-0">
              <h3 className="text-base font-extrabold text-[#111111] capitalize">{activeSubview}</h3>
              <button
                type="button"
                onClick={() => setActiveSubview(null)}
                className="w-7 h-7 rounded-full bg-[#E5E5E5] hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Tool Content */}
            {activeSubview === 'theme' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="px-5 flex items-center gap-7 border-b border-gray-100 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setThemeTab('customizable')}
                    className={`pb-2.5 transition-colors cursor-pointer relative ${
                      themeTab === 'customizable'
                        ? 'text-black border-b-2 border-black font-extrabold'
                        : 'text-gray-400 hover:text-black font-semibold'
                    }`}
                  >
                    Customizable
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeTab('curated')}
                    className={`pb-2.5 transition-colors cursor-pointer relative ${
                      themeTab === 'curated'
                        ? 'text-black border-b-2 border-black font-extrabold'
                        : 'text-gray-400 hover:text-black font-semibold'
                    }`}
                  >
                    Curated
                  </button>
                </div>

                {/* Theme Grid */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 card-scrollbar">
                  {/* Shuffle Button matching Image 0 & 2 */}
                  <button
                    type="button"
                    onClick={handleShuffleTheme}
                    className="w-full py-2.5 px-4 rounded-full border border-gray-200/90 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                      <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
                    </svg>
                    <span>Shuffle</span>
                  </button>

                  {/* Curated Theme Info */}
                  {themeTab === 'curated' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EEF7FE] border border-[#BFDBFE] text-[#0369A1] text-[11px] font-medium">
                      <span className="leading-snug">
                        Curated themes are made in collaboration with creators.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2.5 pt-1">
                    {themeTab === 'customizable' && (
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setActiveSubview('wallpaper')}
                          className="w-full h-24 rounded-2xl bg-[#EBEBEB] border border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-all shadow-2xs group"
                        >
                          <Paintbrush className="w-5 h-5 text-gray-700 stroke-[1.8] group-hover:scale-110 transition-transform" />
                        </button>
                        <span className="text-[10px] font-medium text-gray-700 text-center mt-1">Custom</span>
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
                            onClick={() => applyPresetTheme(pt)}
                            className={`w-full h-24 rounded-2xl p-2 flex flex-col justify-between overflow-hidden relative transition-all cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'border-2 border-black ring-1 ring-black/10'
                                : 'border border-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              background: pt.theme.backgroundValue,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {/* Pro / Sparkle Badge on top right */}
                            {pt.isPro && (
                              <div className="w-3.5 h-3.5 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center absolute top-1.5 right-1.5 pointer-events-none">
                                <Sparkles className="w-2 h-2 text-white" />
                              </div>
                            )}
                            <span
                              className="font-bold text-xs tracking-tight leading-none text-left"
                              style={{
                                color: pt.theme.textColor || '#111111',
                                fontFamily: pt.theme.fontFamily || 'Inter',
                              }}
                            >
                              Aa
                            </span>
                            <div
                              className="w-full h-3 rounded-full shadow-2xs"
                              style={{
                                backgroundColor: pt.theme.buttonColor,
                                borderRadius: `${Math.min(pt.theme.buttonRadius || 9999, 8)}px`,
                                border:
                                  pt.theme.buttonStyle === 'outline'
                                    ? `1px solid ${pt.theme.buttonTextColor}`
                                    : 'none',
                              }}
                            />
                          </button>
                          <span className="text-[10px] font-medium text-gray-700 text-center mt-1 truncate max-w-full">
                            {pt.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Header Subview matching Image 3 */}
            {activeSubview === 'header' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 card-scrollbar">
                  {/* 1. Layout Section matching Image 3 */}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block mb-2.5">Layout</span>
                    <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                      {/* Classic */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            commitChange({ headerLayout: 'classic' });
                            onUpdateTree({ headerLayout: 'classic' });
                          }}
                          className={`w-full h-24 rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            currentHeaderLayout === 'classic'
                              ? 'border-2 border-black bg-white shadow-2xs ring-1 ring-black/10'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-rose-500 overflow-hidden flex items-center justify-center shadow-2xs">
                            <img src={demoGirlImg} alt="Classic" className="w-full h-full object-cover" />
                          </div>
                        </button>
                        <span className="text-[10px] font-semibold text-gray-800 text-center mt-1">Classic</span>
                      </div>

                      {/* Hero */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            commitChange({ headerLayout: 'hero' });
                            onUpdateTree({ headerLayout: 'hero' });
                          }}
                          className={`w-full h-24 rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                            currentHeaderLayout === 'hero'
                              ? 'border-2 border-black bg-white shadow-2xs ring-1 ring-black/10'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-14 rounded-xl overflow-hidden relative bg-rose-500">
                            <img src={demoGirlImg} alt="Hero" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                          </div>
                          <div className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center absolute top-1.5 right-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                          </div>
                        </button>
                        <span className="text-[10px] font-semibold text-gray-800 text-center mt-1">Hero</span>
                      </div>

                      {/* Banner */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            commitChange({ headerLayout: 'banner' });
                            onUpdateTree({ headerLayout: 'banner' });
                          }}
                          className={`w-full h-24 rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                            currentHeaderLayout === 'banner'
                              ? 'border-2 border-black bg-white shadow-2xs ring-1 ring-black/10'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-8 rounded-t-lg bg-pink-300 overflow-hidden relative">
                            <div className="w-full h-full opacity-60 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:6px_6px]" />
                          </div>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-500 -mt-3.5 ring-2 ring-white shadow-2xs">
                            <img src={demoGirlImg} alt="Banner" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center absolute top-1.5 right-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                          </div>
                        </button>
                        <span className="text-[10px] font-semibold text-gray-800 text-center mt-1">Banner</span>
                      </div>

                      {/* Cutout */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            commitChange({ headerLayout: 'cutout' });
                            onUpdateTree({ headerLayout: 'cutout' });
                          }}
                          className={`w-full h-24 rounded-2xl p-1.5 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                            currentHeaderLayout === 'cutout'
                              ? 'border-2 border-black bg-white shadow-2xs ring-1 ring-black/10'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="w-9 h-12 rounded-t-full overflow-hidden filter drop-shadow-xs">
                            <img src={demoGirlImg} alt="Cutout" className="w-full h-full object-cover" />
                          </div>
                          <div className="w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center absolute top-1.5 right-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                          </div>
                        </button>
                        <span className="text-[10px] font-semibold text-gray-800 text-center mt-1">Cutout</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Profile Image Section matching Image 3 */}
                  <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-900">Profile image</span>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-12 h-12 rounded-xl bg-[#B5B9BE] relative flex items-center justify-center cursor-pointer overflow-visible group hover:opacity-95 transition-all shadow-inner shrink-0"
                      title="Upload profile image"
                    >
                      {currentTree?.avatarUrl || current.avatarUrl ? (
                        <img src={current.avatarUrl || currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center absolute -bottom-1 -right-1 text-gray-600 group-hover:scale-110 transition-transform">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Profile Title Section */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <label className="text-xs font-bold text-gray-900 block">Profile title</label>
                    <input
                      type="text"
                      value={current.title ?? `@${currentTree?.slug || 'riyast'}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        commitChange({ title: val });
                        onUpdateTree({ title: val });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black text-xs font-semibold text-gray-900 transition-all outline-hidden"
                      placeholder="@username or title"
                    />
                  </div>

                  {/* 4. Bio Section */}
                  <div className="space-y-1.5 pb-4">
                    <label className="text-xs font-bold text-gray-900 block">Bio</label>
                    <textarea
                      value={current.bio ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        commitChange({ bio: val });
                        onUpdateTree({ bio: val });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black text-xs text-gray-800 transition-all outline-hidden resize-none"
                      placeholder="Add a short bio"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSubview === 'wallpaper' && (
              <div className="flex-1 overflow-y-auto px-4 py-2 card-scrollbar">
                <WallpaperEditor current={current} commitChange={commitChange} />
              </div>
            )}

            {activeSubview === 'buttons' && (
              <div className="flex-1 overflow-y-auto px-4 py-2 card-scrollbar">
                <ButtonEditor
                  current={current}
                  commitChange={commitChange}
                  onBack={() => setActiveSubview(null)}
                />
              </div>
            )}

            {activeSubview === 'text' && (
              <div className="flex-1 overflow-y-auto px-4 py-2 card-scrollbar">
                <TextEditor
                  current={current}
                  commitChange={commitChange}
                  onBack={() => setActiveSubview(null)}
                />
              </div>
            )}

            {activeSubview === 'colors' && (
              <div className="flex-1 overflow-y-auto px-4 py-2 card-scrollbar">
                <ColorsEditor
                  current={current}
                  commitChange={commitChange}
                  onBack={() => setActiveSubview(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
