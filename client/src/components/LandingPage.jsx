import React, { useState } from 'react';
import {
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Sparkles,
  QrCode,
  Instagram,
  Youtube,
  Music,
  ShoppingBag,
  Play,
  Star,
  Check,
  ChevronDown,
  FileText,
  Smartphone,
  Zap,
  Layers,
  MapPin,
  MessageCircle,
  Heart,
  Coffee,
  Calendar,
  UtensilsCrossed,
} from 'lucide-react';

export function LandingPage({ onNavigate, onOpenAuth, currentUser, onLogout }) {
  const [claimUsername, setClaimUsername] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleClaim = (e) => {
    e?.preventDefault();
    const clean = (claimUsername || '').trim().toLowerCase();
    if (clean) {
      onNavigate(`/dashboard?claim=${encodeURIComponent(clean)}`);
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#D2E823] text-[#111111] font-sans selection:bg-[#1E3A1E] selection:text-[#D2E823]">
      {/* 1. Top Announcement Banner (Image 0) */}
      {showBanner && (
        <div className="bg-[#4A0012] text-pink-100 text-xs sm:text-sm font-semibold px-4 py-2.5 flex items-center justify-center relative transition-all">
          <div className="text-center truncate pr-6">
            <span>Everything L*nkT*ee does, but way cheaper with unlimited cards. </span>
            <button
              onClick={() => onNavigate('/contact')}
              className="underline font-bold hover:text-white cursor-pointer ml-1 inline-block"
            >
              Contact Sparsh for pricing.
            </button>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-1 text-pink-200 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Floating Capsule Navbar (Image 0 & 1) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 sticky top-0 z-40">
        <header className="bg-white rounded-full px-5 sm:px-8 py-3.5 flex items-center justify-between shadow-sm border border-black/5">
          {/* Brand Logo & Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <button
              onClick={() => onNavigate('/')}
              className="font-black text-xl sm:text-2xl tracking-tighter text-[#111111] flex items-center gap-0.5 cursor-pointer"
            >
              <span>IndiaTaps</span>
              <span className="text-xl leading-none font-black -mt-1 text-[#111111]">*</span>
            </button>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
              <button
                onClick={() => onNavigate('/contact')}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Solutions
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="hover:text-black text-purple-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hidden sm:flex px-4 sm:px-5 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer items-center gap-1.5"
                >
                  <span>Dashboard ({currentUser.email ? (currentUser.email.length > 18 ? currentUser.email.substring(0, 16) + '...' : currentUser.email) : 'account'})</span>
                </button>
                <button
                  onClick={onLogout}
                  className="hidden sm:inline-block text-xs sm:text-sm font-bold text-gray-700 hover:text-red-600 transition-colors px-2 py-1.5 cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
                  className="hidden sm:inline-block text-xs sm:text-sm font-bold text-gray-800 hover:text-black transition-colors px-2.5 py-1.5 cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  Client Portal
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-black transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-black/10 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
            <nav className="flex flex-col space-y-1 text-sm font-bold text-gray-800">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/contact#features');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Features</span>
                <span className="text-[11px] text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full">All Unlocked</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/contact#solutions');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Solutions</span>
                <span className="text-[11px] text-gray-500 font-medium">Cafes • Creators • Brands</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/contact#pricing');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Pricing & Plans</span>
                <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full">Best Value</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/contact');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-extrabold transition-colors flex items-center justify-between cursor-pointer border border-purple-200/60"
              >
                <span>Contact Sparsh</span>
                <span className="text-xs text-purple-700 font-bold">Direct Support →</span>
              </button>
            </nav>

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('/dashboard');
                    }}
                    className="w-full py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white font-bold text-xs text-center cursor-pointer"
                  >
                    Go to Dashboard ({currentUser.email})
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard');
                    }}
                    className="flex-1 py-2.5 rounded-full border border-gray-300 text-gray-800 font-bold text-xs text-center hover:bg-gray-50 cursor-pointer"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard');
                    }}
                    className="flex-1 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] font-bold text-xs text-center shadow-sm cursor-pointer"
                  >
                    Client Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Hero Section (Image 0: Lime Green Linktree Hero) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-16 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle & Claim URL */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-black tracking-tight text-[#1E3A1E] leading-[0.96]">
              A link in bio<br />built for you.
            </h1>

            <div className="mt-6 mb-2 inline-flex flex-wrap items-center gap-3 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-[#1E3A1E] text-[#D2E823] text-lg sm:text-2xl lg:text-3xl font-black tracking-tight self-start shadow-xl border-2 border-black/10 transform -rotate-1 hover:rotate-0 hover:scale-[1.02] transition-all select-none">
              <span className="w-3 h-3 rounded-full bg-[#00E575] animate-ping shrink-0" />
              <span>F*ck L*nkT*ee. Do way more, pay way less.</span>
            </div>

            <p className="text-base sm:text-lg lg:text-xl text-[#1E3A1E]/85 font-medium max-w-xl leading-relaxed mt-5">
              Stop overpaying monthly fees for basic link profiles. An IndiaTaps subscription unlocks every pro feature—custom themes, PDF menus, lead capture forms, and analytics—with the freedom to create as many cards as your business needs.
            </p>

            {/* Claim URL form */}
            <form
              onSubmit={handleClaim}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg w-full"
            >
              <div className="flex-1 flex items-center bg-white rounded-2xl sm:rounded-full px-4 py-3.5 border border-black/10 shadow-xs focus-within:ring-2 focus-within:ring-[#1E3A1E] transition-all">
                <span className="text-sm sm:text-base font-semibold text-gray-400 select-none">
                  indiataps.vercel.app/
                </span>
                <input
                  type="text"
                  value={claimUsername}
                  onChange={(e) =>
                    setClaimUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                    )
                  }
                  placeholder="yourname"
                  className="w-full bg-transparent border-0 outline-none font-bold text-sm sm:text-base text-[#111111] placeholder:text-gray-300 ml-0.5"
                />
              </div>
              <button
                type="submit"
                className="px-7 py-3.5 rounded-full bg-[#1E3A1E] hover:bg-[#152B15] text-[#D2E823] font-bold text-sm sm:text-base transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer text-center"
              >
                Get started for free
              </button>
            </form>
          </div>

          {/* Right Column: Hero Visual Mockup matching Image 0 with Living Animations */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] rounded-[36px] overflow-hidden shadow-2xl relative bg-[#2C4EE4] aspect-[4/5] border border-black/10 flex flex-col justify-between p-6 sm:p-7 text-white select-none group">
              {/* Glowing ambient light orbs inside card */}
              <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-cyan-400/25 blur-3xl animate-hero-glow pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-indigo-600/35 blur-3xl animate-hero-glow pointer-events-none" />

              {/* Blue ribbed corrugated background texture */}
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #1A32A8 0px, #1A32A8 18px, #3A5EFF 20px, #2A48D4 36px)',
                }}
              />

              {/* Ladder & Studio Accents (Background Layer) */}
              <div className="absolute right-4 top-10 bottom-6 w-20 border-r-4 border-l-4 border-[#C89D66]/50 flex flex-col justify-between py-6 pointer-events-none z-0">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div key={step} className="h-2 bg-[#B88A52]/70 w-full relative">
                    {step === 1 && (
                      <div className="absolute -top-4 right-1 w-6 h-5 bg-gray-200 rounded-sm border border-gray-400 shadow-xs" />
                    )}
                  </div>
                ))}
              </div>

              {/* Top pill badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase text-white/95 flex items-center gap-1.5 border border-white/10 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#00E575] animate-pulse" />
                  <span>Featured Creator</span>
                </span>
                <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
              </div>

              {/* Central Phone Kiosk Mockup with Gentle Living Float */}
              <div className="relative z-10 my-auto flex items-center justify-center">
                {/* Floating Micro-Pill 1: 2.4k Likes */}
                <div className="absolute -left-2 sm:-left-5 top-1/4 z-20 bg-white/95 backdrop-blur-md text-[#111111] px-3 py-1.5 rounded-2xl shadow-xl border border-white/40 flex items-center gap-1.5 text-[11px] font-black animate-hero-float [animation-delay:0.5s] hover:scale-105 transition-transform pointer-events-none">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                  <span>2.4k Likes</span>
                </div>

                {/* Floating Micro-Pill 2: 480 Taps Today */}
                <div className="absolute -right-2 sm:-right-4 bottom-1/4 z-20 bg-[#111318]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-xl border border-white/15 flex items-center gap-1.5 text-[11px] font-extrabold animate-hero-float [animation-delay:1.5s] hover:scale-105 transition-transform pointer-events-none">
                  <Zap className="w-3.5 h-3.5 text-[#00E575] fill-[#00E575] animate-bounce" />
                  <span>480 Taps Today</span>
                </div>

                {/* Floating Phone Frame with Gentle Hover Breath */}
                <div className="w-[260px] sm:w-[275px] rounded-[34px] p-3.5 bg-[#1F3EBE] shadow-2xl ring-4 ring-[#3D63FF]/70 border border-white/20 animate-hero-float transition-all hover:ring-[#00E575]/70">
                  <div className="w-full bg-white text-[#111111] rounded-[26px] p-4 flex flex-col items-center text-center shadow-inner">
                    {/* Flower Logo & Handle with Online Indicator */}
                    <div className="relative mb-1.5">
                      <div className="w-12 h-12 rounded-full bg-[#1F3EBE] text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-blue-100">
                        <span>WANNA BE</span>
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00E575] border-2 border-white ring-2 ring-[#00E575]/30 animate-pulse" />
                    </div>

                    <h3 className="font-black text-base tracking-tight text-[#111111]">
                      Koy Sun
                    </h3>

                    {/* Social Icons row with interactive hover */}
                    <div className="flex items-center gap-2 mt-1 mb-3 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-pink-100 hover:text-pink-600 transition-colors cursor-pointer hover:scale-110">
                        <Instagram className="w-3 h-3" />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer hover:scale-110">
                        <Youtube className="w-3 h-3 text-red-600" />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer hover:scale-110">
                        <Music className="w-3 h-3 text-pink-600" />
                      </div>
                    </div>

                    {/* Button 1: Check out my work */}
                    <div className="w-full py-2.5 px-3 rounded-full border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs hover:bg-[#D2E823] hover:text-[#1E3A1E] hover:border-[#1E3A1E] transition-all mb-2.5 cursor-pointer hover:scale-[1.02]">
                      Check out my work
                    </div>

                    {/* TikTok Embedded Card with Animated Soundwave */}
                    <div className="w-full bg-[#F3F4F6] rounded-2xl p-2.5 text-left border border-gray-200/80 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1.5 font-extrabold text-black">
                          <Music className="w-2.5 h-2.5 text-pink-500" />
                          <span>TikTok</span>
                          {/* Animated Soundwave Equalizer */}
                          <div className="flex items-end gap-0.5 h-2.5 ml-1">
                            <div className="w-0.5 bg-[#00E575] rounded-full animate-soundwave-1" />
                            <div className="w-0.5 bg-[#00E575] rounded-full animate-soundwave-2" />
                            <div className="w-0.5 bg-[#00E575] rounded-full animate-soundwave-3" />
                          </div>
                        </span>
                        <span className="text-gray-400 font-mono">@koysun</span>
                      </div>

                      {/* Video Thumbnail with Shimmer Light */}
                      <div className="w-full h-18 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 overflow-hidden relative shadow-inner group-hover:brightness-105 transition-all">
                        <div className="absolute inset-0 flex items-center justify-center text-white/95 text-[11px] font-black drop-shadow-md">
                          🖌️ Studio Painting Session
                        </div>
                        <div className="absolute bottom-1 right-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                          0:45
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-700">Watch full clip</span>
                        <button
                          type="button"
                          className="px-3.5 py-1 rounded-full bg-black hover:bg-[#1E3A1E] text-white text-[10px] font-extrabold transition-all hover:scale-105 cursor-pointer shadow-xs"
                        >
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption footer matching Image 0 */}
              <div className="relative z-10 text-center font-mono text-xs font-semibold text-white/90 tracking-wide mt-2">
                Koy Sun. Lettering artist and illustrator.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Second Section: Burgundy/Maroon Showcase (Image 1) */}
      <section className="w-full bg-[#780016] text-white py-20 sm:py-28 px-4 sm:px-8 lg:px-12 selection:bg-pink-300 selection:text-[#780016]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Title & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-center text-left">
              <span className="text-xs font-black uppercase tracking-widest text-[#F7C8D8] bg-white/10 px-3.5 py-1.5 rounded-full self-start mb-4 border border-white/10">
                All Features Included
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F7C8D8] leading-[1.02]">
                Share your IndiaTaps<br />anywhere you like!
              </h2>

              <p className="text-base sm:text-lg text-pink-100/90 font-medium max-w-lg leading-relaxed mt-5">
                Add your unique IndiaTaps URL anywhere you find your audience. Share digital menus, lead forms, catalogs, and links with all features unlocked and build as many cards as you want.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('/contact')}
                  className="px-8 py-4 rounded-full bg-[#E9C0E9] hover:bg-white text-[#780016] font-extrabold text-sm sm:text-base transition-all shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  Inquire for Subscription
                </button>
                <button
                  onClick={() => onNavigate('/contact#pricing')}
                  className="px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base transition-all border border-white/20 cursor-pointer"
                >
                  Compare with L*nkT*ee
                </button>
              </div>
            </div>

            {/* Right Column: Floating Mosaic Tiles filled with Rich IndiaTaps Features */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[620px]">
                {/* Tile 1: Restaurant Digital Menu with Real Food Items & Prices */}
                <div className="bg-gradient-to-br from-[#D97706] to-[#B45309] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform border border-amber-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs block">Restaurant Menu</span>
                        <span className="text-[10px] text-amber-100/80">Embedded PDF Sheet</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[11px] bg-black/30 px-2.5 py-0.5 rounded-full">
                      $16.50
                    </span>
                  </div>

                  <div className="my-3 p-3 rounded-2xl bg-black/20 backdrop-blur-xs space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span>Truffle Pasta</span>
                      <span className="text-amber-200">$16.50</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-100/80 text-[11px]">
                      <span>Woodfired Pizza</span>
                      <span>$14.00</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-100">
                    <span>⚡ Instant PDF sheet preview</span>
                    <span className="underline">View Menu →</span>
                  </div>
                </div>

                {/* Tile 2: Table Booking & Lead Inquiries Form */}
                <div className="bg-[#1A1E26] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs block">Table Booking Form</span>
                        <span className="text-[10px] text-gray-400">Direct Inquiries</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Live
                    </span>
                  </div>

                  <div className="my-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center justify-between">
                    <span>Table for 2 • 8:00 PM Tonight</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <button className="w-full py-2 px-3 rounded-xl bg-[#00E575] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Reserve via WhatsApp VIP</span>
                  </button>
                </div>

                {/* Tile 3: Audio & Story Player Widget */}
                <div className="bg-[#12161F] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform border border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#00E575]">✱</span>
                      <span className="font-bold text-xs text-gray-300">/averyclothing</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">03:42 / 18:20</span>
                  </div>

                  <div className="my-3 space-y-1.5">
                    <span className="font-extrabold text-xs block truncate text-white">The Creator Journey • Ep. 12</span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </div>
                      <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                        <div className="w-3/5 bg-[#00E575] h-full rounded-full" />
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium">Embed Spotify, Podcasts & SoundCloud</span>
                </div>

                {/* Tile 4: Multi-Card Stack (Unlimited Profiles on 1 Subscription) */}
                <div className="bg-gradient-to-br from-[#D9048E] to-[#9D174D] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform border border-pink-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs block">Unlimited Cards</span>
                        <span className="text-[10px] text-pink-100/80">1 Subscription</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">
                      Zero Fees
                    </span>
                  </div>

                  <div className="my-2.5 space-y-1.5 text-xs font-mono">
                    <div className="bg-black/30 px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span className="truncate">indiataps.com/riyast</span>
                      <span className="text-[10px] text-pink-200">Cafe</span>
                    </div>
                    <div className="bg-black/30 px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span className="truncate">indiataps.com/bistro</span>
                      <span className="text-[10px] text-pink-200">Cocktails</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-pink-100">Create & manage unlimited brand cards</span>
                </div>

                {/* Tile 5: Google Reviews & Maps Navigation */}
                <div className="bg-[#2D4564] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform border border-blue-400/20 sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-300" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs block">Google Reviews & Maps Hub</span>
                        <span className="text-[10px] text-blue-200">Drive In-Store Visits</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-300 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-300" />
                      <span>4.9 (530+ Reviews)</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-100 bg-black/20 p-2.5 rounded-xl">
                    <span>124 MG Road, Indiranagar • Open now</span>
                    <span className="text-white font-bold underline cursor-pointer">Open Maps →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Matrix Grid: All Features Included (Matches Contact Page) */}
          <div className="pt-8 border-t border-white/10">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-pink-200 bg-pink-950/40 px-3 py-1 rounded-full border border-pink-400/20">
                Full Comparison Checklist
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#F7C8D8]">
                Everything L*nkT*ee Charges For, Unlocked For You
              </h3>
              <p className="text-xs sm:text-sm text-pink-100/70">
                No paywalls, no hidden add-ons, and no per-profile fees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 bg-pink-900/40 px-2.5 py-0.5 rounded-full">
                    Unlimited Scale
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">Unlimited Cards & Pages</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  L*nkT*ee charges extra for each profile. With IndiaTaps, create as many independent business pages as you need under 1 subscription.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-900/40 px-2.5 py-0.5 rounded-full">
                    Rich Media
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">PDF & Document Viewers</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  Embed restaurant menus, catalogs, price sheets, and event brochures directly into your card with an instant sheet viewer.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/40 px-2.5 py-0.5 rounded-full">
                    Lead Gen
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">Interactive Forms & Bookings</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  Capture customer inquiries, table reservations, and contact requests directly on your card without third-party form apps.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                    Design Freedom
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">3D Wallpapers & Themes</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  Access 3D gradients, organic vector wallpapers, custom typography, and pill button styles without ugly watermarks.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                    Social Reach
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">Social & Video Embeds</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  Seamlessly connect Instagram reels, YouTube clips, Spotify tracks, and WhatsApp channels directly on your profile.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/20 border border-white/10 hover:border-white/20 transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-2xl bg-[#00E575]/20 text-[#00E575] flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00E575] bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                    Print Ready
                  </span>
                </div>
                <h4 className="font-black text-sm text-white">Permanent URL & Vector QR</h4>
                <p className="text-xs text-pink-100/75 leading-relaxed">
                  Every card receives a permanent clean link (`indiataps.com/slug`) and dynamic QR code ready for table tents and flyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimal Clean SaaS Footer */}
      <footer className="w-full bg-[#111111] text-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-800 pb-8">
          <div>
            <div className="font-black text-xl tracking-tighter flex items-center gap-0.5">
              <span>IndiaTaps</span>
              <span className="text-xl -mt-1 leading-none">*</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              The all-in-one link in bio for creators, restaurants, and businesses.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/contact')}
              className="px-5 py-2.5 rounded-full border border-gray-600 hover:border-white text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Contact & Pricing
            </button>
            <button
              onClick={() => onNavigate('/dashboard')}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-gray-100 text-[#111111] font-bold text-xs transition-colors cursor-pointer"
            >
              Client Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© {new Date().getFullYear()} IndiaTaps. Direct inquiries: <a href="mailto:india.taps7@gmail.com" className="text-white underline font-bold">india.taps7@gmail.com</a></div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Pricing</button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
