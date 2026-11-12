import React, { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Pencil,
  Ban,
  Droplets,
  Grid,
  Upload,
  Check,
  Video as VideoIcon,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { getPatternSvg, getContrastingPatternColor, isColorLight, loadOrganicPattern } from '../constants/patternSvg.js';
import { uploadPicture } from '../lib/uploadPicture.js';

export const WALLPAPER_IMAGE_PRESETS = [
  {
    id: 'concert-stage',
    name: 'Concert Stage',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'green-marble',
    name: 'Emerald Agate',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'dark-3d-star',
    name: '3D Celestial',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'obsidian-fluid',
    name: 'Liquid Obsidian',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&auto=format&fit=crop&q=80',
  },
];


export const PATTERN_PRESETS = [
  { id: 'organic', name: 'Organic Waves' },
  { id: 'grid', name: 'Graph Grid' },
  { id: 'camo', name: 'Fluid Camo' },
  { id: 'checker', name: 'Gingham Checker' },
];

export const SOLID_PALETTE = [
  '#050F15', // Dark Navy/Black (from Image 3)
  '#638873', // Sage Green (from Image 1 & 4)
  '#0B0B0D', // Obsidian Black
  '#F3F3F1', // Linktree Light Off-White
  '#1E293B', // Slate Midnight
  '#3B82F6', // Cobalt Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Warm Honey Amber
  '#EC4899', // Vivid Rose Pink
  '#FFFFFF', // Clean White
];

export function WallpaperEditor({ current, commitChange }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);

  // Read current wallpaper state or establish robust defaults
  const activeStyle =
    current.wallpaperStyle ||
    (current.backgroundType === 'pattern'
      ? 'pattern'
      : current.backgroundType === 'image'
      ? 'image'
      : current.backgroundType === 'gradient'
      ? 'gradient'
      : current.backgroundType === 'video'
      ? 'video'
      : 'fill');

  const bgColor =
    current.backgroundColor ||
    (current.backgroundValue?.startsWith('#') ? current.backgroundValue : '#050F15');

  const currentImageUrl =
    current.backgroundImageUrl ||
    (current.backgroundValue?.includes('url(')
      ? current.backgroundValue.replace(/^url\(["']?/, '').replace(/["']?\).*$/, '')
      : WALLPAPER_IMAGE_PRESETS[0].url);

  const currentVideoUrl =
    current.wallpaperVideoUrl ||
    (current.wallpaperStyle === 'video' ? current.backgroundImageUrl : '');

  const activeEffect = current.effect || 'none';
  const tint = typeof current.tint === 'number' ? current.tint : 0;
  const noise = Boolean(current.noise);
  const activePattern = current.patternType || 'organic';
  const blurAmount = typeof current.blurAmount === 'number' ? current.blurAmount : 20;

  // Helper to recompute full CSS background value for live render
  const syncBackgroundValue = (updates) => {
    const nextStyle = updates.wallpaperStyle !== undefined ? updates.wallpaperStyle : activeStyle;
    const nextColor = updates.backgroundColor !== undefined ? updates.backgroundColor : bgColor;
    const nextImg = updates.backgroundImageUrl !== undefined ? updates.backgroundImageUrl : currentImageUrl;
    const nextVideo = updates.wallpaperVideoUrl !== undefined ? updates.wallpaperVideoUrl : (updates.backgroundImageUrl || currentVideoUrl);
    const nextPattern = updates.patternType !== undefined ? updates.patternType : activePattern;

    let finalBgVal = nextColor;
    let finalBgType = 'solid';

    if (nextStyle === 'fill') {
      finalBgType = 'solid';
      finalBgVal = nextColor;
    } else if (nextStyle === 'gradient') {
      finalBgType = 'gradient';
      finalBgVal = `linear-gradient(135deg, ${nextColor} 0%, #111111 100%)`;
    } else if (nextStyle === 'blur') {
      finalBgType = 'blur';
      finalBgVal = nextImg ? `url("${nextImg}") center / cover no-repeat` : nextColor;
    } else if (nextStyle === 'pattern') {
      finalBgType = 'pattern';
      const patColor = getContrastingPatternColor(nextColor);
      const patSvg = getPatternSvg(nextPattern, patColor);
      finalBgVal = `${nextColor} url("${patSvg}") repeat`;
    } else if (nextStyle === 'image') {
      finalBgType = 'image';
      finalBgVal = `url("${nextImg}") center / cover no-repeat`;
    } else if (nextStyle === 'video') {
      finalBgType = 'video';
      finalBgVal = nextColor;
    }

    commitChange({
      wallpaperStyle: nextStyle,
      backgroundType: finalBgType,
      backgroundColor: nextColor,
      backgroundValue: finalBgVal,
      backgroundImageUrl: nextImg,
      wallpaperVideoUrl: nextVideo,
      patternType: nextPattern,
      ...updates,
    });
  };

  const handleSelectStyle = (style) => {
    syncBackgroundValue({ wallpaperStyle: style });
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setShowImagePicker(false);

    // The picture goes to the storage first, made smaller. Only the address
    // of it goes into the tree: a picture of a few megabytes inside the tree
    // makes every page of it slow to open.
    uploadPicture(file, { folder: 'wallpapers', maxWidth: 1920, maxHeight: 1920 })
      .then((url) => {
        if (!url) return;
        syncBackgroundValue({
          backgroundImageUrl: url,
          wallpaperStyle: activeStyle === 'fill' ? 'image' : activeStyle,
        });
      })
      .catch(() => {});
  };

  const handleCustomVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // The picture goes to the storage first, made smaller.
    uploadPicture(file, { folder: 'wallpapers', maxWidth: 1920, maxHeight: 1920 })
      .then((url) => {
        if (!url) return;
        syncBackgroundValue({
          wallpaperStyle: 'video',
          backgroundType: 'video',
          wallpaperVideoUrl: url,
          backgroundImageUrl: url,
        });
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-150">
      {/* 1. Wallpaper Style Section Matching Linktree Screenshots */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-[#111111]">Wallpaper style</h2>

        {/* 6 Horizontal Style Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {/* Tile 1: Fill */}
          <button
            type="button"
            onClick={() => handleSelectStyle('fill')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white group ${
              activeStyle === 'fill'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-12 sm:h-14 rounded-xl border border-gray-300 shadow-2xs group-hover:scale-102 transition-transform"
              style={{ backgroundColor: bgColor }}
            />
            <span className="text-[11px] font-bold text-gray-800">Fill</span>
          </button>

          {/* Tile 2: Gradient */}
          <button
            type="button"
            onClick={() => handleSelectStyle('gradient')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white relative group ${
              activeStyle === 'gradient'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-12 sm:h-14 rounded-xl border border-black/10 shadow-2xs relative overflow-hidden group-hover:scale-102 transition-transform"
              style={{ background: `linear-gradient(135deg, ${bgColor} 0%, #111111 100%)` }}
            />
            <span className="text-[11px] font-bold text-gray-800">Gradient</span>
          </button>

          {/* Tile 3: Blur (Blurs the wallpaper behind) */}
          <button
            type="button"
            onClick={() => handleSelectStyle('blur')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white relative group ${
              activeStyle === 'blur'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-12 sm:h-14 rounded-xl border border-black/10 shadow-2xs relative overflow-hidden group-hover:scale-102 transition-transform"
              style={{
                backgroundImage: currentImageUrl ? `url("${currentImageUrl}")` : 'none',
                backgroundColor: bgColor,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${Math.min(8, Math.max(2, Math.round(blurAmount / 4)))}px)`,
                transform: 'scale(1.1)',
              }}
            />
            <span className="text-[11px] font-bold text-gray-800">Blur</span>
          </button>

          {/* Tile 4: Pattern (Matches Image 1 & 3) */}
          <button
            type="button"
            onClick={() => handleSelectStyle('pattern')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white relative group ${
              activeStyle === 'pattern'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-12 sm:h-14 rounded-xl border border-black/10 shadow-2xs relative overflow-hidden group-hover:scale-102 transition-transform"
              style={{
                backgroundColor: bgColor,
                backgroundImage: `url("${getPatternSvg(activePattern, getContrastingPatternColor(bgColor), 0.35)}")`,
                backgroundRepeat: 'repeat',
                backgroundSize: activePattern === 'grid' ? '40px 40px' : activePattern === 'organic' ? '120px 160px' : 'auto',
              }}
            />
            <span className="text-[11px] font-bold text-gray-800">Pattern</span>
          </button>

          {/* Tile 5: Image */}
          <button
            type="button"
            onClick={() => handleSelectStyle('image')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white relative group ${
              activeStyle === 'image'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-12 sm:h-14 rounded-xl border border-black/10 shadow-2xs relative overflow-hidden group-hover:scale-102 transition-transform"
              style={{
                backgroundImage: `url("${currentImageUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <span className="text-[11px] font-bold text-gray-800">Image</span>
          </button>

          {/* Tile 6: Video */}
          <button
            type="button"
            onClick={() => handleSelectStyle('video')}
            className={`h-24 sm:h-28 rounded-[20px] p-2 flex flex-col items-center justify-between transition-all cursor-pointer bg-white relative group ${
              activeStyle === 'video'
                ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div className="w-full h-12 sm:h-14 rounded-xl bg-[#F3F3F1] border border-gray-200 flex items-center justify-center shadow-2xs relative overflow-hidden group-hover:scale-102 transition-transform">
              {currentVideoUrl ? (
                <video
                  src={currentVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <VideoIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <span className="text-[11px] font-bold text-gray-800">Video</span>
          </button>
        </div>
      </div>

      {/* 2. Controls When IMAGE is Selected (Matching Linktree Screenshots) */}
      {activeStyle === 'image' && (
        <div className="space-y-6 pt-2">
          {/* Background image row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Background image</span>
            <div
              onClick={() => setShowImagePicker(true)}
              className="w-14 h-14 rounded-2xl border border-gray-200/90 shadow-2xs relative overflow-hidden cursor-pointer group hover:border-gray-400 transition-colors"
              style={{
                backgroundImage: `url("${currentImageUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              title="Change wallpaper image"
            >
              {/* Floating pencil edit button overlay in bottom right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImagePicker(true);
                }}
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white text-black shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-black/5"
              >
                <Pencil className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Effect Section */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Effect</span>

            <div className="flex items-center gap-2.5">
              {/* Effect: None */}
              <button
                type="button"
                onClick={() => commitChange({ effect: 'none' })}
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-white ${
                  activeEffect === 'none'
                    ? 'border-2 border-black font-bold text-black ring-1 ring-black/10'
                    : 'border border-gray-200/90 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Ban className="w-4 h-4 stroke-[2]" />
                <span className="text-[11px]">None</span>
              </button>

              {/* Effect: Mono */}
              <button
                type="button"
                onClick={() => commitChange({ effect: 'mono' })}
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-white ${
                  activeEffect === 'mono'
                    ? 'border-2 border-black font-bold text-black ring-1 ring-black/10'
                    : 'border border-gray-200/90 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-current overflow-hidden flex">
                  <div className="w-1/2 h-full bg-current" />
                </div>
                <span className="text-[11px]">Mono</span>
              </button>

              {/* Effect: Blur */}
              <button
                type="button"
                onClick={() => commitChange({ effect: 'blur' })}
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-white ${
                  activeEffect === 'blur'
                    ? 'border-2 border-black font-bold text-black ring-1 ring-black/10'
                    : 'border border-gray-200/90 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Droplets className="w-4 h-4 stroke-[2]" />
                <span className="text-[11px]">Blur</span>
              </button>

              {/* Effect: Halftone */}
              <button
                type="button"
                onClick={() => commitChange({ effect: 'halftone' })}
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-white ${
                  activeEffect === 'halftone'
                    ? 'border-2 border-black font-bold text-black ring-1 ring-black/10'
                    : 'border border-gray-200/90 hover:border-gray-300 text-gray-700'
                }`}
              >
                <Grid className="w-4 h-4 stroke-[2]" />
                <span className="text-[11px]">Halftone</span>
              </button>
            </div>
          </div>

          {/* Blur Intensity Slider when Effect: Blur is active */}
          {activeEffect === 'blur' && (
            <div className="flex items-center justify-between pt-1">
              <div className="max-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111111] block">Blur amount</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-[#7033FF] border border-[#7033FF]/20">
                    {blurAmount}px
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Slide to adjust blur strength
                </p>
              </div>

              <div className="flex items-center gap-3 w-52 sm:w-60">
                <Droplets className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={blurAmount}
                  onChange={(e) => commitChange({ blurAmount: parseInt(e.target.value, 10) })}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7033FF]"
                />
                <span className="text-[11px] font-bold text-gray-700 min-w-[32px] text-right font-mono">
                  {blurAmount}px
                </span>
              </div>
            </div>
          )}

          {/* Tint Slider */}
          <div className="flex items-center justify-between">
            <div className="max-w-[240px]">
              <span className="text-xs font-bold text-[#111111] block">Tint</span>
              <p className="text-[11px] text-gray-500 leading-snug">
                Improves text visibility and helps make your content more accessible
              </p>
            </div>

            <div className="flex items-center gap-3 w-52 sm:w-60">
              <Moon className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={tint}
                onChange={(e) => commitChange({ tint: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <Sun className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
            </div>
          </div>

          {/* Noise Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111111] block">Noise</span>
              <p className="text-[11px] text-gray-500">Add a subtle grain texture</p>
            </div>

            <button
              type="button"
              onClick={() => commitChange({ noise: !noise })}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                noise ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  noise ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 3. Controls When PATTERN is Selected (Matching Linktree Screenshots) */}
      {activeStyle === 'pattern' && (
        <div className="space-y-6 pt-2">
          {/* Background color row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Background color</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white shadow-2xs cursor-pointer"
              >
                <div
                  className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                  style={{ backgroundColor: bgColor }}
                />
                <span className="text-xs font-mono font-bold text-gray-900 uppercase">{bgColor}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Color Swatch Dropdown Popover */}
              {showColorPicker && (
                <div className="absolute top-10 right-0 z-30 p-3 bg-white border border-gray-200 rounded-2xl shadow-xl space-y-2 w-64 animate-in fade-in duration-150">
                  <div className="grid grid-cols-5 gap-2">
                    {SOLID_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          syncBackgroundValue({ backgroundColor: c });
                          setShowColorPicker(false);
                        }}
                        className="w-9 h-9 rounded-xl border border-black/10 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor.startsWith('#') ? bgColor : '#050F15'}
                      onChange={(e) => syncBackgroundValue({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => syncBackgroundValue({ backgroundColor: e.target.value })}
                      placeholder="#050F15"
                      className="text-xs font-mono px-2 py-1 rounded-lg border border-gray-200 flex-1 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pattern row with 4 Pattern tiles */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Pattern</span>

            <div className="flex items-center gap-2.5">
              {PATTERN_PRESETS.map((p) => {
                const isSelected = activePattern === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => syncBackgroundValue({ patternType: p.id })}
                    className={`w-14 h-14 rounded-2xl p-1.5 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden bg-[#F4F4F5] ${
                      isSelected
                        ? 'border-2 border-black ring-1 ring-black/10 shadow-xs'
                        : 'border border-gray-200/90 hover:border-gray-300'
                    }`}
                    title={p.name}
                  >
                    <div
                      className="w-full h-full rounded-xl"
                      style={{
                        backgroundImage: `url("${getPatternSvg(p.id, '#111111', 0.55)}")`,
                        backgroundRepeat: 'repeat',
                        backgroundSize:
                          p.id === 'grid'
                            ? '26px 26px'
                            : p.id === 'organic'
                            ? '75px 102px'
                            : p.id === 'camo'
                            ? '30px 30px'
                            : '20px 20px',
                      }}
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Controls When FILL is Selected */}
      {activeStyle === 'fill' && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Background color</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white shadow-2xs cursor-pointer"
              >
                <div
                  className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs"
                  style={{ backgroundColor: bgColor }}
                />
                <span className="text-xs font-mono font-bold text-gray-900 uppercase">{bgColor}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showColorPicker && (
                <div className="absolute top-10 right-0 z-30 p-3 bg-white border border-gray-200 rounded-2xl shadow-xl space-y-2 w-64 animate-in fade-in duration-150">
                  <div className="grid grid-cols-5 gap-2">
                    {SOLID_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          syncBackgroundValue({ backgroundColor: c });
                          setShowColorPicker(false);
                        }}
                        className="w-9 h-9 rounded-xl border border-black/10 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor.startsWith('#') ? bgColor : '#638873'}
                      onChange={(e) => syncBackgroundValue({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => syncBackgroundValue({ backgroundColor: e.target.value })}
                      placeholder="#638873"
                      className="text-xs font-mono px-2 py-1 rounded-lg border border-gray-200 flex-1 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Controls When BLUR is Selected */}
      {activeStyle === 'blur' && (
        <div className="space-y-6 pt-2">
          {/* Background image row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111111] block">Background image</span>
              <p className="text-[11px] text-gray-500 leading-snug">
                Image behind the ambient frosted backdrop
              </p>
            </div>

            <div
              onClick={() => setShowImagePicker(true)}
              className="w-14 h-14 rounded-2xl border border-gray-200 overflow-hidden relative cursor-pointer hover:border-black transition-all group shadow-2xs shrink-0"
              style={{
                backgroundImage: currentImageUrl ? `url("${currentImageUrl}")` : 'none',
                backgroundColor: bgColor,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${Math.min(10, Math.max(2, Math.round(blurAmount / 4)))}px)`,
                transform: 'scale(1.15)',
              }}
              title="Change wallpaper image"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImagePicker(true);
                }}
                className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white text-black shadow-md flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-black/5"
              >
                <Pencil className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Blur Intensity Slider */}
          <div className="flex items-center justify-between">
            <div className="max-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#111111] block">Blur amount</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-[#7033FF] border border-[#7033FF]/20">
                  {blurAmount}px
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                Slide to determine how subtle or strong the blur appears
              </p>
            </div>

            <div className="flex items-center gap-3 w-52 sm:w-60">
              <Droplets className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={blurAmount}
                onChange={(e) => commitChange({ blurAmount: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7033FF]"
              />
              <span className="text-[11px] font-bold text-gray-700 min-w-[32px] text-right font-mono">
                {blurAmount}px
              </span>
            </div>
          </div>

          {/* Preset Intensity Chips */}
          <div className="flex items-center gap-2 pt-0.5">
            {[
              { label: 'Subtle', val: 6 },
              { label: 'Medium', val: 18 },
              { label: 'Strong', val: 30 },
              { label: 'Maximum', val: 50 },
            ].map((chip) => (
              <button
                key={chip.val}
                type="button"
                onClick={() => commitChange({ blurAmount: chip.val })}
                className={`py-1 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  blurAmount === chip.val
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Tint Slider */}
          <div className="flex items-center justify-between">
            <div className="max-w-[240px]">
              <span className="text-xs font-bold text-[#111111] block">Tint</span>
              <p className="text-[11px] text-gray-500 leading-snug">
                Improves text visibility and helps make your content more accessible
              </p>
            </div>

            <div className="flex items-center gap-3 w-52 sm:w-60">
              <Moon className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={tint}
                onChange={(e) => commitChange({ tint: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <Sun className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
            </div>
          </div>

          {/* Noise Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111111] block">Noise</span>
              <p className="text-[11px] text-gray-500">Add a subtle grain texture</p>
            </div>

            <button
              type="button"
              onClick={() => commitChange({ noise: !noise })}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                noise ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  noise ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* 6. Controls When GRADIENT is Selected */}
      {activeStyle === 'gradient' && (
        <div className="space-y-4 pt-2">
          <span className="text-xs font-extrabold text-[#111111] block">Gradient color</span>
          <div className="grid grid-cols-5 gap-2.5 max-w-sm">
            {SOLID_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => syncBackgroundValue({ backgroundColor: c })}
                className="h-10 rounded-xl border border-black/10 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${c} 0%, #111111 100%)` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 7. Controls When VIDEO is Selected */}
      {activeStyle === 'video' && (
        <div className="space-y-6 pt-2">
          {/* Background video row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#111111]">Background video</span>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/*"
                className="hidden"
                onChange={handleCustomVideoUpload}
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="py-1.5 px-3.5 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Select from device
              </button>
            </div>
          </div>

          {/* Tint Slider */}
          <div className="flex items-center justify-between">
            <div className="max-w-[240px]">
              <span className="text-xs font-bold text-[#111111] block">Tint</span>
              <p className="text-[11px] text-gray-500 leading-snug">
                Improves text visibility and helps make your content more accessible
              </p>
            </div>

            <div className="flex items-center gap-3 w-52 sm:w-60">
              <Moon className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={tint}
                onChange={(e) => commitChange({ tint: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <Sun className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
            </div>
          </div>

          {/* Noise Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111111] block">Noise</span>
              <p className="text-[11px] text-gray-500">Add a subtle grain texture</p>
            </div>

            <button
              type="button"
              onClick={() => commitChange({ noise: !noise })}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                noise ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white block shadow-xs transition-transform ${
                  noise ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Image Selection Modal / Drawer */}
      {showImagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#111111]">Choose Background Image</h3>
              <button
                type="button"
                onClick={() => setShowImagePicker(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-3">
              {WALLPAPER_IMAGE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    syncBackgroundValue({
                      backgroundImageUrl: preset.url,
                    });
                    setShowImagePicker(false);
                  }}
                  className="group relative h-28 rounded-2xl overflow-hidden border border-gray-200/90 hover:border-black cursor-pointer shadow-2xs transition-all"
                >
                  <img
                    src={preset.thumbnail}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] font-bold">
                    {preset.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Your Own */}
            <div className="pt-2 border-t border-gray-100">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCustomImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload custom wallpaper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
