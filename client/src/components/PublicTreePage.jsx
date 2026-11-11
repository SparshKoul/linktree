import { useState, useEffect } from 'react';
import { CardRenderer } from '../cards/CardRenderer.jsx';
import { PRESET_THEMES } from '../constants/themes.js';
import { Copy, Check, ArrowLeft, Users } from 'lucide-react';
import { getPatternSvg, getContrastingPatternColor } from './WallpaperEditor.jsx';
import { TreeSkeleton } from './TreeSkeleton.jsx';
import { getCanonicalTreeUrl, copyToClipboard } from '../constants/urls.js';

export function PublicTreePage({ slug }) {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 640
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setError(null);
    setIsBlocked(false);

    // Stale-While-Revalidate: Instant render from localStorage / sessionStorage if visited before
    let hasCache = false;
    const cacheKey = `indiataps_tree_${slug.toLowerCase()}`;
    try {
      const cachedStr = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached?.tree) {
          setTreeData(cached);
          setLoading(false);
          hasCache = true;
        }
      }
    } catch {}

    if (!hasCache) {
      setLoading(true);
    }

    fetch(`/api/public/trees/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (!isMounted) return null;
          setIsBlocked(true);
          setBlockedMessage(
            data.message ||
              'This digital card is temporarily unavailable because the account has been locked.'
          );
          setTreeData(null);
          setLoading(false);
          return null;
        }
        if (!res.ok) {
          throw new Error('Tree not found or unpublished');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data) return;
        setIsBlocked(false);
        if (data && data.tree) {
          const freshData = {
            tree: data.tree,
            cards: Array.isArray(data.cards) ? data.cards : [],
          };
          setTreeData(freshData);
          try {
            const jsonStr = JSON.stringify(freshData);
            localStorage.setItem(cacheKey, jsonStr);
            sessionStorage.setItem(cacheKey, jsonStr);
          } catch {}
        }
        setLoading(false);

        // Record first-party cookieless view
        try {
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              '/api/track',
              JSON.stringify({ treeId: data?.tree?.id || 1, eventType: 'view' })
            );
          }
        } catch {
          // ignore tracking failure
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!hasCache) {
          setError(err.message || 'Page not found');
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Dynamic Page Title, Favicon, and Open Graph Metadata
  useEffect(() => {
    if (!treeData?.tree) return;
    const t = treeData.tree;
    const title = t.title || t.name || slug;
    const pageTitle = `${title} | IndiaTaps`;
    const originalTitle = document.title;
    document.title = pageTitle;

    const updateMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el && value) {
        el = document.createElement('meta');
        const [k, v] = selector.replace(/[\[\]"]/g, '').split('=');
        el.setAttribute(k, v);
        document.head.appendChild(el);
      }
      if (el && value) el.setAttribute(attr, value);
    };

    updateMeta('meta[property="og:title"]', 'content', title);
    updateMeta('meta[property="og:description"]', 'content', t.bio || `View ${title}'s links and digital card on IndiaTaps`);
    updateMeta('meta[name="twitter:title"]', 'content', title);
    updateMeta('meta[name="twitter:description"]', 'content', t.bio || `View ${title}'s links and digital card on IndiaTaps`);

    const avatar = t.avatarUrl || t.customTheme?.avatarUrl;
    if (avatar) {
      updateMeta('meta[property="og:image"]', 'content', avatar);
      updateMeta('meta[name="twitter:image"]', 'content', avatar);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [treeData, slug]);

  const handleCopyLink = async () => {
    const url = getCanonicalTreeUrl(slug);
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-[#111318] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans selection:bg-[#00E575] selection:text-black">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Navbar Header */}
        <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
          <a href="https://indiataps.vercel.app" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-lg shadow-sm">
              <span className="text-[#00E575] leading-none">✱</span>
            </div>
            <span className="font-black text-lg tracking-tight text-white group-hover:text-[#00E575] transition-colors">
              IndiaTaps
            </span>
          </a>

          <a
            href="https://indiataps.vercel.app"
            className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-gray-800 hover:border-gray-700 transition-colors"
          >
            indiataps.vercel.app
          </a>
        </header>

        {/* Main Content Area in Landing Page Style */}
        <main className="relative z-10 max-w-xl w-full mx-auto my-auto py-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>ACCOUNT TEMPORARILY LOCKED</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Card Unavailable
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
              This digital card (<span className="text-white font-mono font-bold">/{slug}</span>) is currently blocked. Please contact the administrator of <span className="text-white font-semibold">indiataps.vercel.app</span> to restore service.
            </p>
          </div>

          {/* Action Box */}
          <div className="p-6 rounded-3xl bg-[#1A1D24] border border-gray-800/80 shadow-2xl space-y-4 text-left">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span>Contact Administrator</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              If this is your business profile or client account, please contact the IndiaTaps administrator to reactivate your cards. Once unblocked, all your cards will automatically work normally as they used to.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href="https://indiataps.vercel.app"
                className="flex-1 py-3 px-4 rounded-full bg-[#00E575] hover:bg-[#00c966] text-black font-extrabold text-xs transition-all text-center shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                indiataps.vercel.app
              </a>
              <a
                href="mailto:india.taps7@gmail.com?subject=Reactivate%20IndiaTaps%20Card%20Account"
                className="flex-1 py-3 px-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all text-center border border-gray-700"
              >
                Email Administrator
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 max-w-5xl w-full mx-auto text-center pt-8 border-t border-gray-900 text-xs text-gray-600">
          Powered by <span className="text-gray-400 font-bold">IndiaTaps</span> • Digital Business Cards & Smart Profiles
        </footer>
      </div>
    );
  }

  if (loading || (!treeData && !error && !isBlocked)) {
    return <TreeSkeleton />;
  }

  if (error || !treeData) {
    return (
      <div className="min-h-screen bg-[#F3F3F1] flex flex-col items-center justify-center p-6 text-center text-[#111111]">
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          The IndiaTaps page <code className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">/{slug}</code> does not exist or has been unpublished.
        </p>
        <a
          href="/"
          className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-black/80 transition-colors"
        >
          Go to IndiaTaps
        </a>
      </div>
    );
  }

  const { tree, cards } = treeData;
  const basePreset =
    PRESET_THEMES.find((p) => p.id === tree.themeId)?.theme ||
    PRESET_THEMES[0].theme;
  const activeTheme = {
    ...basePreset,
    ...(tree.customTheme || {}),
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-start sm:justify-center bg-[#181A1E] sm:py-6 sm:px-4 font-sans selection:bg-white/20 selection:text-white transition-colors relative ${isDesktop ? 'sm:h-screen sm:overflow-hidden' : ''}`}>
      {/* Outer subtle ambient glow on large desktop screens */}
      <div className="hidden sm:block fixed inset-0 pointer-events-none opacity-25 blur-[120px] -z-10 overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            background: activeTheme?.backgroundColor || activeTheme?.backgroundValue || '#111111',
          }}
        />
      </div>

      {/* Centered Mobile/Card Container matching Linktree Desktop UI */}
      <div
        className="w-full sm:max-w-[480px] md:max-w-[520px] min-h-screen sm:min-h-0 sm:h-[min(94vh,940px)] sm:max-h-[94vh] flex flex-col justify-between relative overflow-visible sm:overflow-hidden transition-all duration-200 sm:rounded-[44px] sm:shadow-[0_24px_70px_-15px_rgba(0,0,0,0.75)] sm:border sm:border-white/10"
        style={{
          color: activeTheme.textColor,
          fontFamily: activeTheme.fontFamily,
        }}
      >
        {/* 1. FIXED WALLPAPER BACKGROUND: Fixed to viewport on mobile, pinned to card on desktop */}
        <div className="fixed sm:absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Base Layer (Image, Gradient, or Solid) */}
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
                  : activeTheme?.backgroundValue || '#F3F3F1',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter:
                activeTheme?.wallpaperStyle === 'blur'
                  ? `blur(${activeTheme?.blurAmount ?? 20}px)`
                  : activeTheme?.effect === 'mono'
                  ? 'grayscale(100%)'
                  : activeTheme?.effect === 'blur'
                  ? `blur(${activeTheme?.blurAmount ?? 10}px)`
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

          {/* 3. Pattern Overlay (if pattern style) */}
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

        {/* 2. SCROLLABLE CONTENT: Cards & Header glide over the fixed wallpaper */}
        <div
          {...(isDesktop ? { 'data-lenis-prevent': '' } : {})}
          className="w-full flex-1 flex flex-col justify-between p-5 sm:p-7 relative z-10 overflow-visible sm:overflow-y-auto sm:no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative z-10 w-full flex items-center justify-between py-1 mb-3">
          <a
            href="/"
            className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-base font-black shadow-xs hover:bg-white/30 transition-all select-none"
            style={{ color: activeTheme?.textColor || '#FFFFFF' }}
            title="IndiaTaps"
          >
            ✱
          </a>

          <button
            onClick={handleCopyLink}
            className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xs font-bold hover:bg-white/30 transition-all shadow-xs cursor-pointer relative group"
            style={{ color: activeTheme?.textColor || '#FFFFFF' }}
            title={copied ? "Link copied!" : "Copy link"}
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400 stroke-[3]" />
            ) : (
              <Copy className="w-4 h-4 stroke-[2.2]" />
            )}
            {copied && (
              <span className="absolute -bottom-7 right-0 text-[10px] font-bold bg-black/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap animate-in fade-in">
                Copied!
              </span>
            )}
          </button>
        </div>

        {/* Main Content inside Mobile Card */}
        <main className="relative z-10 w-full flex flex-col items-center text-center space-y-4 flex-1">
          {/* Profile Header matching chosen layout */}
          {(() => {
            const avatarUrl = tree.avatarUrl || tree.avatar_url || tree.customTheme?.avatarUrl || null;
            const logoUrl = tree.logoUrl || tree.logo_url || tree.customTheme?.logoUrl || null;
            const isLogo = (tree.titleStyle || tree.title_style || tree.customTheme?.titleStyle) === 'logo';
            const layout = tree.headerLayout || tree.header_layout || tree.customTheme?.headerLayout || 'classic';
            const bannerImage = tree.bannerUrl || tree.banner_url || tree.customTheme?.bannerUrl || null;
            const heroUrl = tree.heroUrl || tree.hero_url || tree.customTheme?.heroUrl || null;
            const titleText = tree.title || `@${tree.slug}`;
            const bioText = tree.bio;
            const altFontEnabled = tree.altFontEnabled ?? tree.alt_font_enabled ?? tree.customTheme?.altFontEnabled ?? false;
            const titleFont = altFontEnabled
              ? (tree.titleFont || tree.title_font || tree.customTheme?.titleFont || 'Manrope')
              : (tree.fontFamily || tree.customTheme?.fontFamily || 'inherit');
            const titleColor = tree.titleColor || tree.title_color || tree.customTheme?.titleColor || tree.textColor || tree.customTheme?.textColor || '#111111';

            const renderTitleBio = (isHero = false) => (
              <div className="flex flex-col items-center text-center space-y-1 mt-1">
                {isLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-12 max-w-[220px] object-contain mt-2.5 mb-1.5" />
                ) : (
                  <h1
                    className={`font-black text-[28px] sm:text-[32px] tracking-tight leading-tight ${isHero ? 'text-white drop-shadow-xs' : ''}`}
                    style={{
                      color: isHero ? '#ffffff' : titleColor,
                      fontFamily: titleFont !== 'inherit' ? `'${titleFont}', sans-serif` : 'inherit',
                    }}
                  >
                    {titleText}
                  </h1>
                )}
                {bioText && (
                  <p
                    className={`text-sm sm:text-[15px] font-medium leading-relaxed max-w-[320px] mt-1 mb-2 ${isHero ? 'text-white/90 drop-shadow-2xs' : 'opacity-80'}`}
                    style={{ color: isHero ? '#ffffffcc' : (tree.textColor || tree.customTheme?.textColor || '#9CA3AF') }}
                  >
                    {bioText}
                  </p>
                )}
              </div>
            );

            if (layout === 'hero') {
              const heroImage =
                heroUrl ||
                avatarUrl ||
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
              return (
                <div className="w-full flex flex-col items-center text-center -mt-4 mb-3">
                  <div className="w-full h-32 sm:h-40 relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-300 via-rose-300 to-rose-400 shadow-md">
                    {bannerImage ? (
                      <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full opacity-60 bg-[radial-gradient(#ec4899_1.5px,transparent_1.5px)] [background-size:8px_8px]" />
                    )}
                  </div>
                  <div className="-mt-12 mb-2 relative z-10">
                    <div className="w-24 h-24 aspect-square shrink-0 rounded-full bg-white p-1.5 shadow-lg flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden aspect-square relative">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.avatar-placeholder');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Users className={`w-10 h-10 text-gray-400 avatar-placeholder ${avatarUrl ? 'hidden' : ''}`} />
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Cutout" className="w-full h-full object-cover filter drop-shadow-xl" />
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Shape" className="w-full h-full object-cover relative z-10" />
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
              <div className="flex flex-col items-center text-center space-y-3 mt-4 mb-2">
                <div className="w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-full bg-[#E5E7EB] text-white flex items-center justify-center shadow-md overflow-hidden ring-4 ring-white/10 shrink-0 relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-placeholder');
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Users className={`w-12 h-12 text-gray-400 avatar-placeholder ${avatarUrl ? 'hidden' : ''}`} />
                </div>
                {renderTitleBio()}
              </div>
            );
          })()}

          {/* Cards Stack */}
          <div className="w-full space-y-3.5 pt-4 mb-8 sm:mb-10">
            {cards && cards.length > 0 ? (
              cards
                .filter((c) => c.visible !== false)
                .map((card) => (
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

        {/* Footer Branding inside Card (controlled by Admin Content settings) */}
        {(tree.footerEnabled !== false && tree.customTheme?.footerEnabled !== false) && (
          <footer className="relative z-10 w-full text-center pt-6 pb-2">
            <div className="text-[10px] opacity-40 font-semibold tracking-wider uppercase">
              {tree.footerText || tree.name}
            </div>
          </footer>
        )}

        {/* Guaranteed Bottom Spacer */}
        <div className="w-full h-8 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  </div>
);
}

