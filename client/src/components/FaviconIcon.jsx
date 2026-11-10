import React, { useState } from 'react';
import {
  Link2,
  Globe,
  Instagram,
  Youtube,
  Music,
  Share2,
  Mail,
  Phone,
  MessageCircle,
  Play,
  ShoppingCart,
  Calendar,
  Layers,
  FileText,
  Star,
  Utensils,
  Folder,
} from 'lucide-react';

export function FaviconIcon({ card, className = 'w-5 h-5', containerClassName = 'w-10 h-10' }) {
  const [imgError, setImgError] = useState(false);
  const radius = containerClassName.includes('rounded-') ? '' : 'rounded-xl';

  const url = (card?.url || '').toLowerCase();
  const type = card?.type || 'link';

  // 1. Direct custom thumbnail URL
  if (card?.thumbnailUrl && !imgError) {
    return (
      <div className={`${containerClassName} ${radius} border border-gray-200/40 bg-white shrink-0 overflow-hidden shadow-2xs`}>
        <img
          src={card.thumbnailUrl}
          alt={card.title || 'Thumbnail'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 1b. Collapsible / Collection Folder
  if (type === 'collapsible' || type === 'collection' || type === 'folder') {
    return (
      <div className={`${containerClassName} ${radius} bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 shadow-2xs`}>
        <Folder className={className} />
      </div>
    );
  }

  // 1c. Header or Aa text card
  if (type === 'header' || type === 'text' || card?.title?.toLowerCase() === 'my link') {
    return (
      <div className={`${containerClassName} ${radius} bg-gray-100 text-gray-800 flex items-center justify-center shrink-0 border border-gray-200 font-bold text-xs select-none`}>
        Aa
      </div>
    );
  }

  // 2. Maps type or map URL
  if (
    type === 'maps' ||
    Boolean(card?.settings?.address) ||
    url.includes('maps.app.goo.gl') ||
    url.includes('google.com/maps')
  ) {
    return (
      <div className={`${containerClassName} ${radius} border border-gray-200/40 bg-[#E5E3DF] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative`}>
        <svg className="w-full h-full" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" fill="#E8ECEF" />
          <path d="M0 14h40M0 26h40M12 0v40M26 0v40" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M0 20l40 -6M18 0l6 40" stroke="#FDE68A" strokeWidth="2" />
          <rect x="15" y="4" width="9" height="7" rx="1.5" fill="#BBF7D0" />
          <rect x="2" y="24" width="8" height="6" rx="1.5" fill="#BBF7D0" />
          <circle cx="20" cy="18" r="4.5" fill="#EF4444" />
          <circle cx="20" cy="18" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 3. Reviews type
  if (type === 'reviews' || card?.settings?.rating) {
    return (
      <div className={`${containerClassName} ${radius} bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200`}>
        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
      </div>
    );
  }

  // 4. Restaurant Menu type
  if (type === 'menu' || card?.settings?.platform === 'menu' || card?.settings?.isPdf || url.endsWith('.pdf')) {
    return (
      <div className={`${containerClassName} ${radius} bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-2xs relative`}>
        <Utensils className={className} />
        {(card?.settings?.isPdf || url.endsWith('.pdf')) && (
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[7px] px-1 py-0.5 rounded-[3px] leading-none shadow-xs uppercase">
            PDF
          </span>
        )}
      </div>
    );
  }

  // 5. Phone
  if (type === 'phone' || url.startsWith('tel:')) {
    return (
      <div className={`${containerClassName} ${radius} bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <Phone className={className} />
      </div>
    );
  }

  // 6. Email
  if (type === 'email' || type === 'mail' || url.startsWith('mailto:')) {
    return (
      <div className={`${containerClassName} ${radius} bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <Mail className={className} />
      </div>
    );
  }

  // Extract domain for favicon API and known providers
  const getDomain = (rawUrl) => {
    try {
      if (!rawUrl || rawUrl === 'https://') return '';
      const formatted = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const parsed = new URL(formatted);
      return parsed.hostname.toLowerCase();
    } catch {
      return '';
    }
  };

  const domain = getDomain(card?.url);

  // 5. GitHub
  if (domain.includes('github.com')) {
    return (
      <div className={`${containerClassName} ${radius} bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}>
        <svg className="w-5 h-5 text-[#111111] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      </div>
    );
  }

  // 6. Instagram
  if (domain.includes('instagram.com') || type === 'instagram') {
    return (
      <div className={`${containerClassName} ${radius} bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <Instagram className={className} />
      </div>
    );
  }

  // 7. YouTube
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return (
      <div className={`${containerClassName} ${radius} bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <Play className={`${className} fill-white ml-0.5`} />
      </div>
    );
  }

  // 8. Spotify / Music
  if (domain.includes('spotify.com') || type === 'music') {
    return (
      <div className={`${containerClassName} ${radius} bg-[#1DB954] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <Music className={className} />
      </div>
    );
  }

  // 9. WhatsApp
  if (domain.includes('wa.me') || domain.includes('whatsapp.com')) {
    return (
      <div className={`${containerClassName} ${radius} bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <MessageCircle className={className} />
      </div>
    );
  }

  // 10. Other domain with Google Favicon API
  if (domain && !imgError) {
    return (
      <div className={`${containerClassName} ${radius} bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt="Favicon"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback Link Icon
  return (
    <div className={`${containerClassName} ${radius} bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 border border-gray-200`}>
      <Link2 className={className} />
    </div>
  );
}
