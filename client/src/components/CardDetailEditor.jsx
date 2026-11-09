import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Share2,
  MoreVertical,
  Pencil,
  Sparkles,
  BarChart3,
  BookOpen,
  Image as ImageIcon,
  Trash2,
  Disc,
  FileText,
  Info,
  MapPin,
  ExternalLink,
  Upload,
  X,
  Utensils,
} from 'lucide-react';
import { FaviconIcon } from './FaviconIcon.jsx';

export function CardDetailEditor({
  card,
  onBack,
  onUpdateCard,
  onDeleteCard,
  activeTheme,
}) {
  const isMaps =
    card?.type === 'maps' ||
    Boolean(card?.settings?.address) ||
    Boolean(card?.url && /maps\.google|maps\.app\.goo\.gl/i.test(card.url));

  const isMenu =
    card?.type === 'menu' ||
    card?.settings?.platform === 'menu' ||
    Boolean(card?.settings?.isPdf) ||
    Boolean(card?.url && /\.pdf($|\?)/i.test(card.url));

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'powerups' | 'insights'
  const [title, setTitle] = useState(card?.title ?? '');
  const [subtitle, setSubtitle] = useState(card?.subtitle ?? card?.settings?.address ?? '');
  const [url, setUrl] = useState(card?.url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(card?.thumbnailUrl ?? '');
  const [layout, setLayout] = useState(card?.settings?.layout || 'classic');
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title ?? '');
      setSubtitle(card.subtitle ?? card.settings?.address ?? '');
      setUrl(card.url ?? '');
      setThumbnailUrl(card.thumbnailUrl ?? '');
      setLayout(card.settings?.layout || 'classic');
    }
  }, [card?.id]);

  if (!card) return null;

  const handleTitleChange = (val) => {
    setTitle(val);
    onUpdateCard(card.id, { title: val });
  };

  const handleSubtitleChange = (val) => {
    setSubtitle(val);
    onUpdateCard(card.id, {
      subtitle: val,
      settings: {
        ...(card.settings || {}),
        address: val,
      },
    });
  };

  const handleUrlChange = (val) => {
    setUrl(val);
    const hasValidUrl = Boolean(val && val.trim() !== '' && val.trim() !== 'https://');
    onUpdateCard(card.id, {
      url: val,
      settings: {
        ...(card.settings || {}),
        needsSetup: !hasValidUrl,
      },
    });
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    onUpdateCard(card.id, {
      settings: { ...(card.settings || {}), layout: newLayout },
    });
  };

  const handleThumbnailChange = (val) => {
    setThumbnailUrl(val);
    onUpdateCard(card.id, { thumbnailUrl: val });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl === 'string') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 320;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          handleThumbnailChange(compressed);

          // Upload directly to Supabase Storage CDN for faster asset loading
          fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ file: compressed, filename: file.name, folder: 'thumbnails' }),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res?.url) {
                handleThumbnailChange(res.url);
              }
            })
            .catch(() => {});
        };
        img.onerror = () => {
          handleThumbnailChange(rawDataUrl);
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setUrl(dataUrl);
        setSubtitle(`Menu (${file.name})`);
        onUpdateCard(card.id, {
          url: dataUrl,
          subtitle: `Menu (${file.name})`,
          settings: {
            ...(card.settings || {}),
            isPdf: true,
            pdfName: file.name,
            needsSetup: false,
          },
        });

        // Upload PDF to Supabase Storage CDN for faster streaming & smaller payloads
        fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ file: dataUrl, filename: file.name, folder: 'menus' }),
        })
          .then((res) => res.json())
          .then((res) => {
            if (res?.url) {
              setUrl(res.url);
              onUpdateCard(card.id, {
                url: res.url,
                settings: {
                  ...(card.settings || {}),
                  isPdf: true,
                  pdfName: file.name,
                  needsSetup: false,
                },
              });
            }
          })
          .catch(() => {});
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const pageTitle = isMaps ? 'Maps' : (title || 'Link');

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-2xs space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Back to Content"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <span className="font-bold text-sm sm:text-base text-[#111111] truncate max-w-[280px]">
            {pageTitle}
          </span>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* Eye visibility toggle */}
          <button
            onClick={() => onUpdateCard(card.id, { visible: card.visible === false ? true : false })}
            className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-colors cursor-pointer ${
              card.visible !== false ? 'text-gray-700 hover:bg-gray-100' : 'text-amber-600 bg-amber-50'
            }`}
            title={card.visible !== false ? 'Visible on IndiaTaps' : 'Hidden from IndiaTaps'}
          >
            {card.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Share icon */}
          <button
            onClick={() => {
              if (url && navigator.clipboard) {
                navigator.clipboard.writeText(url);
              }
            }}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Three vertical dots */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-30 text-xs font-semibold space-y-0.5">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDeleteCard(card.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tabs Row: Details / Power-ups / Insights */}
      <div className="flex items-center gap-2 bg-[#F6F6F7] p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-white shadow-xs text-black font-extrabold border border-gray-200/60'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-gray-700" />
          <span>Details</span>
        </button>

        <button
          onClick={() => setActiveTab('powerups')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'powerups'
              ? 'bg-white shadow-xs text-black font-extrabold border border-gray-200/60'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-gray-700" />
          <span>Power-ups</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-white shadow-xs text-black font-extrabold border border-gray-200/60'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-gray-700" />
          <span>Insights</span>
        </button>
      </div>

      {/* 3. Details Content Section */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Info Banner for Maps */}
          {isMaps && (
            <div className="bg-[#EDF5FF] border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-[#1E3A8A]">
                  Location Card
                </div>
                <div className="text-[11px] text-[#3B82F6]">
                  Displays your location pin, address, and directions on your IndiaTaps.
                </div>
              </div>
            </div>
          )}

          {/* Info Banner for Menu */}
          {isMenu && (
            <div className="bg-[#FFF7ED] border border-orange-200 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                <Utensils className="w-3.5 h-3.5 text-[#EA580C]" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-[#9A3412]">
                  Restaurant Menu & Catalog
                </div>
                <div className="text-[11px] text-[#C2410C]">
                  Upload a PDF menu or link to your online food & drinks catalog.
                </div>
              </div>
            </div>
          )}

          {/* Section: Title & Content */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-[#111111]">
              Information
            </h3>

            {/* Title Field */}
            <div className="space-y-1">
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                  {isMaps ? 'Place or Business Name' : 'Title'}
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Card title"
                    className="w-full bg-transparent text-sm font-bold text-[#111111] focus:outline-none"
                  />
                  <button className="text-gray-400 hover:text-black p-1 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtitle / Address Field */}
            <div className="space-y-1">
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                  {isMaps ? 'Location Address' : 'Subtitle / Description'}
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => handleSubtitleChange(e.target.value)}
                    placeholder={isMaps ? 'e.g. 123 Main St, New York' : 'e.g. Brief description or subtitle'}
                    className="w-full bg-transparent text-sm font-semibold text-[#111111] focus:outline-none"
                  />
                  {isMaps ? (
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Dedicated PDF Menu Upload for Restaurant Menu & Catalogs */}
            {isMenu && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-500">
                  Menu / Catalog PDF
                </label>
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept="application/pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                />

                {card.settings?.pdfName ? (
                  <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#EF4444] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#111111] truncate">
                          {card.settings.pdfName}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Uploaded PDF Document
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold text-gray-700 transition-colors shadow-2xs"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-bold text-gray-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCard(card.id, {
                            settings: {
                              ...(card.settings || {}),
                              isPdf: false,
                              pdfName: null,
                            },
                          });
                        }}
                        className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#EA580C] bg-gray-50/60 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-[#EA580C] shadow-2xs transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-xs text-gray-700 group-hover:text-black">
                      Upload Menu PDF
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Select a .pdf file from your computer or phone
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* URL Field */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
              <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                Destination URL
              </label>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-transparent text-sm font-semibold text-[#111111] focus:outline-none font-mono"
                />
                <button className="text-gray-400 hover:text-black p-1 shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Display Layout (Classic vs Featured) */}
          <div className="space-y-3 pt-1">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm text-[#111111]">
                Card Layout
              </h3>
              <p className="text-[11px] text-gray-500">
                Choose how this card appears on your profile
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Classic Layout Card */}
              <button
                type="button"
                onClick={() => handleLayoutChange('classic')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-between gap-3 transition-all cursor-pointer ${
                  layout === 'classic'
                    ? 'border-black bg-[#FBFBFA] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Clean Blinkit-style compact horizontal card illustration */}
                <div className="w-full max-w-[136px] h-10 rounded-xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-between px-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5.5 h-5.5 rounded-lg bg-[#F3F4F6] border border-gray-200 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="w-12 h-1.5 rounded-full bg-gray-800" />
                      <div className="w-7 h-1 rounded-full bg-gray-300" />
                    </div>
                  </div>
                  <div className="w-1 h-2 rounded-full bg-gray-300 shrink-0" />
                </div>
                <span className="font-bold text-xs text-[#111111]">Classic</span>
              </button>

              {/* Featured Layout Card */}
              <button
                type="button"
                onClick={() => handleLayoutChange('featured')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-between gap-3 transition-all cursor-pointer ${
                  layout === 'featured'
                    ? 'border-black bg-[#FBFBFA] shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Clean Blinkit-style hero banner card illustration */}
                <div className="w-full max-w-[136px] h-14 rounded-xl bg-white border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
                  {/* Top image banner with clean soft gradient */}
                  <div className="w-full h-8 bg-gradient-to-r from-emerald-100 via-teal-50 to-amber-50 flex items-center justify-center relative">
                    <div className="w-5 h-5 rounded-md bg-white/90 shadow-2xs border border-emerald-200/60 flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                  {/* Bottom details bar */}
                  <div className="flex-1 px-2 flex items-center justify-between bg-white border-t border-gray-100">
                    <div className="space-y-0.5">
                      <div className="w-10 h-1.5 rounded-full bg-gray-800" />
                      <div className="w-6 h-1 rounded-full bg-gray-300" />
                    </div>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#0C831F] text-white text-[7px] font-black uppercase leading-none">
                      ADD
                    </span>
                  </div>
                </div>
                <span className="font-bold text-xs text-[#111111]">Featured</span>
              </button>
            </div>
          </div>

          {/* Thumbnail Section - Select from device */}
          <div className="space-y-3 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs text-[#111111]">
                  Thumbnail
                </span>
                <p className="text-[11px] text-gray-500">
                  Select an image from your device
                </p>
              </div>

              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => handleThumbnailChange('')}
                  className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Thumbnail selector card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-black bg-gray-50/60 hover:bg-gray-50 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-2xs overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <FaviconIcon card={card} className="w-6 h-6" containerClassName="w-12 h-12" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-xs text-[#111111]">
                    {thumbnailUrl ? 'Custom image selected' : 'Upload from device'}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {thumbnailUrl ? 'Click to change from device' : 'Click to choose image (PNG, JPG, SVG, WebP)'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 group-hover:border-black text-xs font-bold text-[#111111] shrink-0 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{thumbnailUrl ? 'Change' : 'Select'}</span>
              </button>
            </div>

            {/* Direct Image URL input option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={thumbnailUrl.startsWith('data:') ? '' : thumbnailUrl}
                onChange={(e) => handleThumbnailChange(e.target.value)}
                placeholder="Or paste an image URL (https://...)"
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-medium focus:outline-none focus:border-black placeholder:text-gray-400 font-mono"
              />
              {thumbnailUrl && !thumbnailUrl.startsWith('data:') && (
                <button
                  type="button"
                  onClick={() => handleThumbnailChange('')}
                  className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Power-ups Tab */}
      {activeTab === 'powerups' && (
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <h4 className="font-bold text-xs text-black">Redirect Link</h4>
            <p className="text-[11px] text-gray-500">Temporarily forward all visitors directly to this location</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
            <h4 className="font-bold text-xs text-black">Schedule Link</h4>
            <p className="text-[11px] text-gray-500">Choose dates for when this location appears on your IndiaTaps</p>
          </div>
        </div>
      )}

      {/* 5. Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4 pt-1 text-center py-8">
          <BarChart3 className="w-8 h-8 text-gray-400 mx-auto" />
          <div className="text-xs font-bold text-black">{card.clicks || 0} Clicks</div>
          <p className="text-[11px] text-gray-400">Track visitors and engagement on this card</p>
        </div>
      )}
    </div>
  );
}
