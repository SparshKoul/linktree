import React, { useState } from 'react';
import {
  ExternalLink,
  ShoppingBag,
  Heart,
  Calendar,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Send,
  Download,
  Phone,
  MessageCircle,
  Play,
  Music,
  Lock,
  MoreVertical,
  X,
  Navigation,
} from 'lucide-react';
import { FaviconIcon } from '../components/FaviconIcon.jsx';

export function CardRenderer({ card, theme, isPreview = false }) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [msgInput, setMsgInput] = useState('');

  // Lock gate state
  const [isLocked, setIsLocked] = useState(card.lockType && card.lockType !== 'none');
  const [showLockModal, setShowLockModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [gateEmailInput, setGateEmailInput] = useState('');
  const [gateError, setGateError] = useState('');

  // Standalone Card Page Sheet state
  const [isPageOpen, setIsPageOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const btnRadius =
    theme?.buttonRadius == null || theme?.buttonRadius >= 24
      ? '9999px'
      : `${theme.buttonRadius}px`;
  const isOutline = theme?.buttonStyle === 'outline';
  const isGlass = theme?.buttonStyle === 'glass';
  const outlineColor = theme?.buttonTextColor || theme?.buttonColor || '#FFFFFF';

  const buttonStyleObj = isGlass
    ? {
        background: 'rgba(255, 255, 255, 0.16)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: theme?.buttonTextColor || '#FFFFFF',
        borderRadius: btnRadius,
        border: '1px solid rgba(255, 255, 255, 0.22)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.15)',
      }
    : isOutline
    ? {
        background: 'transparent',
        color: outlineColor,
        borderRadius: btnRadius,
        border: `1.5px solid ${outlineColor}`,
      }
    : {
        background: theme?.buttonColor || '#FFFFFF',
        color: theme?.buttonTextColor || '#111111',
        borderRadius: btnRadius,
        border: '1px solid rgba(0,0,0,0.06)',
      };

  const animClass =
    card.animation === 'pulse'
      ? 'animate-pulse'
      : card.animation === 'shake'
      ? 'animate-bounce'
      : '';

  // Incomplete / Unconfigured setup card: hidden on live preview if no title and no url
  const isUnconfigured =
    (!card.title || card.title.trim() === '') &&
    (!card.url || card.url.trim() === '' || card.url.trim() === 'https://');

  if (isPreview && isUnconfigured) {
    return null;
  }

  const handleLinkClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      setShowLockModal(true);
      return;
    }
    // Record click analytics in Supabase
    if (card?.id) {
      fetch(`/api/public/cards/${card.id}/click`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleOpenPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPageOpen(true);
  };

  const handleUnlockAge = () => {
    setIsLocked(false);
    setShowLockModal(false);
  };

  const handleUnlockEmail = (e) => {
    e.preventDefault();
    if (gateEmailInput.includes('@')) {
      setIsLocked(false);
      setShowLockModal(false);
    } else {
      setGateError('Please enter a valid email address');
    }
  };

  const handleUnlockCode = (e) => {
    e.preventDefault();
    const correctCode = card.lockValue || '1234';
    if (passcodeInput.trim() === correctCode) {
      setIsLocked(false);
      setShowLockModal(false);
    } else {
      setGateError('Incorrect access code');
    }
  };

  const handleCopyLink = () => {
    if (card.url && navigator.clipboard) {
      navigator.clipboard.writeText(card.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // 1. Header Card
  if (card.type === 'header') {
    return (
      <div className="w-full pt-3 pb-1 text-center font-bold text-xs uppercase tracking-wider opacity-75">
        {card.title}
      </div>
    );
  }

  // 2. Social Icons Row
  if (card.type === 'social') {
    return (
      <div className="w-full flex items-center justify-center gap-3 py-2">
        <a
          href={card.url || 'https://instagram.com'}
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-full hover:scale-110 transition-transform bg-white/10 backdrop-blur-sm"
          style={{ color: theme.textColor }}
        >
          <span className="text-sm font-bold">IG</span>
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-full hover:scale-110 transition-transform bg-white/10 backdrop-blur-sm"
          style={{ color: theme.textColor }}
        >
          <span className="text-sm font-bold">YT</span>
        </a>
        <a
          href="https://wa.me"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-full hover:scale-110 transition-transform bg-white/10 backdrop-blur-sm"
          style={{ color: theme.textColor }}
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // 3. Embedded Video Card
  if (card.type === 'video') {
    return (
      <div
        className={`w-full overflow-hidden p-2 sm:p-2.5 text-left shadow-2xs hover:scale-[1.01] transition-transform ${animClass}`}
        style={{ ...buttonStyleObj, borderRadius: '22px' }}
      >
        <div className="relative aspect-[16/10] sm:aspect-video rounded-[18px] sm:rounded-2xl overflow-hidden bg-black flex items-center justify-center">
          {card.thumbnailUrl ? (
            <img src={card.thumbnailUrl} alt={card.title} className="w-full h-full object-cover" />
          ) : null}
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 cursor-pointer transition-transform shadow-md">
            <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
          </div>
        </div>
        <div className="font-semibold text-xs truncate px-1.5 pt-1.5 pb-0.5 opacity-80">
          {card.title || 'YouTube'}
        </div>
      </div>
    );
  }

  // 4. Music Player Card
  if (card.type === 'music') {
    return (
      <div
        className="w-full rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs"
        style={{ ...buttonStyleObj, borderRadius: '16px' }}
      >
        <div className="flex items-center gap-3 truncate">
          <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5 opacity-80" />
          </div>
          <div className="truncate text-left">
            <div className="font-bold text-xs truncate">{card.title}</div>
            <div className="text-[10px] opacity-70">Audio Stream</div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
          <Play className="w-3.5 h-3.5 ml-0.5 opacity-80" />
        </button>
      </div>
    );
  }

  // 5. Product / Shop Card
  if (card.type === 'product') {
    return (
      <a
        href={card.url || '#'}
        target="_blank"
        rel="noreferrer"
        className="w-full rounded-2xl overflow-hidden text-left shadow-2xs block hover:scale-[1.01] transition-transform"
        style={{ ...buttonStyleObj, borderRadius: '20px' }}
      >
        {card.thumbnailUrl ? (
          <img src={card.thumbnailUrl} alt={card.title} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-24 bg-black/5 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 opacity-30" />
          </div>
        )}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs">{card.title}</div>
            <div className="text-[11px] font-semibold opacity-75">{card.settings?.price || '$49.00'}</div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-bold">
            Buy
          </span>
        </div>
      </a>
    );
  }

  // 6. Tip Jar Card
  if (card.type === 'tip_jar') {
    return (
      <div className="w-full p-4 rounded-2xl space-y-3 text-center shadow-2xs" style={buttonStyleObj}>
        <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          <span>{card.title || 'Support My Work'}</span>
        </div>
        <div className="flex justify-center gap-2">
          {['$2', '$5', '$10', '$25'].map((amt) => (
            <a
              key={amt}
              href={card.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 text-xs font-bold transition-colors"
            >
              {amt}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // 7. Events List Card
  if (card.type === 'events') {
    return (
      <div className="w-full rounded-2xl p-3.5 space-y-2 text-left shadow-2xs" style={buttonStyleObj}>
        <div className="font-bold text-xs uppercase tracking-wider opacity-75 mb-2">{card.title}</div>
        <div className="flex items-center justify-between py-1.5 border-b border-black/5 text-xs">
          <div>
            <div className="font-bold">Next Event</div>
            <div className="text-[10px] opacity-70">{card.subtitle || 'Live Event'}</div>
          </div>
          <a
            href={card.url || '#'}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded-full bg-black/10 text-[10px] font-bold hover:bg-black/20"
          >
            Tickets
          </a>
        </div>
      </div>
    );
  }

  // 8. Email Signup Card
  if (card.type === 'email_signup') {
    return (
      <div className="w-full p-4 rounded-2xl space-y-2.5 text-center shadow-2xs" style={buttonStyleObj}>
        <div className="font-bold text-xs">{card.title || 'Join Newsletter'}</div>
        {emailSubmitted ? (
          <div className="text-xs font-semibold text-green-600 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Thank you for subscribing!</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput.includes('@')) setEmailSubmitted(true);
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-3 py-2 rounded-xl bg-black/5 text-xs placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Join
            </button>
          </form>
        )}
      </div>
    );
  }

  // 9. Contact Form Card
  if (card.type === 'contact_form') {
    return (
      <div className="w-full p-4 rounded-2xl space-y-3 text-left shadow-2xs" style={buttonStyleObj}>
        <div className="font-bold text-xs text-center">{card.title || 'Send a Message'}</div>
        {formSubmitted ? (
          <div className="text-xs font-semibold text-green-600 py-2 text-center">
            Message received! We will respond shortly.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nameInput && msgInput) setFormSubmitted(true);
            }}
            className="space-y-2"
          >
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-xl bg-black/5 text-xs placeholder:text-gray-400 focus:outline-none"
            />
            <textarea
              rows={2}
              required
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Your message..."
              className="w-full px-3 py-2 rounded-xl bg-black/5 text-xs placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    );
  }

  // 10. Booking Embed Card
  if (card.type === 'booking') {
    return (
      <a
        href={card.url || 'https://calendly.com'}
        target="_blank"
        rel="noreferrer"
        className="w-full py-3.5 px-4 text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-between shadow-2xs"
        style={buttonStyleObj}
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 opacity-80" />
          <span>{card.title || 'Schedule a Meeting'}</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/10">
          Book
        </span>
      </a>
    );
  }

  // 11. Collapsible Group Accordion
  if (card.type === 'collapsible') {
    return (
      <div className="w-full overflow-hidden shadow-2xs" style={buttonStyleObj}>
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full py-3.5 px-4 text-xs font-bold flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <FaviconIcon card={card} className="w-3.5 h-3.5" containerClassName="w-6 h-6" />
            <span>{card.title}</span>
          </div>
          {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isAccordionOpen && (
          <div className="px-4 pb-3 pt-1 text-xs opacity-80 text-left border-t border-black/5 leading-relaxed">
            {card.settings?.content || 'Additional links and information are grouped inside this collection.'}
          </div>
        )}
      </div>
    );
  }

  // Generic Card Properties
  const layout = card.settings?.layout || 'classic';
  const isMap =
    card.type === 'maps' ||
    Boolean(card.settings?.address) ||
    Boolean(card.url && /maps\.google|maps\.app\.goo\.gl/i.test(card.url));
  const isMenu =
    card.type === 'menu' ||
    card.settings?.platform === 'menu' ||
    Boolean(card.settings?.isPdf) ||
    Boolean(card.url && /\.pdf($|\?)/i.test(card.url));
  const isPdf = Boolean(card.settings?.isPdf || card.settings?.pdfName || (card.url && /\.pdf($|\?)/i.test(card.url)));
  const subtitle = card.subtitle || card.settings?.address || card.settings?.subtitle || (isPdf ? 'PDF Menu' : '');

  // Card 2 in Image 0 (Instagram.com): plain links with no custom thumbnail render as clean centered text pills
  const hasCustomThumbnail = Boolean(card.thumbnailUrl);
  const isGitHub = (card.url || '').toLowerCase().includes('github.com');
  const isSimpleCenteredLink =
    card.type === 'link' &&
    !hasCustomThumbnail &&
    !card.settings?.showIcon &&
    ((card.title || '').toLowerCase() === 'instagram.com' ||
      (card.title || '').toLowerCase().includes('instagram.com') ||
      (!card.subtitle || card.subtitle === card.title));

  const showThumbnail = Boolean(
    hasCustomThumbnail ||
    (card.type === 'link' && !isSimpleCenteredLink && (isGitHub || (card.subtitle && card.subtitle !== card.title))) ||
    card.type === 'reviews'
  );

  // 12. Featured Layout Card (Hero Media Layout) OR Maps Card (matching Image 0)
  if (isMap || layout === 'featured') {
    const isVideo = card.type === 'video' || (card.url && /youtube\.com|youtu\.be|vimeo\.com/i.test(card.url));
    return (
      <>
        <div
          className={`w-full overflow-hidden p-2.5 sm:p-3 text-center shadow-2xs transition-all hover:scale-[1.01] relative group ${animClass}`}
          style={{ ...buttonStyleObj, borderRadius: '24px' }}
        >
          {/* Top Media / Realistic Street Map covering the card top */}
          <div className="relative w-full aspect-[16/10] sm:aspect-video rounded-[18px] overflow-hidden bg-[#FAF6EE] border border-black/5 flex items-center justify-center shadow-inner">
            {isMap ? (
              <svg className="w-full h-full" viewBox="0 0 320 200" fill="none" preserveAspectRatio="none">
                {/* Background terrain */}
                <rect width="320" height="200" fill="#FAF6EE" />
                {/* Green Park blocks */}
                <rect x="25" y="30" width="80" height="60" rx="6" fill="#E8F4DE" />
                <rect x="220" y="20" width="75" height="50" rx="6" fill="#E8F4DE" />
                <rect x="180" y="130" width="110" height="45" rx="6" fill="#E8F4DE" />
                <rect x="20" y="135" width="60" height="45" rx="6" fill="#E8F4DE" />
                {/* Secondary roads (white grid) */}
                <path d="M0 55h320M0 105h320M0 160h320M55 0v200M145 0v200M235 0v200" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M0 55h320M0 105h320M0 160h320M55 0v200M145 0v200M235 0v200" stroke="#E6DEC9" strokeWidth="1" />
                {/* Main Arterial Road (warm yellow) */}
                <path d="M0 120 C 100 110, 180 80, 320 60" stroke="#FFE494" strokeWidth="7" />
                <path d="M0 120 C 100 110, 180 80, 320 60" stroke="#F6D365" strokeWidth="1" />
                <path d="M110 0 C 120 70, 140 140, 170 200" stroke="#FFE494" strokeWidth="7" />
                {/* Secondary diagonal street */}
                <path d="M0 30 L 160 170" stroke="#FFFFFF" strokeWidth="4" />
                {/* Red Map Pin with drop shadow */}
                <g transform="translate(148, 88) scale(1.15)">
                  <ellipse cx="12" cy="27" rx="5" ry="2" fill="rgba(0,0,0,0.2)" />
                  <path d="M12 2C7.03 2 3 6.03 3 11c0 6.2 9 15 9 15s9-8.8 9-15c0-4.97-4.03-9-9-9z" fill="#EA4335" />
                  <circle cx="12" cy="11" r="3.5" fill="#FFFFFF" />
                </g>
                {/* Subtle map watermark */}
                <text x="312" y="193" textAnchor="end" fill="#9CA3AF" fontSize="7" fontFamily="sans-serif">Map data ©</text>
              </svg>
            ) : card.thumbnailUrl ? (
              <img
                src={card.thumbnailUrl}
                alt={card.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-900/60 via-pink-900/40 to-black/60 flex flex-col items-center justify-center text-white/80 p-4 text-center">
                <span className="text-2xl mb-1">🖼️</span>
                <span className="font-bold text-xs">{card.title || 'Featured item'}</span>
              </div>
            )}

            {isVideo && (
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 cursor-pointer transition-transform shadow-md absolute">
                <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
              </div>
            )}
          </div>

          {/* Details below media */}
          <div className="pt-3 pb-1 px-1 flex flex-col items-center justify-center">
            <div className="font-bold text-xs sm:text-sm text-center leading-snug">
              {card.title}
            </div>
            {subtitle && (
              <div className="text-[10px] sm:text-[11px] text-center flex items-center justify-center gap-1 mt-1 opacity-75 font-normal max-w-[90%]">
                <span className="text-red-500">📍</span>
                <span className="truncate">{subtitle}</span>
              </div>
            )}

            {/* "Get directions" button */}
            <div className="mt-2.5 mb-0.5">
              <a
                href={card.url || `https://maps.google.com/?q=${encodeURIComponent(subtitle || card.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-semibold text-white/95 transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                Get directions
              </a>
            </div>
          </div>

          {/* Three dots menu */}
          <button
            type="button"
            onClick={handleOpenPage}
            className="absolute right-3 bottom-3 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 transition-all cursor-pointer"
            title="Open details"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Standalone Card Page Modal */}
        {renderCardPageModal()}
      </>
    );
  }

  // 13. Classic Layout Card (matching Image 0: centered pill for plain links, circular badge for rich links)
  return (
    <>
      <a
        href={isLocked ? '#' : card.url || '#'}
        onClick={handleLinkClick}
        target={isLocked ? '_self' : '_blank'}
        rel="noopener noreferrer"
        className={`w-full ${
          showThumbnail ? 'py-2 px-3' : 'py-3.5 px-4'
        } text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xs flex items-center justify-between relative group ${animClass}`}
        style={buttonStyleObj}
      >
        {/* Left Side: Circular White Badge Thumbnail / Icon + Title & Subtitle */}
        {showThumbnail ? (
          <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1.5">
              <FaviconIcon card={card} className="w-5 h-5 text-[#111111]" containerClassName="w-full h-full flex items-center justify-center rounded-full" />
            </div>

            <div className="min-w-0 text-left py-0.5 flex-1">
              <div className="font-bold text-xs truncate leading-snug">{card.title}</div>
              {subtitle && (
                <div
                  className="text-[10px] truncate mt-0.5 font-normal opacity-70 leading-tight"
                  style={{ color: 'currentColor' }}
                >
                  <span className="truncate">{subtitle}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center font-bold text-xs sm:text-sm truncate leading-snug py-0.5 px-3">
            {card.title}
          </div>
        )}

        {/* Right Side: Three Dots Action Menu that opens the Standalone Card Page */}
        <div className="shrink-0 flex items-center gap-1.5 pr-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {isPdf && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-[3px] bg-red-100 text-red-600 uppercase tracking-tight">
              PDF
            </span>
          )}
          {isLocked ? (
            <Lock className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <button
              type="button"
              onClick={handleOpenPage}
              className="p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
              title="Open card page"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </a>

      {/* Standalone Card Page Modal */}
      {renderCardPageModal()}

      {/* Lock Gate Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[28px] w-full max-w-sm p-6 space-y-4 text-[#111111] text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-sm">Protected Link</h4>

            {card.lockType === 'age' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  This link contains 18+ content. Please verify that you are at least 18 years old to proceed.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLockModal(false)}
                    className="flex-1 py-2 rounded-full border border-gray-200 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockAge}
                    className="flex-1 py-2 rounded-full bg-black text-white text-xs font-bold"
                  >
                    I am 18+
                  </button>
                </div>
              </div>
            )}

            {card.lockType === 'email' && (
              <form onSubmit={handleUnlockEmail} className="space-y-3">
                <p className="text-xs text-gray-500">Enter your email address to unlock this link.</p>
                <input
                  type="email"
                  required
                  value={gateEmailInput}
                  onChange={(e) => setGateEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none"
                />
                {gateError && <p className="text-[11px] text-red-500">{gateError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#7033FF] text-white text-xs font-bold"
                >
                  Unlock Link
                </button>
              </form>
            )}

            {card.lockType === 'code' && (
              <form onSubmit={handleUnlockCode} className="space-y-3">
                <p className="text-xs text-gray-500">Enter the secret passcode to access this link.</p>
                <input
                  type="password"
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Passcode"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-center font-mono focus:outline-none"
                />
                {gateError && <p className="text-[11px] text-red-500">{gateError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#7033FF] text-white text-xs font-bold"
                >
                  Enter
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Helper: Standalone Card Page View Modal
  function renderCardPageModal() {
    if (!isPageOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 space-y-5 text-[#111111] shadow-2xl relative animate-in slide-in-from-bottom duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="font-extrabold text-xs uppercase tracking-wider text-gray-400">
              {isMap ? 'Location Page' : 'Card View'}
            </div>
            <button
              type="button"
              onClick={() => setIsPageOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Visual Header / Banner */}
          {isMap ? (
            <div className="w-full h-36 rounded-2xl bg-[#E5E3DF] overflow-hidden relative shadow-inner flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 240 140" fill="none" preserveAspectRatio="none">
                <rect width="240" height="140" fill="#E8ECEF" />
                <path d="M0 35h240M0 80h240M0 115h240M50 0v140M120 0v140M190 0v140" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M0 70l240 -40M70 0l50 140" stroke="#FDE68A" strokeWidth="3" />
                <rect x="80" y="25" width="50" height="30" rx="4" fill="#BBF7D0" />
                <rect x="20" y="85" width="40" height="25" rx="4" fill="#BBF7D0" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/5">
                <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg animate-bounce">
                  <MapPin className="w-5 h-5 fill-white" />
                </div>
              </div>
            </div>
          ) : card.thumbnailUrl ? (
            <div className="w-full h-36 rounded-2xl overflow-hidden shadow-inner">
              <img src={card.thumbnailUrl} alt={card.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full py-6 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
              <FaviconIcon card={card} className="w-10 h-10" containerClassName="w-16 h-16" />
            </div>
          )}

          {/* Details */}
          <div className="space-y-1.5 text-center">
            <h3 className="font-extrabold text-base text-[#111111] leading-snug">{card.title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                {subtitle}
              </p>
            )}
            {card.url && (
              <div className="text-[11px] font-mono text-gray-400 truncate max-w-xs mx-auto pt-1">
                {card.url.replace(/^https?:\/\//i, '')}
              </div>
            )}
          </div>

          {/* Primary & Secondary Action CTAs */}
          <div className="space-y-2 pt-2">
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isMap ? (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Get Directions in Maps</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Visit Destination</span>
                  </>
                )}
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-full border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-gray-700 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span>Share Card</span>
                </>
              )}
            </button>
          </div>

          {/* Mini Linktree Footer */}
          <div className="pt-2 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            IndiaTaps Card Page
          </div>
        </div>
      </div>
    );
  }
}
