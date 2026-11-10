import React, { useState } from 'react';
import {
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
} from 'lucide-react';

export function LandingPage({ onNavigate, onOpenAuth, currentUser, onLogout }) {
  const [claimUsername, setClaimUsername] = useState('');
  const [showBanner, setShowBanner] = useState(true);

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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {currentUser ? (
              <>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="px-4 sm:px-5 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Dashboard ({currentUser.email ? (currentUser.email.length > 18 ? currentUser.email.substring(0, 16) + '...' : currentUser.email) : 'account'})</span>
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs sm:text-sm font-bold text-gray-700 hover:text-red-600 transition-colors px-2 py-1.5 cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
                  className="text-xs sm:text-sm font-bold text-gray-800 hover:text-black transition-colors px-2.5 py-1.5 cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  Client Portal
                </button>
              </>
            )}
          </div>
        </header>
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

          {/* Right Column: Hero Visual Mockup matching Image 0 */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] rounded-[36px] overflow-hidden shadow-2xl relative bg-[#2C4EE4] aspect-[4/5] border border-black/10 flex flex-col justify-between p-6 sm:p-7 text-white select-none">
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
                      <div className="absolute -top-4 right-1 w-6 h-5 bg-gray-200 rounded-sm border border-gray-400" />
                    )}
                  </div>
                ))}
              </div>

              {/* Top pill badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase text-white/90">
                  Featured Creator
                </span>
                <div className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Central Phone Kiosk Mockup matching Image 0 */}
              <div className="relative z-10 my-auto flex items-center justify-center">
                <div className="w-[260px] sm:w-[275px] rounded-[34px] p-3.5 bg-[#1F3EBE] shadow-2xl ring-4 ring-[#3D63FF]/60 border border-white/20 transform hover:scale-[1.01] transition-transform">
                  <div className="w-full bg-white text-[#111111] rounded-[26px] p-4 flex flex-col items-center text-center shadow-inner">
                    {/* Flower Logo & Handle matching Image 0 */}
                    <div className="w-12 h-12 rounded-full bg-[#1F3EBE] text-white flex items-center justify-center font-black text-xs shadow-sm mb-1.5 ring-2 ring-blue-100">
                      <span>WANNA BE</span>
                    </div>

                    <h3 className="font-black text-base tracking-tight text-[#111111]">
                      Koy Sun
                    </h3>

                    {/* Social Icons row */}
                    <div className="flex items-center gap-2 mt-1 mb-3 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Instagram className="w-3 h-3" />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Youtube className="w-3 h-3 text-red-600" />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <Music className="w-3 h-3 text-pink-600" />
                      </div>
                    </div>

                    {/* Button 1: Check out my work */}
                    <div className="w-full py-2.5 px-3 rounded-full border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors mb-2.5">
                      Check out my work
                    </div>

                    {/* TikTok Embedded Card matching Image 0 */}
                    <div className="w-full bg-[#F3F4F6] rounded-2xl p-2.5 text-left border border-gray-200/80">
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1 font-extrabold text-black">
                          <Music className="w-2.5 h-2.5 text-pink-500" />
                          TikTok
                        </span>
                        <span className="text-gray-400">@koysun</span>
                      </div>
                      <div className="w-full h-18 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 flex items-center justify-center text-white/90 text-[11px] font-bold">
                          🖌️ Studio Painting Session
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-700">Watch full clip</span>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold hover:bg-gray-800 transition-colors"
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Title & CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F7C8D8] leading-[1.02]">
              Share your IndiaTaps<br />anywhere you like!
            </h2>

            <p className="text-base sm:text-lg text-pink-100/80 font-medium max-w-lg leading-relaxed mt-5">
              Add your unique IndiaTaps URL anywhere you find your audience. Share digital menus, lead forms, catalogs, and links with all features unlocked and build as many cards as you want.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => onNavigate('/contact')}
                className="px-8 py-4 rounded-full bg-[#E9C0E9] hover:bg-white text-[#780016] font-extrabold text-sm sm:text-base transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              >
                Inquire for Subscription
              </button>
            </div>
          </div>

          {/* Right Column: Floating Mosaic Tiles matching Image 1 */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-[540px] w-full">
              {/* Tile 1: Beanie Shop item ($20) on Mustard Yellow (Image 1) */}
              <div className="bg-[#D97706] rounded-3xl p-4 flex flex-col items-center justify-between text-white shadow-xl aspect-square relative group hover:scale-[1.02] transition-transform">
                <span className="text-5xl mt-2 drop-shadow-md">🧶</span>
                <span className="font-extrabold text-xs bg-black/40 backdrop-blur-xs px-3.5 py-1 rounded-full shadow-xs self-start">
                  $20
                </span>
              </div>

              {/* Tile 2: Man with notebook & coffee cup (Image 1) */}
              <div className="bg-[#2D4564] rounded-3xl overflow-hidden shadow-xl aspect-square relative group hover:scale-[1.02] transition-transform col-span-1 sm:col-span-2">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
                </div>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  alt="Creator reading"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Tile 3: Man with beanie & Instagram logo (Image 1) */}
              <div className="bg-[#8E7E73] rounded-3xl overflow-hidden shadow-xl aspect-square relative group hover:scale-[1.02] transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
                  alt="Creator"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-black shadow-sm">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tile 4: Audio Player Widget with /averyclothing (Image 1) */}
              <div className="bg-[#1A1E26] rounded-3xl p-4 flex flex-col justify-between text-white shadow-xl col-span-2 aspect-[2/1] sm:aspect-auto hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-white">✱</span>
                  <span className="font-bold text-[11px] text-gray-300 tracking-tight">/averyclothing</span>
                </div>
                <div className="flex items-center gap-3 my-auto py-1">
                  <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0">
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 h-2.5 bg-black rounded-xs" />
                      <div className="w-1 h-2.5 bg-black rounded-xs" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="w-3/5 bg-white h-full rounded-full" />
                  </div>
                </div>
              </div>

              {/* Tile 5: Threads / Social post in Magenta (Image 1) */}
              <div className="bg-[#D9048E] rounded-3xl p-4 flex flex-col justify-between text-white shadow-xl aspect-square hover:scale-[1.02] transition-transform">
                <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center font-extrabold text-sm">
                  @
                </div>
                <div className="space-y-2 mb-1">
                  <div className="w-full h-2 rounded-full bg-white/70" />
                  <div className="w-2/3 h-2 rounded-full bg-white/50" />
                </div>
              </div>

              {/* Tile 6: Book Cover card OUR PLANET (Image 1) */}
              <div className="bg-[#556B2F] rounded-3xl p-4 flex flex-col justify-between text-white shadow-xl aspect-square col-span-2 sm:col-span-2 hover:scale-[1.02] transition-transform relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-black text-xs tracking-widest uppercase text-white/90">
                    OUR PLANET
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white text-green-900 flex items-center justify-center shadow-md">
                    <Play className="w-3 h-3 ml-0.5 fill-green-900" />
                  </div>
                </div>
                <div className="relative z-10 text-[11px] font-semibold text-white/90">
                  Listen to exclusive story audio
                </div>
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
          <div>© {new Date().getFullYear()} IndiaTaps. Direct inquiries: <a href="mailto:sparshkoul6@gmail.com" className="text-white underline font-bold">sparshkoul6@gmail.com</a></div>
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
