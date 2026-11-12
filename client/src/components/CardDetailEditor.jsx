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
  Plus,
  Play,
  Star,
  AlertCircle,
} from 'lucide-react';
import { FaviconIcon } from './FaviconIcon.jsx';
import { PdfViewer } from './PdfViewer.jsx';

export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const normalizeGalleryItem = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    const isVid =
      /\.(mp4|webm|mov|ogg)($|\?)/i.test(item) ||
      item.startsWith('data:video') ||
      item.includes('video/mp4');
    return {
      url: item,
      name: item.split('/').pop()?.split('?')[0] || (isVid ? 'video.mp4' : 'image.jpg'),
      size: null,
      formattedSize: '',
      type: isVid ? 'video' : 'image',
    };
  }
  return {
    url: item.url || '',
    name: item.name || '',
    size: item.size || null,
    formattedSize: item.formattedSize || (item.size ? formatFileSize(item.size) : ''),
    type: item.type || (/\.(mp4|webm|mov|ogg)($|\?)/i.test(item.url || '') ? 'video' : 'image'),
  };
};

export function CardDetailEditor({
  card,
  onBack,
  onUpdateCard,
  onDeleteCard,
  activeTheme,
}) {
  const cardSettings =
    typeof card?.settings === 'string'
      ? (() => {
          try {
            return JSON.parse(card.settings);
          } catch {
            return {};
          }
        })()
      : card?.settings || {};

  const isMaps =
    card?.type === 'maps' ||
    cardSettings.platform === 'maps' ||
    Boolean(card?.url && /maps\.google|maps\.app\.goo\.gl/i.test(card.url));

  const isReviews =
    card?.type === 'reviews' ||
    Boolean(cardSettings.rating || cardSettings.reviewCount || cardSettings.reviewsCount) ||
    (card?.title || '').toLowerCase().includes('review');

  const isMenu =
    card?.type === 'menu' ||
    card?.type === 'resume' ||
    cardSettings.platform === 'menu' ||
    Boolean(cardSettings.isPdf) ||
    Boolean(cardSettings.pdfName) ||
    Boolean(card?.url && /\.pdf($|\?)/i.test(card.url)) ||
    Boolean(card?.url && card.url.startsWith('data:application/pdf')) ||
    (card?.title || '').toLowerCase().includes('resume') ||
    (card?.title || '').toLowerCase().includes('menu');

  const isGallery =
    !isMenu && (
      card?.type === 'gallery' ||
      cardSettings.platform === 'gallery' ||
      Boolean(cardSettings.images && cardSettings.images.length > 0) ||
      (card?.title || '').toLowerCase().includes('gallery')
    );

  const MAX_GALLERY_ITEMS = 10;
  const MAX_GALLERY_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit per container
  const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit for PDF / resume

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'powerups' | 'insights'
  const [title, setTitle] = useState(card?.title ?? '');
  const [subtitle, setSubtitle] = useState(card?.subtitle ?? cardSettings.address ?? '');
  const [url, setUrl] = useState(card?.url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(card?.thumbnailUrl ?? '');
  const [layout, setLayout] = useState(cardSettings.layout || 'classic');
  const [rating, setRating] = useState(cardSettings.rating ?? 5.0);
  const [reviewCount, setReviewCount] = useState(cardSettings.reviewCount ?? cardSettings.reviewsCount ?? 48);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title ?? '');
      setSubtitle(card.subtitle ?? card.settings?.address ?? '');
      setUrl(card.url ?? '');
      setThumbnailUrl(card.thumbnailUrl ?? '');
      setLayout(card.settings?.layout || 'classic');
      setRating(card.settings?.rating ?? 5.0);
      setReviewCount(card.settings?.reviewCount ?? card.settings?.reviewsCount ?? 48);
    }
  }, [card?.id]);

  if (!card) return null;

  const handleTitleChange = (val) => {
    setTitle(val);
    onUpdateCard(card.id, { title: val });
  };

  const handleSubtitleChange = (val) => {
    setSubtitle(val);
    // The address belongs to a map card. Writing the description there made
    // every other card look like a map card and showed the wrong thing.
    const settings = { ...(card.settings || {}) };
    if (isMaps) {
      settings.address = val;
    } else {
      delete settings.address;
    }
    onUpdateCard(card.id, { subtitle: val, settings });
  };

  const handleRatingChange = (val) => {
    const num = parseFloat(val) || 0;
    setRating(val);
    const count = reviewCount || 48;
    const newSubtitle = `${val} ★ (${count} reviews)`;
    setSubtitle(newSubtitle);
    onUpdateCard(card.id, {
      subtitle: newSubtitle,
      settings: {
        ...(card.settings || {}),
        rating: num,
        reviewCount: parseInt(count, 10),
        reviewsCount: parseInt(count, 10),
      },
    });
  };

  const handleReviewCountChange = (val) => {
    const count = parseInt(val, 10) || 0;
    setReviewCount(val);
    const r = rating || 5.0;
    const newSubtitle = `${r} ★ (${val} reviews)`;
    setSubtitle(newSubtitle);
    onUpdateCard(card.id, {
      subtitle: newSubtitle,
      settings: {
        ...(card.settings || {}),
        rating: parseFloat(r),
        reviewCount: count,
        reviewsCount: count,
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
      layout: newLayout,
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
    setPdfError('');

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setPdfError(`File size exceeds 50 MB limit (${formatFileSize(file.size)}). Please choose a file under 50 MB.`);
      e.target.value = '';
      return;
    }

    const fileName = file.name;
    const formattedSize = formatFileSize(file.size);
    const docLabel = (card?.title || '').toLowerCase().includes('resume') ? 'Resume' : 'Menu';

    setIsUploading(true);
    setUploadStatus(`Uploading ${docLabel} (${fileName} · ${formattedSize})...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setUrl(dataUrl);
        setSubtitle(`${docLabel} (${fileName})`);
        onUpdateCard(card.id, {
          url: dataUrl,
          subtitle: `${docLabel} (${fileName})`,
          settings: {
            ...(card.settings || {}),
            isPdf: true,
            pdfName: fileName,
            pdfSize: formattedSize,
            pdfUrl: dataUrl,
            needsSetup: false,
          },
        });

        // Upload PDF to Supabase Storage CDN for faster streaming & smaller payloads
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ file: dataUrl, filename: file.name, folder: 'menus' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.url) {
              setUrl(data.url);
              onUpdateCard(card.id, {
                url: data.url,
                settings: {
                  ...(card.settings || {}),
                  isPdf: true,
                  pdfName: fileName,
                  pdfSize: formattedSize,
                  pdfUrl: data.url,
                  needsSetup: false,
                },
              });
            }
          }
        } catch {
          // Local dataUrl remains functional if offline/network fails
        } finally {
          setIsUploading(false);
          setUploadStatus('');
        }
      } else {
        setIsUploading(false);
        setUploadStatus('');
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setUploadStatus('');
      setPdfError('Failed to read PDF document.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGallerySelect = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;
    setGalleryError('');

    const existing = (cardSettings.images || []).map(normalizeGalleryItem).filter(Boolean);
    const existingBytes = existing.reduce((acc, it) => acc + (it.size || 0), 0);

    if (existing.length >= MAX_GALLERY_ITEMS) {
      setGalleryError(`Container limit reached: this gallery box can have at most ${MAX_GALLERY_ITEMS} photos/videos.`);
      if (e.target) e.target.value = '';
      return;
    }

    // Limit files to remaining available slots (max 10)
    const availableSlots = MAX_GALLERY_ITEMS - existing.length;
    let files = rawFiles.slice(0, availableSlots);
    if (rawFiles.length > availableSlots) {
      setGalleryError(`Maximum ${MAX_GALLERY_ITEMS} items allowed per gallery. Only the first ${availableSlots} files were selected.`);
    }

    // Enforce 50 MB utmost storage limit per box
    let runningBytes = existingBytes;
    const acceptedFiles = [];
    for (const f of files) {
      if (runningBytes + f.size > MAX_GALLERY_SIZE_BYTES) {
        setGalleryError(`Utmost storage limit of 50 MB reached. Some large files were skipped.`);
        break;
      }
      runningBytes += f.size;
      acceptedFiles.push(f);
    }

    if (!acceptedFiles.length) {
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadStatus(`Preparing ${acceptedFiles.length} ${acceptedFiles.length === 1 ? 'file' : 'files'}...`);

    const readAsDataUrl = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

    try {
      const newItems = [];
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
        setUploadStatus(`Uploading ${i + 1} of ${acceptedFiles.length}: ${file.name} (${formatFileSize(file.size)})...`);

        const dataUrl = await readAsDataUrl(file);
        if (!dataUrl) continue;

        let finalUrl = dataUrl;
        // Upload to backend Supabase storage CDN
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              file: dataUrl,
              filename: file.name,
              folder: 'gallery',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.url) {
              finalUrl = data.url;
            }
          }
        } catch (uploadErr) {
          console.warn('Upload fallback to dataUrl', uploadErr);
        }

        newItems.push({
          url: finalUrl,
          name: file.name,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          type: isVid ? 'video' : 'image',
        });
      }

      if (newItems.length > 0) {
        const combined = [...existing, ...newItems];
        const totalSize = combined.reduce((acc, it) => acc + (it.size || 0), 0);
        const sizeTag = totalSize > 0 ? ` · ${formatFileSize(totalSize)}` : '';
        const newSubtitle = `Gallery · ${combined.length} items${sizeTag}`;

        setSubtitle(newSubtitle);
        onUpdateCard(card.id, {
          subtitle: newSubtitle,
          thumbnailUrl: card.thumbnailUrl || combined[0]?.url,
          settings: {
            ...cardSettings,
            images: combined,
            totalSizeBytes: totalSize,
            needsSetup: false,
          },
        });
      }
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveGalleryItem = (indexToRemove) => {
    setGalleryError('');
    const existing = (cardSettings.images || []).map(normalizeGalleryItem).filter(Boolean);
    const updated = existing.filter((_, idx) => idx !== indexToRemove);
    const totalSize = updated.reduce((acc, it) => acc + (it.size || 0), 0);
    const sizeTag = totalSize > 0 ? ` · ${formatFileSize(totalSize)}` : '';
    const newSubtitle = updated.length > 0 ? `Gallery · ${updated.length} items${sizeTag}` : 'Gallery · 0 items';

    setSubtitle(newSubtitle);
    onUpdateCard(card.id, {
      subtitle: newSubtitle,
      thumbnailUrl: updated[0]?.url || '',
      settings: {
        ...cardSettings,
        images: updated,
        totalSizeBytes: totalSize,
      },
    });
  };

  const pageTitle = isMaps ? 'Maps' : isGallery ? 'Gallery' : (title || 'Link');

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
                  Google Maps Location Card
                </div>
                <div className="text-[11px] text-[#3B82F6]">
                  Displays your location pin, address, and directions on your IndiaTaps.
                </div>
              </div>
            </div>
          )}

          {/* Info Banner for Reviews */}
          {isReviews && (
            <div className="bg-[#FEFCE8] border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-[#854D0E]">
                  Google Reviews Card
                </div>
                <div className="text-[11px] text-[#A16207]">
                  Customize your business rating score, review count, and link directly to your Google review page.
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

          {/* Info Banner for Gallery */}
          {isGallery && (
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-[#1E40AF]">
                  Photo & Video Gallery
                </div>
                <div className="text-[11px] text-[#3B82F6]">
                  Upload pictures and videos from your device. In your profile, tapping this card smoothly expands them in full view.
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
                  {isMaps ? 'Place or Business Name' : isReviews ? 'Business / Place Name' : 'Title'}
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder={isReviews ? 'e.g. Riyast Cafe' : isMaps ? 'e.g. Riyast Store' : 'Card title'}
                    className="w-full bg-transparent text-sm font-bold text-[#111111] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* If Reviews: Editable Star Rating & Total Review Count */}
            {isReviews && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                    Star Rating (1.0 - 5.0)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={rating}
                      onChange={(e) => handleRatingChange(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-[#111111] focus:outline-none"
                    />
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                    Number of Reviews
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min="1"
                      value={reviewCount}
                      onChange={(e) => handleReviewCountChange(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-[#111111] focus:outline-none"
                    />
                    <span className="text-[11px] font-bold text-gray-400 shrink-0">reviews</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtitle / Address Field */}
            <div className="space-y-1">
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                  {isMaps ? 'Location Address' : isReviews ? 'Subtitle / Reviews Preview' : 'Subtitle / Description'}
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => handleSubtitleChange(e.target.value)}
                    placeholder={
                      isMaps
                        ? 'e.g. 123 Main St, New York'
                        : isReviews
                        ? 'e.g. 5.0 ★ (48 reviews)'
                        : 'e.g. Brief description or subtitle'
                    }
                    className="w-full bg-transparent text-sm font-semibold text-[#111111] focus:outline-none"
                  />
                  {isMaps ? (
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : isReviews ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Dedicated Gallery Upload for Photos & Videos */}
            {isGallery && (() => {
              const currentGalleryItems = (cardSettings.images || []).map(normalizeGalleryItem).filter(Boolean);
              const totalGalleryBytes = currentGalleryItems.reduce((acc, it) => acc + (it.size || 0), 0);
              const galleryStoragePercent = Math.min(100, Math.round((totalGalleryBytes / MAX_GALLERY_SIZE_BYTES) * 100));
              const isGalleryFull = currentGalleryItems.length >= MAX_GALLERY_ITEMS || totalGalleryBytes >= MAX_GALLERY_SIZE_BYTES;

              return (
                <div className="space-y-3">
                  {/* Container Storage & Limit Indicator (10 files max, 50 MB max) */}
                  <div className="space-y-1.5 bg-gray-50/90 p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Gallery Items ({currentGalleryItems.length} / {MAX_GALLERY_ITEMS})</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-gray-500">
                        {formatFileSize(totalGalleryBytes) || '0 MB'} / 50 MB
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          galleryStoragePercent > 90
                            ? 'bg-red-500'
                            : galleryStoragePercent > 70
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.max(galleryStoragePercent, currentGalleryItems.length > 0 ? 5 : 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[10px] text-gray-500">
                      <span>Max 10 images/videos · Utmost storage 50 MB per box</span>
                      {currentGalleryItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateCard(card.id, {
                              subtitle: 'Gallery · 0 items',
                              thumbnailUrl: '',
                              settings: {
                                ...cardSettings,
                                images: [],
                                totalSizeBytes: 0,
                              },
                            });
                          }}
                          className="font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Warning / Error banner if limit reached */}
                  {galleryError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                      <span>{galleryError}</span>
                      <button
                        type="button"
                        onClick={() => setGalleryError('')}
                        className="p-1 text-amber-600 hover:text-black cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept=".png,.jpg,.jpeg,.mp4,.webm,.mov,.pnj,image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    onChange={handleGallerySelect}
                    className="hidden"
                  />

                  {/* Uploading progress banner & animation */}
                  {isUploading && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-blue-700 animate-pulse shadow-2xs">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs">Uploading Media...</div>
                        <div className="text-[11px] text-blue-600 truncate">{uploadStatus}</div>
                      </div>
                    </div>
                  )}

                  {/* Grid of uploaded items with MB size indicators */}
                  {currentGalleryItems.length > 0 ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {currentGalleryItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl overflow-hidden relative group border border-gray-200 bg-white shadow-2xs flex flex-col"
                          >
                            <div className="aspect-[4/3] w-full relative bg-black/5 overflow-hidden">
                              {item.type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center text-white relative">
                                  <Play className="w-6 h-6 opacity-80" />
                                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white uppercase tracking-wider">
                                    Video
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.name || `Gallery ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryItem(idx)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>

                            {/* File info footer with MB badge */}
                            <div className="p-2 bg-white flex items-center justify-between gap-1 text-[11px] border-t border-gray-100">
                              <span className="font-semibold text-gray-800 truncate" title={item.name}>
                                {item.name || `Item ${idx + 1}`}
                              </span>
                              {item.formattedSize && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-mono font-bold">
                                  {item.formattedSize}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isUploading || isGalleryFull}
                        onClick={() => galleryInputRef.current?.click()}
                        className={`w-full py-2.5 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isGalleryFull
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-600'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {isGalleryFull
                            ? 'Gallery container full (10 files / 50 MB limit reached)'
                            : 'Add more pictures / videos (.png, .jpg, .mp4)'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full p-5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/60 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-blue-600 shadow-2xs transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-xs text-gray-700 group-hover:text-black">
                        Upload Photos & Videos (.png, .jpg, .mp4)
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Max 10 files · Utmost 50 MB storage
                      </div>
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Dedicated PDF Document Upload for Restaurant Menu, Resume & Catalogs */}
            {isMenu && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-500">
                  {(card?.title || '').toLowerCase().includes('resume') ? 'Resume PDF Document' : 'Menu / Catalog / Resume PDF'}
                </label>
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept="application/pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                />

                {/* Uploading progress banner & animation matching gallery */}
                {isUploading && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-blue-700 animate-pulse shadow-2xs">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs">Uploading Document...</div>
                      <div className="text-[11px] text-blue-600 truncate">{uploadStatus}</div>
                    </div>
                  </div>
                )}

                {/* 50 MB limit error notice */}
                {pdfError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pdfError}</span>
                  </div>
                )}

                {(card.settings?.pdfName || (url && (url.startsWith('data:application/pdf') || url.includes('.pdf') || card.settings?.isPdf))) ? (
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs space-y-0">
                    {/* Visual PDF document preview container matching gallery media preview */}
                    <div
                      className="relative w-full h-72 sm:h-80 bg-gray-50 border-b border-gray-100 overflow-hidden flex items-center justify-center"
                      data-lenis-prevent
                    >
                      <PdfViewer
                        url={url}
                        title={card.settings?.pdfName || 'Uploaded PDF'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUrl('');
                          onUpdateCard(card.id, {
                            url: '',
                            subtitle: '',
                            settings: {
                              ...(card.settings || {}),
                              isPdf: false,
                              pdfName: null,
                              pdfUrl: null,
                              pdfSize: null,
                            },
                          });
                        }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer shadow-md z-20"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Metadata & Actions footer matching gallery styling */}
                    <div className="p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#EF4444] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#111111] truncate" title={card.settings?.pdfName || 'Document.pdf'}>
                            {card.settings?.pdfName || 'Document.pdf'}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                            <span>Uploaded Document</span>
                            {card.settings?.pdfSize && (
                              <>
                                <span>•</span>
                                <span className="font-mono font-bold text-gray-700">{card.settings.pdfSize}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-black hover:bg-gray-800 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
                        >
                          Replace PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#EA580C] bg-gray-50/60 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-[#EA580C] shadow-2xs transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-xs text-gray-800 group-hover:text-black">
                      {(card?.title || '').toLowerCase().includes('resume') ? 'Upload Resume PDF' : 'Upload Menu / Catalog PDF'}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Select a .pdf file from your computer or phone (up to 50 MB)
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* URL Field - hidden for Gallery & PDF Documents since they use uploaded files */}
            {!isGallery && !isMenu && (
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-colors">
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">
                  {isMaps
                    ? 'Google Maps Link (URL)'
                    : isReviews
                    ? 'Google Reviews Page Link (URL)'
                    : 'Destination URL'}
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={
                      isMaps
                        ? 'https://maps.google.com/?q=...'
                        : isReviews
                        ? 'https://g.page/r/.../review or https://maps.google.com/...'
                        : 'https://example.com'
                    }
                    className="w-full bg-transparent text-sm font-semibold text-[#111111] focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
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
