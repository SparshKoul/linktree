import React from 'react';
import { Share2, User } from 'lucide-react';
import { CardRenderer } from '../cards/CardRenderer.jsx';
import { getPatternSvg, getContrastingPatternColor } from './WallpaperEditor.jsx';

/**
 * Universal PhonePreview Component.
 * Single source of truth for both desktop and mobile preview rendering.
 * Guarantees that card layout, header, sizing, and theme reflection are 100% identical everywhere.
 */
export function PhonePreview({
  tree,
  theme,
  cards,
  footerEnabled,
  containerClassName = '',
  onShare,
  headerLayoutOverride,
}) {
  const activeTheme = theme || tree?.customTheme || {};
  const currentHeaderLayout = headerLayoutOverride || activeTheme?.headerLayout || tree?.headerLayout || 'classic';
  const isLogo = (tree?.titleStyle || activeTheme?.titleStyle) === 'logo';
  const logoUrl = tree?.logoUrl || activeTheme?.logoUrl;
  const titleText = tree?.title || activeTheme?.title || `@${tree?.slug || 'riyast'}`;
  const bioText = tree?.bio || activeTheme?.bio || '';
  const altFontEnabled = tree?.altFontEnabled ?? activeTheme?.altFontEnabled ?? false;
  const titleFont = altFontEnabled
    ? (tree?.titleFont || activeTheme?.titleFont || 'Manrope')
    : (activeTheme?.fontFamily && activeTheme.fontFamily !== 'Link Sans' ? activeTheme.fontFamily : 'inherit');
  const titleColor = tree?.titleColor || activeTheme?.titleColor || activeTheme?.textColor || '#FFFFFF';

  const avatarUrl = tree?.avatarUrl || activeTheme?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
  const isFooter = footerEnabled ?? tree?.footerEnabled ?? activeTheme?.footerEnabled ?? true;

  const cardList = (cards || tree?.cards || []).filter((c) => c.visible !== false);

  const defaultAvatarSvg = (
    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );

  const renderTitleBlock = (isHero = false) => (
    <div className="flex flex-col items-center text-center space-y-0.5 mt-1">
      {isLogo && logoUrl ? (
        <img src={logoUrl} alt="Logo" className="max-h-7 max-w-[150px] object-contain my-0.5" />
      ) : (
        <h2
          className={`font-bold text-xl sm:text-2xl tracking-tight leading-tight ${isHero ? 'text-white drop-shadow-xs' : ''}`}
          style={{
            color: isHero ? '#ffffff' : titleColor,
            fontFamily: titleFont !== 'inherit' ? `'${titleFont}', sans-serif` : 'inherit',
          }}
        >
          {titleText}
        </h2>
      )}
      {bioText && (
        <p
          className={`text-xs leading-relaxed max-w-[260px] mt-0.5 ${isHero ? 'text-white/90 drop-shadow-2xs' : 'text-gray-300'}`}
          style={{ color: isHero ? '#ffffffcc' : (activeTheme?.textColor ? `${activeTheme.textColor}cc` : '#9CA3AF') }}
        >
          {bioText}
        </p>
      )}
    </div>
  );

  const renderHeader = () => {
    if (currentHeaderLayout === 'hero') {
      const heroImage = tree?.heroUrl || activeTheme?.heroUrl || avatarUrl;
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          <div className="w-full h-44 sm:h-48 rounded-2xl overflow-hidden relative shadow-xs bg-rose-600">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          </div>
          {renderTitleBlock(true)}
        </div>
      );
    }

    if (currentHeaderLayout === 'banner') {
      const bannerImage = tree?.bannerUrl || activeTheme?.bannerUrl;
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          <div className="w-full h-28 sm:h-32 rounded-2xl overflow-hidden relative shadow-xs bg-gradient-to-r from-[#FF007A] via-[#C026D3] to-[#7928CA]">
            {bannerImage ? (
              <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full opacity-90 bg-gradient-to-r from-[#FF007A] via-[#A855F7] to-[#7928CA]" />
            )}
          </div>
          <div className="-mt-10 mb-1.5 relative ring-4 ring-white rounded-full shadow-md w-20 h-20 overflow-hidden bg-white flex items-center justify-center shrink-0">
            {tree?.avatarUrl || activeTheme?.avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : defaultAvatarSvg}
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    if (currentHeaderLayout === 'cutout') {
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          <div className="w-24 h-28 relative flex items-end justify-center mb-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
            <img src={avatarUrl} alt="Cutout" className="w-full h-full object-cover filter drop-shadow-md" />
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    if (currentHeaderLayout === 'shape') {
      return (
        <div className="w-full flex flex-col items-center text-center mb-3">
          <div
            className="w-24 h-18 relative flex items-center justify-center mb-1.5 shadow-xs"
            style={{ clipPath: 'url(#linktree-organic-shape)' }}
          >
            <img src={avatarUrl} alt="Shape" className="w-full h-full object-cover" />
          </div>
          {renderTitleBlock()}
        </div>
      );
    }

    // Default: 'classic'
    return (
      <div className="flex flex-col items-center text-center mb-2.5">
        <div className="w-20 h-20 rounded-full bg-[#B5B9BE] flex items-center justify-center overflow-hidden mb-2.5 shadow-md ring-2 ring-white/10 shrink-0">
          {tree?.avatarUrl || activeTheme?.avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : defaultAvatarSvg}
        </div>
        {renderTitleBlock()}
      </div>
    );
  };

  return (
    <div
      className={`relative overflow-hidden flex flex-col text-center select-none ${containerClassName}`}
      style={{
        color: activeTheme?.textColor || '#111111',
        fontFamily:
          activeTheme?.fontFamily && activeTheme.fontFamily !== 'Link Sans'
            ? `'${activeTheme.fontFamily}', sans-serif`
            : "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. Wallpaper Background Base + Effects + Tint + Noise */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base Layer */}
        <div
          className="w-full h-full absolute inset-0"
          style={{
            background:
              activeTheme?.wallpaperStyle === 'video'
                ? 'transparent'
                : activeTheme?.backgroundType === 'solid' || activeTheme?.wallpaperStyle === 'fill'
                ? (activeTheme?.backgroundValue?.startsWith('#') ? activeTheme.backgroundValue : (activeTheme?.backgroundColor || '#F3F3F1'))
                : activeTheme?.backgroundImageUrl
                ? `url("${activeTheme.backgroundImageUrl}") center / cover no-repeat`
                : activeTheme?.backgroundValue || activeTheme?.backgroundColor || '#111111',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter:
              activeTheme?.wallpaperStyle === 'blur'
                ? 'blur(20px)'
                : activeTheme?.effect === 'mono'
                ? 'grayscale(100%)'
                : activeTheme?.effect === 'blur'
                ? 'blur(8px)'
                : activeTheme?.effect === 'halftone'
                ? 'contrast(200%) grayscale(100%)'
                : 'none',
            transform:
              activeTheme?.wallpaperStyle === 'blur' || activeTheme?.effect === 'blur'
                ? 'scale(1.12)'
                : 'none',
          }}
        />

        {/* Video Base Layer */}
        {activeTheme?.wallpaperStyle === 'video' &&
          (activeTheme?.wallpaperVideoUrl || activeTheme?.backgroundImageUrl) && (
            <video
              src={activeTheme.wallpaperVideoUrl || activeTheme.backgroundImageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover absolute inset-0"
            />
          )}

        {/* Gradient Overlay */}
        {activeTheme?.wallpaperStyle === 'gradient' && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${activeTheme?.backgroundColor || '#638873'} 0%, rgba(0,0,0,0.85) 100%)`,
              mixBlendMode: activeTheme?.backgroundImageUrl ? 'multiply' : 'normal',
            }}
          />
        )}

        {/* Pattern Overlay */}
        {activeTheme?.wallpaperStyle === 'pattern' && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              backgroundColor: activeTheme?.backgroundImageUrl
                ? 'transparent'
                : activeTheme?.backgroundColor || '#050F15',
              backgroundImage: `url("${getPatternSvg(
                activeTheme?.patternType || 'organic',
                activeTheme?.backgroundImageUrl
                  ? (activeTheme?.backgroundColor || '#050F15')
                  : getContrastingPatternColor(activeTheme?.backgroundColor || '#050F15'),
                activeTheme?.backgroundImageUrl ? 0.45 : 0.3
              )}")`,
              backgroundRepeat: 'repeat',
              mixBlendMode: activeTheme?.backgroundImageUrl ? 'multiply' : 'normal',
            }}
          />
        )}

        {/* Tint Overlay */}
        {typeof activeTheme?.tint === 'number' && activeTheme.tint !== 0 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor:
                activeTheme.tint < 0
                  ? `rgba(0, 0, 0, ${(Math.abs(activeTheme.tint) / 100) * 0.75})`
                  : `rgba(255, 255, 255, ${(activeTheme.tint / 100) * 0.75})`,
            }}
          />
        )}

        {/* Noise Texture Overlay */}
        {activeTheme?.noise && (
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.6'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>

      {/* 2. Scrollable Content Container Over Sticky Wallpaper */}
      <div
        className={`absolute inset-0 z-10 overflow-y-auto px-3.5 pb-8 flex flex-col justify-between text-center no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          currentHeaderLayout === 'banner' || currentHeaderLayout === 'hero'
            ? 'pt-3'
            : 'pt-4'
        }`}
      >
        <div className="flex flex-col justify-between flex-1 min-h-full w-full max-w-[480px] mx-auto">
          {/* Top Icons Inside Phone matching Reference */}
          <div className="w-full flex items-center justify-between text-xs mb-4 z-10" style={{ color: activeTheme?.textColor || '#FFFFFF' }}>
            <span className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black shadow-xs">
              ✱
            </span>
            <button
              type="button"
              onClick={onShare}
              className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white shadow-xs hover:bg-black/40 transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Header (Classic, Hero, Banner, Cutout, Shape) */}
          {renderHeader()}

          {/* Cards Stack */}
          <div className="w-full space-y-3 flex-1 mt-4 mb-8">
            {cardList.map((card) => (
              <CardRenderer key={card.id} card={card} theme={activeTheme} isPreview />
            ))}
          </div>

          {/* Bottom Footer Section */}
          {isFooter && (
            <div className="mt-auto pt-4 pb-4 space-y-2 w-full shrink-0">
              {activeTheme?.footerButton && (
                <button
                  type="button"
                  className="w-full max-w-[210px] py-2 px-4 rounded-full bg-white text-black text-xs font-bold shadow-md hover:scale-[1.02] transition-transform mx-auto block cursor-pointer border border-gray-100"
                >
                  {activeTheme?.footerText || 'Get your own Linktree'}
                </button>
              )}
              <div className="text-[10px] text-gray-400 leading-tight">
                Cookie Preferences • Report • Privacy
                <div className="mt-0.5">More from Linktree</div>
              </div>
            </div>
          )}

          {/* Bottom buffer spacer */}
          <div className="w-full h-12 shrink-0 pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
