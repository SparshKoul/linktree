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
  Image as ImageIcon,
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
    card?.settings?.platform === 'maps' ||
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

  // 4b. Image & Video Gallery type
  if (type === 'gallery' || card?.settings?.platform === 'gallery' || (card?.title || '').toLowerCase().includes('gallery')) {
    return (
      <div className={`${containerClassName} ${radius} bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-2xs`}>
        <ImageIcon className={className} />
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

  // Fixed project icon for standard cards and links (no dynamic external company icons)
  return (
    <div className={`${containerClassName} ${radius} bg-[#111111] text-[#00E575] flex items-center justify-center shrink-0 shadow-2xs select-none`}>
      <span className="font-black text-sm sm:text-base leading-none">✱</span>
    </div>
  );
}
