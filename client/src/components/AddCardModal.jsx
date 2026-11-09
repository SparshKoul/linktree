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
  Phone,
  Mail,
  ShoppingBag,
  Type,
} from 'lucide-react';

export const getUrlMetadata = (rawQuery) => {
  const clean = (rawQuery || '').trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const lower = clean.toLowerCase();

  if (lower.includes('github.com')) {
    return {
      title: 'GitHub · Change is constant. GitHub keeps you ahead. · GitHub · GitHub',
      subtitle: 'github.com',
      url: 'https://github.com',
    };
  }
  if (lower.includes('instagram.com')) {
    return {
      title: 'Instagram · Capture and Share the World\'s Moments',
      subtitle: 'instagram.com',
      url: 'https://instagram.com',
    };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      title: 'YouTube · Enjoy the videos and music you love',
      subtitle: 'youtube.com',
      url: 'https://youtube.com',
    };
  }
  if (lower.includes('tiktok.com')) {
    return {
      title: 'TikTok · Make Your Day',
      subtitle: 'tiktok.com',
      url: 'https://tiktok.com',
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
      url: 'https://linkedin.com',
    };
  }
  if (lower.includes('spotify.com')) {
    return {
      title: 'Spotify · Web Player: Music for everyone',
      subtitle: 'spotify.com',
      url: 'https://spotify.com',
    };
  }

  const domain = clean.split('/')[0] || clean;
  const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
  return {
    title: `${capitalized} · Official Link`,
    subtitle: domain,
    url: /^https?:\/\//i.test((rawQuery || '').trim()) ? (rawQuery || '').trim() : `https://${clean}`,
  };
};

