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

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'powerups' | 'insights'
  const [title, setTitle] = useState(card?.title ?? '');
  const [subtitle, setSubtitle] = useState(card?.subtitle ?? card?.settings?.address ?? '');
  const [url, setUrl] = useState(card?.url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(card?.thumbnailUrl ?? '');
  const [layout, setLayout] = useState(card?.settings?.layout || 'classic');
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

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
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        handleThumbnailChange(dataUrl);
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
            title={card.visible !== false ? 'Visible on Linktree' : 'Hidden from Linktree'}
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
                  Displays your location pin, address, and directions on your Linktree.
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
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  layout === 'classic'
                    ? 'border-black bg-[#FBFBFA]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Horizontal pill button illustration */}
                <div className="w-28 h-8 rounded-lg bg-[#EAEAE8] flex items-center px-2 gap-2 shadow-2xs">
                  <div className="w-4 h-4 rounded-xs bg-[#B8B8B6] shrink-0" />
                  <div className="w-14 h-1.5 rounded-full bg-[#B8B8B6]" />
                </div>
                <span className="font-bold text-xs text-[#111111]">Classic</span>
              </button>

              {/* Featured Layout Card */}
              <button
                type="button"
                onClick={() => handleLayoutChange('featured')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  layout === 'featured'
                    ? 'border-black bg-[#FBFBFA]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="w-28 h-12 rounded-lg bg-[#EAEAE8] flex flex-col items-center justify-center gap-1 shadow-2xs">
                  <ImageIcon className="w-5 h-5 text-[#A0A09E]" />
                  <div className="w-12 h-1 rounded-full bg-[#B8B8B6]" />
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
            <p className="text-[11px] text-gray-500">Choose dates for when this location appears on your Linktree</p>
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
