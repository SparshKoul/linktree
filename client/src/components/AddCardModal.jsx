import { useState, useRef } from 'react';
import {
  X,
  Search,
  Link2,
  Loader2,
  ChevronRight,
  LayoutGrid,
  Tag,
  MessageSquare,
  Send,
  Heart,
  Play,
  Lightbulb,
  Contact,
  MoreHorizontal,
  Image as ImageIcon,
  Instagram,
  Music,
  DownloadCloud,
  MapPin,
  CalendarClock,
  Star,
  Utensils,
  FileText,
  Phone,
  Mail,
  ShoppingBag,
  Type,
} from 'lucide-react';

export const getUrlMetadata = (rawQuery) => {
  const typed = (rawQuery || '').trim();
  const clean = typed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const lower = clean.toLowerCase();

  // The whole address the owner typed is kept — the path is never cut off.
  // A pasted profile or video links to that profile or video, not to the
  // site's home page.
  const fullUrl = /^https?:\/\//i.test(typed) ? typed : `https://${clean}`;

  if (lower.includes('github.com')) {
    return {
      title: 'GitHub · Change is constant. GitHub keeps you ahead. · GitHub · GitHub',
      subtitle: 'github.com',
      url: fullUrl,
    };
  }
  if (lower.includes('instagram.com')) {
    return {
      title: 'Instagram · Capture and Share the World\'s Moments',
      subtitle: 'instagram.com',
      url: fullUrl,
    };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      title: 'YouTube · Enjoy the videos and music you love',
      subtitle: 'youtube.com',
      url: fullUrl,
    };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return {
      title: 'X · It\'s what\'s happening / X',
      subtitle: clean.split('/')[0] || 'x.com',
      url: `https://${clean}`,
    };
  }
  if (lower.includes('linkedin.com')) {
    return {
      title: 'LinkedIn: Log In or Sign Up',
      subtitle: 'linkedin.com',
      url: fullUrl,
    };
  }
  if (lower.includes('spotify.com')) {
    return {
      title: 'Spotify · Web Player: Music for everyone',
      subtitle: 'spotify.com',
      url: fullUrl,
    };
  }

  const domain = clean.split('/')[0] || clean;
  const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
  return {
    title: `${capitalized} · Official Link`,
    subtitle: domain,
    url: fullUrl,
  };
};

/**
 * Does this search text mean the owner is looking for a place (Maps or
 * Reviews)? Only whole words count: "marketplace" and "workplace" are not
 * searches for a place. And anything that already looks like a web address
 * is a link, never a place — the owner pasting a URL wants that URL.
 * @param {string} query the text typed in the Add search bar
 * @returns {boolean}
 */
export function isMapsSearch(query) {
  const typed = (query || '').trim();
  if (!typed) return false;
  // A web address (with a dot and no spaces) is always added as a link.
  if (/^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i.test(typed)) return false;
  return /\b(maps|location|place|goo\.gl)\b/i.test(typed);
}