export function AddCardModal({ isOpen, onClose, onAddCard, onSelectCustomCard }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('suggested');
  const [loadingResultId, setLoadingResultId] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelectMaps = async (type = 'maps') => {
    setLoadingResultId(type);

    const mapsUrl = query.trim() || 'https://maps.google.com';
    const placeTitle = query.trim() || 'Location Pin';
    const placeAddress = query.trim() || 'Location address';

    setTimeout(async () => {
      if (type === 'maps') {
        const cardData = {
          type: 'maps',
          title: placeTitle,
          subtitle: placeAddress,
          url: mapsUrl,
          settings: {
            placeName: placeTitle,
            address: placeAddress,
            layout: 'classic',
            hasMapThumbnail: true,
            isSettingUp: true,
          },
        };
        await onAddCard('maps', placeTitle, cardData.settings);
      } else {
        // Reviews
        const cardData = {
          type: 'reviews',
          title: `Reviews · ${placeTitle}`,
          subtitle: '4.8 ★ (142 reviews)',
          url: mapsUrl,
          settings: {
            placeName: placeTitle,
            rating: 4.8,
            reviewCount: 142,
            hasMapThumbnail: true,
          },
        };
        await onAddCard('reviews', `Reviews · ${placeTitle}`, cardData.settings);
      }

      setLoadingResultId(null);
      onClose();
    }, 450);
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

  const isMapsQuery =
    query.toLowerCase().includes('maps') ||
    query.toLowerCase().includes('goo.gl') ||
    query.toLowerCase().includes('location') ||
    query.toLowerCase().includes('place');

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
        id: 'messaging',
        title: 'Messaging',
        desc: 'Let visitors message you directly from your Linktree',
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
        id: 'tiktok',
        title: 'TikTok',
        desc: 'Share your TikToks on your Linktree',
        type: 'video',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.9 2.9 0 0 1 2.314-4.644c.314 0 .619.05.904.143V9.32a6.326 6.326 0 0 0-.904-.065c-3.504 0-6.347 2.842-6.347 6.347 0 3.503 2.843 6.345 6.347 6.345 3.42 0 6.21-2.709 6.34-6.104l.007-.243V8.895a8.163 8.163 0 0 0 4.76 1.524V6.986a4.832 4.832 0 0 1-1.001-.3z" />
            </svg>
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
        desc: 'Share YouTube videos on your Linktree',
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
        id: 'tiktok',
        title: 'TikTok',
        desc: 'Share your TikToks on your IndiaTaps',
        type: 'video',
        renderIcon: () => (
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold text-xs tracking-tighter">
            TT
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[32px] w-full max-w-[720px] p-6 sm:p-7 space-y-5 text-[#111111] shadow-2xl relative border border-gray-100 min-h-[460px] flex flex-col justify-start">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="w-6" />
          <h2 className="font-extrabold text-sm sm:text-base text-[#111111]">
            Add
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Top Input Bar: "Paste a link or search..." */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#F3F3F1] text-xs">
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
          <div className="flex gap-6 pt-1 flex-1 overflow-hidden">
            {/* Left Column: Categories List */}
            <div className="w-36 space-y-1 shrink-0 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F3F3F1] text-black font-extrabold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0 text-gray-700" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: 4 Quick Tiles + Scrollable Suggested Integrations */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[340px]">
              {/* 4 Quick Tiles */}
              <div className="grid grid-cols-4 gap-2.5">
                <button
                  onClick={() => {
                    onAddCard('collapsible', 'My Collection');
                    onClose();
                  }}
                  className="bg-[#F6F6F7] hover:bg-[#EAEAEA] p-3 rounded-2xl flex flex-col justify-between h-20 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-[#111111]">Collection</span>
                  <LayoutGrid className="w-4 h-4 text-black stroke-[2.2]" />
                </button>

                <button
                  onClick={() => {
                    setIsFocused(true);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="bg-[#F6F6F7] hover:bg-[#EAEAEA] p-3 rounded-2xl flex flex-col justify-between h-20 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-[#111111]">Link</span>
                  <Link2 className="w-4 h-4 text-black stroke-[2.2]" />
                </button>

                <button
                  onClick={() => {
                    onAddCard('product', 'Special Product', { price: '$49.00' });
                    onClose();
                  }}
                  className="bg-[#F6F6F7] hover:bg-[#EAEAEA] p-3 rounded-2xl flex flex-col justify-between h-20 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-[#111111]">Product</span>
                  <Tag className="w-4 h-4 text-black stroke-[2.2]" />
                </button>

                <button
                  onClick={() => {
                    onAddCard('contact_form', 'Contact Form');
                    onClose();
                  }}
                  className="bg-[#F6F6F7] hover:bg-[#EAEAEA] p-3 rounded-2xl flex flex-col justify-between h-20 text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-[#111111]">Form</span>
                  <MessageSquare className="w-4 h-4 text-black stroke-[2.2]" />
                </button>
              </div>

              {/* Category-specific Integrations */}
              <div className="space-y-1.5 pt-1">
                <h4 className="font-bold text-xs text-[#111111]">
                  {categories.find((c) => c.id === activeCategory)?.label || 'Suggested'}
                </h4>

                <div className="space-y-1">
                  {displayedIntegrations.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'maps') {
                          setQuery('https://maps.app.goo.gl/41pK4HQY5RHNe7qQA');
                          setIsFocused(true);
                        } else if (item.id === 'whatsapp') {
                          onAddCard('whatsapp', 'WhatsApp Us', {
                            url: 'https://wa.me/1234567890',
                            platform: 'whatsapp',
                          });
                          onClose();
                        } else if (item.id === 'reviews') {
                          onAddCard('reviews', 'Google Reviews', {
                            url: 'https://google.com',
                            rating: 5,
                            reviewsCount: 42,
                          });
                          onClose();
                        } else if (item.id === 'phone') {
                          onAddCard('phone', 'Phone Number', {
                            url: 'tel:+1234567890',
                          });
                          onClose();
                        } else if (item.id === 'email') {
                          onAddCard('email', 'Mail', {
                            url: 'mailto:hello@example.com',
                          });
                          onClose();
                        } else if (item.id === 'restaurant_menu') {
                          onAddCard('menu', 'Restaurant Menu', {
                            url: 'https://example.com/menu',
                            platform: 'menu',
                          });
                          onClose();
                        } else if (item.id === 'youtube') {
                          onAddCard('video', 'YouTube', {
                            url: 'https://youtube.com',
                            platform: 'youtube',
                          });
                          onClose();
                        } else if (item.id === 'instagram') {
                          onAddCard('instagram', 'Instagram', {
                            url: 'https://instagram.com',
                            platform: 'instagram',
                          });
                          onClose();
                        } else {
                          onAddCard(item.type, item.title, {
                            url:
                              item.id === 'tiktok'
                                ? 'https://tiktok.com'
                                : 'https://example.com',
                          });
                          onClose();
                        }
                      }}
                      className="p-2.5 rounded-2xl hover:bg-[#F6F6F7] flex items-center justify-between transition-colors cursor-pointer group"
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
        )}
      </div>
    </div>
  );
}
