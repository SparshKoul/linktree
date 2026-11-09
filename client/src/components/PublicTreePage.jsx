import { useState, useEffect } from 'react';
import { CardRenderer } from '../cards/CardRenderer.jsx';
import { PRESET_THEMES } from '../constants/themes.js';
import { Share2, Check, ArrowLeft, Users } from 'lucide-react';
import { getPatternSvg, getContrastingPatternColor } from './WallpaperEditor.jsx';

export function PublicTreePage({ slug, onBackToAdmin }) {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/trees/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Tree not found or unpublished');
        return res.json();
      })
      .then((data) => {
        setTreeData(data);
        setLoading(false);

        // Record first-party cookieless view
        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              '/api/track',
              JSON.stringify({ treeId: data.tree?.id || 1, eventType: 'view' })
            );
          }
        } catch {
          // ignore tracking failure
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: treeData?.tree?.title || slug, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F3F1] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !treeData) {
    return (
      <div className="min-h-screen bg-[#F3F3F1] flex flex-col items-center justify-center p-6 text-center text-[#111111]">
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          The IndiaTaps page <code className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">/{slug}</code> does not exist or has been unpublished.
        </p>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
        )}
      </div>
    );
  }

  const { tree, cards } = treeData;
  const activeTheme =
    tree.customTheme ||
    PRESET_THEMES.find((p) => p.id === tree.themeId)?.theme ||
    PRESET_THEMES[0].theme;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 transition-colors duration-200 relative overflow-hidden"
      style={{
        color: activeTheme.textColor,
        fontFamily: activeTheme.fontFamily,
      }}
    >
      {/* Wallpaper Background Base + Effects + Tint + Noise */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* 1. Base Layer (Image, Gradient, or Solid) */}
        <div
          className="w-full h-full absolute inset-0"
          style={{
            backgroundColor: activeTheme?.backgroundColor || '#638873',
            backgroundImage:
              activeTheme?.wallpaperStyle === 'fill' || activeTheme?.wallpaperStyle === 'video'
                ? 'none'
                : activeTheme?.backgroundImageUrl
                ? `url("${activeTheme.backgroundImageUrl}")`
                : activeTheme?.backgroundValue?.includes('url(')
                ? activeTheme.backgroundValue
                : activeTheme?.backgroundValue || 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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

        {/* 1.1 Video Layer (if video style) */}
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

        {/* 2. Gradient Overlay (if gradient style) */}
        {activeTheme?.wallpaperStyle === 'gradient' && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${activeTheme?.backgroundColor || '#638873'} 0%, rgba(0,0,0,0.85) 100%)`,
              mixBlendMode: activeTheme?.backgroundImageUrl ? 'multiply' : 'normal',
            }}
          />
        )}

        {/* 3. Pattern Overlay (if pattern style) - dynamically textures the wallpaper behind! */}
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

        {/* 4. Tint Overlay */}
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

        {/* 5. Noise Texture Overlay */}
        {activeTheme?.noise && (
          <div
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.6'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>

      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="linktree-organic-shape" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.02 C 0.72,0.02, 0.94,0.12, 0.98,0.32 C 1.01,0.42, 0.95,0.48, 0.91,0.5 C 0.95,0.52, 1.01,0.58, 0.98,0.68 C 0.94,0.88, 0.72,0.98, 0.5,0.98 C 0.28,0.98, 0.06,0.88, 0.02,0.68 C -0.01,0.58, 0.05,0.52, 0.09,0.5 C 0.05,0.48, -0.01,0.42, 0.02,0.32 C 0.06,0.12, 0.28,0.02, 0.5,0.02 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* Top Bar for Admin Return & Share */}
      <div className="relative z-10 w-full max-w-[640px] flex items-center justify-between py-2 mb-4">
        {onBackToAdmin ? (
          <button
            onClick={onBackToAdmin}
            className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 hover:bg-white/30 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin Editor
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleShare}
          className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold hover:bg-white/30 transition-colors shadow-xs"
          title="Share page"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Centered Content (max width 680px per PRD) */}
      <main className="relative z-10 w-full max-w-[580px] flex flex-col items-center text-center space-y-4 flex-1">
        {/* Profile Header matching chosen layout */}
        {(() => {
          const layout = tree.headerLayout || tree.customTheme?.headerLayout || 'classic';
          const isLogo = (tree.titleStyle || tree.customTheme?.titleStyle) === 'logo';
          const logoUrl = tree.logoUrl || tree.customTheme?.logoUrl;
          const titleText = tree.title || `@${tree.slug}`;
          const bioText = tree.bio;
          const titleColor = tree.titleColor || tree.customTheme?.titleColor || '';
          const altFontEnabled = tree.altFontEnabled || tree.customTheme?.altFontEnabled || false;
          const titleFont = altFontEnabled ? (tree.titleFont || tree.customTheme?.titleFont || 'inherit') : 'inherit';

          const renderTitleBio = (isHero = false) => (
            <div className="flex flex-col items-center text-center space-y-1">
              {isLogo && logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-10 max-w-[200px] object-contain my-1" />
              ) : (
                <h1
                  className={`text-xl sm:text-2xl font-black tracking-tight ${isHero ? 'text-white drop-shadow-sm' : ''}`}
                  style={{ color: isHero ? '#ffffff' : (titleColor || undefined), fontFamily: titleFont }}
                >
                  {titleText}
                </h1>
              )}
              {bioText && (
                <p className={`text-xs sm:text-sm max-w-sm mx-auto leading-relaxed ${isHero ? 'text-white/90 drop-shadow-xs' : 'opacity-80'}`}>
                  {bioText}
                </p>
              )}
            </div>
          );

          if (layout === 'hero') {
            const heroImage =
              tree.heroUrl ||
              tree.customTheme?.heroUrl ||
              tree.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
            return (
              <div className="w-full flex flex-col items-center text-center -mt-4 mb-3">
                <div className="w-full h-52 sm:h-64 relative overflow-hidden rounded-3xl shadow-md bg-rose-600">
                  <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                  <div
                    className="absolute inset-x-0 bottom-0 h-20"
                    style={{
                      background: `linear-gradient(to top, ${activeTheme.backgroundValue || '#F3F3F1'}, transparent)`,
                    }}
                  />
                </div>
                {renderTitleBio()}
              </div>
            );
          }

          if (layout === 'banner') {
            const bannerImage = tree.bannerUrl || tree.customTheme?.bannerUrl;
            return (
              <div className="w-full flex flex-col items-center text-center -mt-4 mb-3">
                <div className="w-full h-32 sm:h-40 relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-300 via-rose-300 to-rose-400 shadow-md">
                  {bannerImage ? (
                    <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full opacity-60 bg-[radial-gradient(#ec4899_1.5px,transparent_1.5px)] [background-size:8px_8px]" />
                  )}
                </div>
                <div className="-mt-12 mb-2 relative">
                  <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
                    <div className="w-full h-full rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
                      {tree.avatarUrl ? (
                        <img src={tree.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                {renderTitleBio()}
              </div>
            );
          }

          if (layout === 'cutout') {
            return (
              <div className="flex flex-col items-center text-center mb-3">
                <div className="w-32 h-36 relative flex items-end justify-center mb-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)]">
                  {tree.avatarUrl ? (
                    <img src={tree.avatarUrl} alt="Cutout" className="w-full h-full object-cover filter drop-shadow-xl" />
                  ) : (
                    <div className="w-26 h-30 rounded-t-full bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                {renderTitleBio()}
              </div>
            );
          }

          if (layout === 'shape') {
            return (
              <div className="flex flex-col items-center text-center mb-3">
                <div
                  className="w-28 h-24 relative flex items-center justify-center mb-2 shadow-md"
                  style={{ clipPath: 'url(#linktree-organic-shape)' }}
                >
                  <div className="absolute inset-0 bg-rose-600" />
                  {tree.avatarUrl ? (
                    <img src={tree.avatarUrl} alt="Shape" className="w-full h-full object-cover relative z-10" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                {renderTitleBio()}
              </div>
            );
          }

          // Default: Classic
          return (
            <div className="flex flex-col items-center text-center space-y-3 mb-2">
              <div className="w-24 h-24 rounded-full bg-[#E5E7EB] text-white flex items-center justify-center shadow-md overflow-hidden ring-4 ring-white/10">
                {tree.avatarUrl ? (
                  <img src={tree.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {renderTitleBio()}
            </div>
          );
        })()}

        {/* Cards Stack with generous bottom spacing */}
        <div className="w-full space-y-3 pt-4 mb-8 sm:mb-10">
          {cards && cards.length > 0 ? (
            cards.map((card) => (
              <CardRenderer
                key={card.id}
                card={card}
                theme={activeTheme}
              />
            ))
          ) : (
            <div className="text-xs opacity-50 py-12">No links available</div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full max-w-[580px] text-center pt-6 pb-6 space-y-2">
        <div className="text-[10px] opacity-40 font-semibold tracking-wider uppercase">
          {tree.name}
        </div>
      </footer>
    </div>
  );
}