export function AddCardModal({ isOpen, onClose, onAddCard, onSelectCustomCard }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('suggested');
  const [loadingResultId, setLoadingResultId] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelectMaps = async (type = 'maps') => {
    setLoadingResultId(type);

    // Only what the owner typed is kept. Nothing is made up for them:
    // no rating, no number of reviews, no address.
    const typed = query.trim();
    const isAddress = /^https?:\/\//i.test(typed);
    const mapsUrl = isAddress ? typed : '';
    const placeTitle = typed && !isAddress ? typed : '';

    // The card is added right away — no pretend loading.
    if (type === 'maps') {
      await onAddCard('maps', placeTitle, {
        placeName: placeTitle,
        address: '',
        subtitle: '',
        url: mapsUrl,
        layout: 'classic',
        hasMapThumbnail: true,
        isSettingUp: true,
      });
    } else {
      // Reviews
      await onAddCard('reviews', placeTitle ? `Reviews · ${placeTitle}` : 'Google Reviews', {
        placeName: placeTitle,
        subtitle: '',
        url: mapsUrl,
        layout: 'classic',
        isSettingUp: true,
      });
    }

    setLoadingResultId(null);
    onClose();
  };

  const handleSelectUrl = async (urlStr) => {
    if (!urlStr.trim()) return;
    setLoadingResultId('generic');

    const meta = getUrlMetadata(urlStr);

    await onAddCard('link', meta.title, {
      url: meta.url,
      subtitle: meta.subtitle,
      layout: 'classic',
    });

    setLoadingResultId(null);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isMapsQuery) {
        handleSelectMaps('maps');
      } else {
        handleSelectUrl(query);
      }
    }
  };

  const handleCancel = () => {
    setQuery('');
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const isMapsQuery = isMapsSearch(query);

  const isSearchActive = isFocused || query.length > 0;
  const displayTitle = query.trim() || 'Location Pin';

  const categories = [
    { id: 'suggested', label: 'Suggested', icon: Lightbulb },
    { id: 'commerce', label: 'Commerce', icon: ShoppingBag },
    { id: 'social', label: 'Social', icon: Heart },
    { id: 'media', label: 'Media', icon: Play },
    { id: 'contact', label: 'Contact', icon: Contact },
    { id: 'events', label: 'Events', icon: CalendarClock },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'view_all', label: 'View all', icon: MoreHorizontal },
  ];

  const categoryItems = {
    suggested: [
      {
        id: 'maps',
        title: 'Google Maps Location',
        desc: 'Share your store location or address',
        type: 'maps',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center shrink-0 p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4" />
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 5.31 3.06 8.52L12 11.5V2z" fill="#34A853" />
              <path d="M12 2v9.5l3.94 6.02C17.81 14.31 19 11.38 19 9c0-3.87-3.13-7-7-7z" fill="#EA4335" />
              <path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#FBBC05" />
            </svg>
          </div>
        ),
      },
      {
        id: 'reviews',
        title: 'Google Reviews',
        desc: 'Display customer ratings and reviews',
        type: 'reviews',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
        ),
      },
      {
        id: 'restaurant_menu',
        title: 'Restaurant Menu',
        desc: 'Upload a PDF menu or catalog for visitors',
        type: 'menu',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-2xs relative">
            <Utensils className="w-4 h-4" />
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[7px] px-1 py-0.5 rounded-[3px] leading-none uppercase">
              PDF
            </span>
          </div>
        ),
      },
      {
        id: 'resume_pdf',
        title: 'Resume / CV',
        desc: 'Upload your resume PDF for visitors to preview and download',
        type: 'menu',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs relative">
            <FileText className="w-4 h-4" />
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[7px] px-1 py-0.5 rounded-[3px] leading-none uppercase">
              PDF
            </span>
          </div>
        ),
      },
      {
        id: 'messaging',
        title: 'Messaging',
        desc: 'Let visitors message you directly from your IndiaTaps',
        type: 'contact',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 ml-0.5" />
          </div>
        ),
      },
      {
        id: 'instagram',
        title: 'Instagram',
        desc: 'Display your posts and reels',
        type: 'instagram',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0">
            <Instagram className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'gallery',
        title: 'Image gallery',
        desc: 'Share a gallery of images',
        type: 'gallery',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#60A5FA] text-white flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'youtube',
        title: 'YouTube',
        desc: 'Share YouTube videos on your IndiaTaps',
        type: 'video',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        ),
      },
    ],
    commerce: [
      {
        id: 'restaurant_menu',
        title: 'Restaurant Menu',
        desc: 'Upload a PDF menu or food catalog',
        type: 'menu',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-2xs relative">
            <Utensils className="w-4 h-4" />
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[7px] px-1 py-0.5 rounded-[3px] leading-none uppercase">
              PDF
            </span>
          </div>
        ),
      },
      {
        id: 'product',
        title: 'Product',
        desc: 'Sell products and physical merchandise',
        type: 'product',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'store',
        title: 'Store',
        desc: 'Display products directly on your profile',
        type: 'store',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        ),
      },
    ],
    events: [
      {
        id: 'events',
        title: 'Events',
        desc: 'Show upcoming dates and sell tickets',
        type: 'events',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
        ),
      },
    ],
    text: [
      {
        id: 'header',
        title: 'Header',
        desc: 'Add a title to group and organize your links',
        type: 'header',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center shrink-0">
            <Type className="w-4 h-4" />
          </div>
        ),
      },
    ],
    social: [
      {
        id: 'instagram',
        title: 'Instagram',
        desc: 'Display your posts, reels, and profile',
        type: 'instagram',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0">
            <Instagram className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'youtube',
        title: 'YouTube',
        desc: 'Share YouTube videos on your IndiaTaps',
        type: 'video',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        ),
      },
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        desc: 'Chat directly with visitors via WhatsApp',
        type: 'whatsapp',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'reviews',
        title: 'Google Reviews',
        desc: 'Show ratings and collect customer reviews',
        type: 'reviews',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
        ),
      },
    ],
    contact: [
      {
        id: 'phone',
        title: 'Phone Number',
        desc: 'Let visitors call or text you directly',
        type: 'phone',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
        ),
      },
      {
        id: 'email',
        title: 'Mail',
        desc: 'Let visitors send you an email directly',
        type: 'email',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        ),
      },
    ],
    media: [
      {
        id: 'youtube',
        title: 'YouTube',
        desc: 'Share YouTube videos on your IndiaTaps',
        type: 'video',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        ),
      },
      {
        id: 'gallery',
        title: 'Image gallery',
        desc: 'Share a gallery of Images',
        type: 'gallery',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-[#60A5FA] text-white flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
        ),
      },
    ],
  };

  const displayedIntegrations =
    activeCategory === 'view_all'
      ? [
          ...categoryItems.suggested,
          ...categoryItems.contact,
        ]
      : categoryItems[activeCategory] || categoryItems.suggested;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end lg:justify-center lg:items-center lg:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-[28px] sm:rounded-t-[32px] lg:rounded-[32px] w-full lg:max-w-[760px] p-4 sm:p-6 lg:p-7 space-y-3.5 lg:space-y-4 text-[#111111] shadow-2xl relative border-t border-gray-100 lg:border max-h-[94vh] lg:max-h-[600px] lg:min-h-[500px] flex flex-col justify-start animate-in slide-in-from-bottom duration-200 lg:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Top Drag Handle Bar */}
        <div className="lg:hidden w-11 h-1 bg-[#D1D5DB] rounded-full mx-auto mt-0.5 mb-2 shrink-0" />

        {/* Header — visible on all sizes */}
        <div className="flex items-center justify-between shrink-0">
          <div className="w-7" />
          <h2 className="font-extrabold text-sm sm:text-base text-[#111111]">
            Add
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Top Input Bar: "Paste a link or search..." */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 rounded-2xl lg:rounded-full bg-[#EAEAEA] lg:bg-[#F3F3F1] text-xs">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste a link or search..."
              className="w-full bg-transparent text-xs font-semibold text-[#111111] focus:outline-none placeholder:text-gray-500"
            />
          </div>

          {isSearchActive && (
            <button
              onClick={handleCancel}
              className="text-xs font-bold text-gray-700 hover:text-black transition-colors shrink-0 pr-1 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Modal Body */}
        {isSearchActive ? (
          query ? (
            isMapsQuery ? (
              /* Google Maps 2 Results State matching Image 0 & 1 */
              <div className="space-y-2 pt-1 flex-1">
                <div className="text-[11px] font-semibold text-gray-500 px-1">
                  2 results
                </div>

                {/* Result 1: Google Maps */}
                <div
                  onClick={() => handleSelectMaps('maps')}
                  className="p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center shrink-0 p-1 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4" />
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 5.31 3.06 8.52L12 11.5V2z" fill="#34A853" />
                        <path d="M12 2v9.5l3.94 6.02C17.81 14.31 19 11.38 19 9c0-3.87-3.13-7-7-7z" fill="#EA4335" />
                        <path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#FBBC05" />
                      </svg>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-xs text-[#111111]">Google Maps</div>
                      <div className="text-[11px] text-gray-500 truncate">{displayTitle}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-400">
                    {loadingResultId === 'maps' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                    )}
                  </div>
                </div>

                {/* Result 2: Reviews */}
                <div
                  onClick={() => handleSelectMaps('reviews')}
                  className="p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-[#4B5563] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-xs text-[#111111]">Reviews</div>
                      <div className="text-[11px] text-gray-500 truncate">{displayTitle}</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-gray-400">
                    {loadingResultId === 'reviews' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Generic 1 result view */
              <div className="space-y-2 pt-1 flex-1">
                <div className="text-[11px] font-semibold text-gray-500 px-1">
                  1 result
                </div>

                {(() => {
                  const meta = getUrlMetadata(query);
                  return (
                    <div
                      onClick={() => handleSelectUrl(query)}
                      className="p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-purple-50 text-[#7033FF] flex items-center justify-center shrink-0 border border-purple-200 group-hover:scale-105 transition-transform">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-xs text-[#111111]">Link</div>
                          <div className="text-[11px] text-gray-500 truncate">{meta.title}</div>
                        </div>
                      </div>

                      <div className="shrink-0 text-gray-400">
                        {loadingResultId === 'generic' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#7033FF]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            <div className="flex-1" />
          )
        ) : (
          /* Default Explorer View */
          <>
            {/* Explorer View — shared layout for mobile + desktop */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 pt-1 flex-1 overflow-hidden min-h-0">
              {/* Left Column: Categories List.
                  On a phone they are a row of chips that scrolls sideways, so
                  the list below keeps the full width. */}
              <div className="flex gap-2 lg:block lg:w-40 lg:space-y-0.5 shrink-0 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-0.5">
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex shrink-0 items-center gap-2 lg:w-full lg:gap-2.5 px-3 lg:px-3 py-2 lg:py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFEFEF] text-black font-bold'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                      <span className="whitespace-nowrap lg:truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: 4 Quick Tiles + Scrollable Integrations */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[58vh] lg:max-h-[360px] card-scrollbar min-h-0">
                {/* 4 Quick Tiles */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      onAddCard('collapsible', 'My Collection');
                      onClose();
                    }}
                    className="bg-[#F4F4F5] hover:bg-[#E8E8EA] p-2.5 lg:p-3 rounded-2xl flex flex-col justify-between h-[72px] lg:h-[88px] text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#111111]">Collection</span>
                    <LayoutGrid className="w-4 h-4 lg:w-5 lg:h-5 text-black stroke-[1.8]" />
                  </button>

                  <button
                    onClick={() => {
                      setIsFocused(true);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="bg-[#F4F4F5] hover:bg-[#E8E8EA] p-2.5 lg:p-3 rounded-2xl flex flex-col justify-between h-[72px] lg:h-[88px] text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#111111]">Link</span>
                    <Link2 className="w-4 h-4 lg:w-5 lg:h-5 text-black stroke-[1.8]" />
                  </button>

                  <button
                    onClick={() => {
                      onAddCard('product', 'Special Product', { price: '$49.00' });
                      onClose();
                    }}
                    className="bg-[#F4F4F5] hover:bg-[#E8E8EA] p-2.5 lg:p-3 rounded-2xl flex flex-col justify-between h-[72px] lg:h-[88px] text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#111111]">Product</span>
                    <Tag className="w-4 h-4 lg:w-5 lg:h-5 text-black stroke-[1.8]" />
                  </button>

                  <button
                    onClick={() => {
                      onAddCard('contact_form', 'Contact Form');
                      onClose();
                    }}
                    className="bg-[#F4F4F5] hover:bg-[#E8E8EA] p-2.5 lg:p-3 rounded-2xl flex flex-col justify-between h-[72px] lg:h-[88px] text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#111111]">Form</span>
                    <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-black stroke-[1.8]" />
                  </button>
                </div>

                {/* View all link */}
                <button
                  onClick={() => setActiveCategory('view_all')}
                  className="text-xs font-semibold text-[#111111] hover:underline cursor-pointer text-left px-0.5"
                >
                  View all
                </button>

              {/* Category-specific Integrations */}
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-[#111111] pb-1">
                  {categories.find((c) => c.id === activeCategory)?.label || 'Suggested'}
                </h4>

                <div className="space-y-1">
                  {displayedIntegrations.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'maps') {
                          onAddCard('maps', 'Google Maps Location', {
                            placeName: '',
                            address: '',
                            subtitle: '',
                            url: '',
                            layout: 'classic',
                            hasMapThumbnail: true,
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'whatsapp') {
                          onAddCard('whatsapp', 'WhatsApp Us', {
                            url: '',
                            platform: 'whatsapp',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'reviews') {
                          onAddCard('reviews', 'Google Reviews', {
                            placeName: '',
                            subtitle: '',
                            url: '',
                            layout: 'classic',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'phone') {
                          onAddCard('phone', 'Phone Number', {
                            url: '',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'email') {
                          onAddCard('email', 'Mail', {
                            url: '',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'restaurant_menu' || item.id === 'menu') {
                          onAddCard('menu', 'Restaurant Menu', {
                            url: '',
                            platform: 'menu',
                            isPdf: true,
                            pdfName: '',
                            subtitle: '',
                            layout: 'classic',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'resume_pdf' || item.id === 'resume') {
                          onAddCard('menu', 'Resume / CV', {
                            url: '',
                            platform: 'menu',
                            isPdf: true,
                            pdfName: '',
                            subtitle: '',
                            layout: 'classic',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'gallery') {
                          onAddCard('gallery', 'Gallery', {
                            url: '',
                            platform: 'gallery',
                            subtitle: '',
                            images: [],
                            layout: 'classic',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'youtube') {
                          onAddCard('video', 'YouTube', {
                            url: '',
                            platform: 'youtube',
                            isSettingUp: true,
                          });
                          onClose();
                        } else if (item.id === 'instagram') {
                          onAddCard('instagram', 'Instagram', {
                            url: '',
                            platform: 'instagram',
                            isSettingUp: true,
                          });
                          onClose();
                        } else {
                          onAddCard(item.type, item.title, {
                            url: '',
                            isSettingUp: true,
                          });
                          onClose();
                        }
                      }}
                      className="py-3 px-2 rounded-xl hover:bg-[#F4F4F5] flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.renderIcon()}
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-bold text-xs text-[#111111] leading-snug">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-gray-500 leading-tight truncate">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
