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

  const btnRadius = `${Math.min(theme?.buttonRadius ?? 9999, 40)}px`;
  const isOutline = theme?.buttonStyle === 'outline';
  const buttonStyleObj = {
    background: isOutline ? 'transparent' : (theme?.buttonColor || '#FFFFFF'),
    color: theme?.buttonTextColor || '#111111',
    borderRadius: btnRadius,
    border: isOutline ? `2px solid ${theme?.buttonTextColor || '#111111'}` : '1px solid rgba(0,0,0,0.06)',
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
        className="w-full rounded-2xl overflow-hidden p-3 text-left space-y-2 shadow-2xs"
        style={{ ...buttonStyleObj, borderRadius: '16px' }}
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center hover:scale-105 cursor-pointer transition-transform">
            <Play className="w-5 h-5 ml-0.5" />
          </div>
        </div>
        <div className="font-semibold text-xs truncate px-1">{card.title}</div>
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
  const hasThumbnail = Boolean(card.thumbnailUrl || isMap || card.type === 'reviews' || card.url);

  // 12. Featured Layout Card (Hero Preview)
  if (layout === 'featured') {
    return (
      <>
        <div
          className={`w-full rounded-2xl overflow-hidden shadow-2xs text-left transition-all hover:scale-[1.01] ${animClass}`}
          style={{ ...buttonStyleObj, borderRadius: '20px' }}
        >
          {/* Top Banner / Media */}
          {isMap ? (
            <div className="w-full h-32 bg-[#E5E3DF] relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" preserveAspectRatio="none">
                <rect width="200" height="120" fill="#E8ECEF" />
                <path d="M0 30h200M0 70h200M0 100h200M40 0v120M100 0v120M160 0v120" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M0 60l200 -30M60 0l40 120" stroke="#FDE68A" strokeWidth="3" />
                <rect x="70" y="20" width="40" height="25" rx="3" fill="#BBF7D0" />
                <rect x="15" y="70" width="35" height="20" rx="3" fill="#BBF7D0" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/10">
                <div className="w-7 h-7 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
              </div>
            </div>
          ) : card.thumbnailUrl ? (
            <img
              src={card.thumbnailUrl}
              alt={card.title}
              loading="lazy"
              decoding="async"
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-20 bg-black/5 flex items-center justify-center">
              <FaviconIcon card={card} className="w-8 h-8" containerClassName="w-12 h-12" />
            </div>
          )}

          {/* Body */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs truncate leading-snug">{card.title}</div>
              {subtitle && (
                <div className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5 font-normal">
                  {isMap && <span className="text-gray-400">📍</span>}
                  <span className="truncate">{subtitle}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={isLocked ? '#' : card.url || '#'}
                onClick={handleLinkClick}
                target={isLocked ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-bold hover:bg-gray-800 transition-colors"
              >
                {isMap ? 'Directions' : isPdf ? 'View PDF' : 'Visit'}
              </a>
              <button
                type="button"
                onClick={handleOpenPage}
                className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-black transition-colors"
                title="Open details"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Standalone Card Page Modal */}
        {renderCardPageModal()}
      </>
    );
  }

  // 13. Classic Layout Card
  return (
    <>
      <a
        href={isLocked ? '#' : card.url || '#'}
        onClick={handleLinkClick}
        target={isLocked ? '_self' : '_blank'}
        rel="noopener noreferrer"
        className={`w-full py-2 px-2 sm:px-2.5 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xs flex items-center justify-between relative group rounded-2xl ${animClass}`}
        style={buttonStyleObj}
      >
        {/* Left Side: Thumbnail / Icon + Title & Subtitle */}
        {hasThumbnail || subtitle ? (
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <FaviconIcon card={card} className="w-4 h-4" containerClassName="w-8 h-8" />

            <div className="min-w-0 text-left">
              <div className="font-bold text-xs truncate leading-snug">{card.title}</div>
              {subtitle && (
                <div className="text-[9.5px] text-gray-500 truncate flex items-center gap-1 mt-0.5 font-normal">
                  {isMap && <span className="text-gray-400">📍</span>}
                  <span className="truncate">{subtitle}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center font-bold text-xs truncate leading-snug pl-4">
            {card.title}
          </div>
        )}

        {/* Right Side: Three Dots Action Menu that opens the Standalone Card Page */}
        <div className="shrink-0 flex items-center gap-1.5 text-gray-400 group-hover:text-black transition-colors">
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
              className="p-1 rounded-full hover:bg-black/5 transition-colors"
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
