import React, { useState } from 'react';
import {
  Menu,
  X,
  Mail,
  Sparkles,
  CheckCircle2,
  QrCode,
  Smartphone,
  Star,
  FileText,
  Instagram,
  ArrowRight,
  Copy,
  Check,
  Building2,
  TrendingUp,
  HelpCircle,
  Layers,
  Palette,
  ShieldCheck,
  Zap,
  DollarSign,
} from 'lucide-react';

export function ContactPage({ onNavigate, onOpenAuth, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contactEmail = 'india.taps7@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const comparisonFeatures = [
    {
      title: 'Unlimited Cards & Pages',
      desc: 'L*nkT*ee charges extra for multiple profiles. With IndiaTaps, one subscription lets you create as many business cards and pages as you want.',
      tag: 'Unlimited Scale',
    },
    {
      title: 'All Premium Themes & Wallpapers',
      desc: 'No locked themes or ugly branding. Access custom CSS palettes, 3D wallpapers, organic vector patterns, and custom fonts without paying extra.',
      tag: 'Full Customization',
    },
    {
      title: 'Interactive Forms & Inquiries',
      desc: 'Capture customer inquiries, bookings, and contact details directly on your page without needing third-party form builders.',
      tag: 'Lead Gen',
    },
    {
      title: 'PDF & Document Viewers',
      desc: 'Embed restaurant menus, catalogs, price lists, and brochures directly into your card with an instant sheet viewer.',
      tag: 'Rich Media',
    },
    {
      title: 'Social & Video Embeds',
      desc: 'Seamlessly link your Instagram, YouTube reels, Spotify playlist, Google Maps, and WhatsApp VIP channels in one hub.',
      tag: 'Social Reach',
    },
    {
      title: 'Dramatically Cheaper Pricing',
      desc: 'Get every single feature unlocked at a fraction of L*nkT*ee’s expensive recurring pricing plans with personal onboarding.',
      tag: 'Best Value',
    },
  ];

  const faqs = [
    {
      q: 'How is IndiaTaps different from L*nkT*ee?',
      a: 'IndiaTaps offers everything L*nkT*ee does—plus rich media, PDF menus, and forms—at a fraction of the cost. More importantly, you can create as many independent cards/pages as you want under a single subscription without paying per-profile fees.',
    },
    {
      q: 'How many cards or pages can I create?',
      a: 'As many as you want! Whether you run 3 restaurants, manage 5 creator profiles, or need distinct pages for different marketing campaigns, you can create unlimited cards under your account.',
    },
    {
      q: 'Are any features locked behind higher tiers?',
      a: 'No. When you get an IndiaTaps subscription, you get all features unlocked: custom wallpapers, fonts, buttons, forms, SEO settings, analytics, and rich media cards.',
    },
    {
      q: 'How do I subscribe and get my account?',
      a: 'Email us directly at india.taps7@gmail.com. We will set up your subscription plan, activate your account, and help you build your first batch of cards.',
    },
    {
      q: 'Can I use custom URLs and QR codes?',
      a: 'Yes! Every card receives its own globally unique permanent URL (e.g. indiataps.com/yourbrand) and an instant QR code you can share on Instagram, print on table standees, or add to business collateral.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#D2E823] text-[#111111] font-sans selection:bg-[#1E3A1E] selection:text-[#D2E823]">
      {/* 1. Top Announcement Banner */}
      {showBanner && (
        <div className="bg-[#4A0012] text-pink-100 text-xs sm:text-sm font-semibold px-4 py-2.5 flex items-center justify-center relative transition-all">
          <div className="text-center truncate pr-6">
            <span>Everything L*nkT*ee does, but way cheaper with unlimited cards. </span>
            <a
              href="#pricing"
              className="underline font-bold hover:text-white cursor-pointer ml-1 inline-block"
            >
              Contact india.taps7@gmail.com for subscription pricing.
            </a>
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

      {/* 2. Floating Capsule Navbar */}
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
                onClick={() => onNavigate('/')}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Home
              </button>
              <a href="#features" className="hover:text-black transition-colors cursor-pointer">
                Features
              </a>
              <a href="#solutions" className="hover:text-black transition-colors cursor-pointer">
                Why Us vs L*nkT*ee
              </a>
              <a href="#pricing" className="hover:text-black text-purple-700 font-bold transition-colors cursor-pointer">
                Subscription & Pricing
              </a>
              <a href="#faq" className="hover:text-black transition-colors cursor-pointer">
                FAQ
              </a>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <button
                onClick={() => onNavigate('/dashboard')}
                className="hidden sm:flex px-4 sm:px-5 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer items-center gap-1.5"
              >
                <span>Dashboard ({currentUser.email ? (currentUser.email.length > 18 ? currentUser.email.substring(0, 16) + '...' : currentUser.email) : 'account'})</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
                  className="hidden sm:inline-block text-xs sm:text-sm font-bold text-gray-800 hover:text-black transition-colors px-2.5 py-1.5 cursor-pointer"
                >
                  Log in
                </button>
                <a
                  href="#pricing"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  Get Subscription
                </a>
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
                  onNavigate('/');
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Home Page</span>
                <span className="text-xs text-gray-400">← Back</span>
              </button>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Features</span>
                <span className="text-[11px] text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full">All Unlocked</span>
              </a>
              <a
                href="#solutions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Why Us vs L*nkT*ee</span>
                <span className="text-[11px] text-gray-500 font-medium">Comparison</span>
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-extrabold transition-colors flex items-center justify-between cursor-pointer border border-purple-200/60"
              >
                <span>Subscription & Pricing</span>
                <span className="text-xs text-emerald-600 font-extrabold">Best Value</span>
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Frequently Asked Questions</span>
                <span className="text-xs text-gray-400">FAQ</span>
              </a>
            </nav>

            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {currentUser ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('/dashboard');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-white font-bold text-xs text-center cursor-pointer"
                >
                  Go to Dashboard ({currentUser.email})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard');
                  }}
                  className="w-full py-2.5 rounded-full border border-gray-300 text-gray-800 font-bold text-xs text-center hover:bg-gray-50 cursor-pointer"
                >
                  Sign In to Client Portal
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Hero Section: Lime Green Hero Style */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-16 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle & Claim URL */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A1E]/10 text-xs font-bold text-[#1E3A1E] mb-4 self-start">
              <Zap className="w-3.5 h-3.5 text-[#1E3A1E]" />
              <span>The Affordable L*nkT*ee Alternative for Businesses</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-black tracking-tight text-[#1E3A1E] leading-[0.96]">
              Everything L*nkT*ee does.<br />Way cheaper.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#1E3A1E]/85 font-medium max-w-xl leading-relaxed mt-6">
              Why pay exorbitant monthly fees for simple link pages? Get an IndiaTaps subscription and unlock all pro features—forms, rich cards, PDF menus, custom designs, and analytics—and create as many cards as you want.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 max-w-lg">
              <a
                href="#pricing"
                className="px-8 py-4 rounded-full bg-[#1E3A1E] hover:bg-[#152B15] text-[#D2E823] font-bold text-sm sm:text-base transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Get Subscription & Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Visual Mockup matching LandingPage */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] rounded-[36px] overflow-hidden shadow-2xl relative bg-[#2C4EE4] aspect-[4/5] border border-black/10 flex flex-col justify-between p-6 sm:p-7 text-white select-none">
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #1A32A8 0px, #1A32A8 18px, #3A5EFF 20px, #2A48D4 36px)',
                }}
              />

              {/* Top pill badge */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase text-white/90">
                  All Features Unlocked
                </span>
                <div className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Central Phone Mockup */}
              <div className="relative z-10 my-auto flex items-center justify-center">
                <div className="w-[260px] sm:w-[275px] rounded-[34px] p-3.5 bg-[#1F3EBE] shadow-2xl ring-4 ring-[#3D63FF]/60 border border-white/20 transform hover:scale-[1.01] transition-transform">
                  <div className="w-full bg-white text-[#111111] rounded-[26px] p-4 flex flex-col items-center text-center shadow-inner">
                    <div className="w-12 h-12 rounded-full bg-[#1E3A1E] text-[#D2E823] flex items-center justify-center font-black text-xs shadow-sm mb-1.5 ring-2 ring-emerald-100">
                      <span>BIZ</span>
                    </div>

                    <h3 className="font-black text-base tracking-tight text-[#111111]">
                      Your Business Brand
                    </h3>
                    <div className="text-[10px] text-gray-500 font-medium mb-3">
                      indiataps.com/yourname
                    </div>

                    {/* Card 1: Form / Contact Card */}
                    <div className="w-full py-2.5 px-3 rounded-full bg-[#FAFBFB] border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-100 transition-colors mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        <span>Inquire & Book Us</span>
                      </span>
                      <span className="text-[9px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded-sm">Form</span>
                    </div>

                    {/* Card 2: Interactive Menu / PDF */}
                    <div className="w-full py-2.5 px-3 rounded-full bg-[#FAFBFB] border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-100 transition-colors mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                        <span>Menu & Catalog</span>
                      </span>
                      <span className="text-[9px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-sm">PDF</span>
                    </div>

                    {/* Card 3: Social & Reviews */}
                    <div className="w-full py-2.5 px-3 rounded-full bg-[#FAFBFB] border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Reviews & Socials</span>
                      </span>
                      <span className="text-[10px] text-gray-400">5.0 ★</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption footer */}
              <div className="relative z-10 text-center font-mono text-xs font-semibold text-white/90 tracking-wide mt-2">
                Make unlimited cards under 1 subscription
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Second Section: Burgundy/Maroon Features Showcase */}
      <section id="features" className="w-full bg-[#780016] text-white py-20 sm:py-28 px-4 sm:px-8 lg:px-12 selection:bg-pink-300 selection:text-[#780016]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Title & CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F7C8D8] leading-[1.02]">
              All features included.<br />Build unlimited cards.
            </h2>

            <p className="text-base sm:text-lg text-pink-100/80 font-medium max-w-lg leading-relaxed mt-5">
              L*nkT*ee nickel-and-dimes you for extra accounts, custom styling, form buttons, and analytics. With an IndiaTaps subscription, you get all the features and the freedom to create as many business cards as you need.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="#pricing"
                className="px-8 py-4 rounded-full bg-[#E9C0E9] hover:bg-white text-[#780016] font-extrabold text-sm sm:text-base transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              >
                Inquire for Subscription
              </a>
            </div>
          </div>

          {/* Right Column: Floating Mosaic Tiles matching LandingPage Image 1 */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-w-[540px] w-full">
              {/* Tile 1: Unlimited Cards (Mustard Yellow) */}
              <div className="bg-[#D97706] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-white shadow-xl aspect-square relative group hover:scale-[1.03] transition-all overflow-hidden border border-white/10">
                <div className="flex items-center justify-between relative z-10">
                  <Layers className="w-5 h-5 text-yellow-200" />
                  <span className="text-[10px] font-extrabold uppercase bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping" />
                    Unlimited
                  </span>
                </div>

                {/* Animated stacked mini cards */}
                <div className="relative my-auto py-2 flex items-center justify-center">
                  <div className="w-4/5 h-10 bg-amber-800/40 rounded-xl transform -rotate-6 scale-90 -translate-y-2 absolute border border-white/10" />
                  <div className="w-4/5 h-10 bg-amber-700/50 rounded-xl transform rotate-3 scale-95 -translate-y-1 absolute border border-white/15" />
                  <div className="w-full bg-white/95 text-stone-900 rounded-xl p-2.5 shadow-lg relative z-10 flex items-center justify-between border border-white/40 transform group-hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm">☕</span>
                      <span className="text-xs font-black truncate">Downtown Cafe</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md shrink-0">Active</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-xl font-black">∞ Cards</div>
                  <div className="text-[11px] font-medium text-yellow-100">Create as many as you need</div>
                </div>
              </div>

              {/* Tile 2: Cheaper Pricing (Navy/Slate) */}
              <div className="bg-[#2D4564] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-white shadow-xl aspect-square relative group hover:scale-[1.02] transition-all col-span-1 sm:col-span-2 border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-200" />
                    <span className="text-sm font-black text-white">Flat Pricing</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400 animate-pulse" />
                    Save 80%+
                  </span>
                </div>

                {/* Side-by-side interactive price comparison component */}
                <div className="grid grid-cols-2 gap-2.5 my-auto py-1 relative z-10">
                  <div className="bg-black/30 backdrop-blur-xs rounded-2xl p-2.5 border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-300 line-through">L*nkT*ee</span>
                      <span className="text-[9px] text-gray-400">per page</span>
                    </div>
                    <div className="mt-1 text-xs font-black text-red-200 line-through">$24+/mo each</div>
                    <div className="text-[9px] text-gray-400">Tiers lock pro styles</div>
                  </div>

                  <div className="bg-[#00E575]/20 backdrop-blur-xs rounded-2xl p-2.5 border border-[#00E575]/50 flex flex-col justify-between shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#00E575] flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> IndiaTaps
                      </span>
                      <span className="text-[9px] text-emerald-300 font-bold">1 Plan</span>
                    </div>
                    <div className="mt-1 text-xs font-black text-white">One low subscription</div>
                    <div className="text-[9px] text-emerald-200">Unlimited cards & features</div>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-xl font-black">Fraction of L*nkT*ee's Cost</div>
                  <div className="text-[11px] text-blue-100 mt-0.5">Everything unlocked without expensive tiers</div>
                </div>
              </div>

              {/* Tile 3: Custom Themes & Wallpapers (Earthy) */}
              <div className="bg-[#8E7E73] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-white shadow-xl aspect-square relative group hover:scale-[1.03] transition-all border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-full">Pro Styles</span>
                </div>

                {/* Animated Theme Preview Widget */}
                <div className="my-auto py-1 relative z-10 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded-full bg-[#D2E823] ring-2 ring-white/50 animate-pulse" />
                    <div className="w-4 h-4 rounded-full bg-[#2C4EE4] opacity-90" />
                    <div className="w-4 h-4 rounded-full bg-[#FF3B30] opacity-90" />
                    <div className="w-4 h-4 rounded-full bg-[#111111] opacity-90" />
                  </div>
                  <div className="w-full bg-black/30 rounded-xl p-2 border border-white/10 flex items-center justify-between text-center">
                    <span className="text-[10px] font-bold text-stone-200">3D Backgrounds</span>
                    <span className="text-[9px] bg-white/20 text-white font-extrabold px-1.5 py-0.5 rounded">Unlocked</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="font-extrabold text-sm leading-tight">Pro Themes</div>
                  <div className="text-[10px] text-stone-200 mt-0.5">No locked walls or watermarks</div>
                </div>
              </div>

              {/* Tile 4: Forms & Lead Capture (Dark Slate) */}
              <div className="bg-[#1A1E26] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-white shadow-xl col-span-2 aspect-[2/1] sm:aspect-auto hover:scale-[1.02] transition-all border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#00E575]">
                    <Mail className="w-4 h-4" />
                    <span>Lead Capture & Inquiries</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-ping" />
                    Active Form
                  </span>
                </div>

                {/* Interactive Simulated Lead Input Bar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 my-2 flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2 truncate px-2 text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono truncate">india.taps7@gmail.com</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-[#00E575] text-[#111111] font-black text-xs shrink-0 flex items-center gap-1 shadow-md">
                    <span>Captured</span>
                    <Check className="w-3 h-3" />
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="text-base font-black text-white">Interactive Business Cards</div>
                  <div className="text-[11px] text-gray-400">PDF menus, booking forms, review links & WhatsApp in one link.</div>
                </div>
              </div>

              {/* Tile 5: Social Media Hub (Magenta) */}
              <div className="bg-[#D9048E] rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-white shadow-xl aspect-square hover:scale-[1.03] transition-all border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded-full">Socials</span>
                </div>

                {/* Animated Social Reach Pill */}
                <div className="my-auto py-1 relative z-10">
                  <div className="bg-black/25 backdrop-blur-xs rounded-2xl p-2 border border-white/10 flex items-center justify-between">
                    <div className="truncate">
                      <div className="text-[11px] font-black text-white truncate">@yourbrand</div>
                      <div className="text-[9px] text-pink-200">Reels & Clicks</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-400/20 text-[#00E575] text-[10px] font-black flex items-center gap-0.5 shrink-0">
                      <TrendingUp className="w-2.5 h-2.5" /> +4.2k
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="font-extrabold text-sm leading-tight">Instagram & Reels</div>
                  <div className="text-[10px] text-pink-200">Direct followers & visitors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why Us vs L*nkT*ee Section */}
      <section id="solutions" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E3A1E]/10 text-xs font-bold text-[#1E3A1E] mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#1E3A1E]" />
            <span>Why Switch from L*nkT*ee</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1E3A1E]">
            How IndiaTaps beats L*nkT*ee for your business
          </h2>
          <p className="text-sm sm:text-base text-[#1E3A1E]/80 mt-3 font-medium">
            Designed for businesses, cafes, creators, and freelancers who want maximum features without paying high monthly fees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#D2E823] text-[#1E3A1E] flex items-center justify-center font-black text-lg shadow-xs">
              01
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
                Far Cheaper Pricing
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                L*nkT*ee charges heavily for Pro and Premium plans just to unlock basic styling and links. IndiaTaps provides everything at a fraction of the cost.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#D2E823] text-[#1E3A1E] flex items-center justify-center font-black text-lg shadow-xs">
              02
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
                Make Unlimited Cards
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Under one subscription account, you can create and manage as many cards and pages as you want for different branches, ventures, or clients.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#D2E823] text-[#1E3A1E] flex items-center justify-center font-black text-lg shadow-xs">
              03
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
                Built-in Form & Inquiry Cards
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Create contact forms, booking cards, and lead generators directly inside your card without paying for Typeform or external form subscriptions.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/10 shadow-sm flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#D2E823] text-[#1E3A1E] flex items-center justify-center font-black text-lg shadow-xs">
              04
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-snug">
                PDF Menus & Catalogs
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Upload menus, lookbooks, or catalogs with a native in-page sheet viewer. Perfect for restaurants, salons, boutiques, and consulting firms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Direct Contact & Subscription Section (Email & Copy only) */}
      <section id="pricing" className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <div className="bg-[#1E3A1E] text-white rounded-[40px] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold text-[#D2E823] mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D2E823]" />
            <span>Subscription & Pricing Inquiry</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Ready to get your subscription & create unlimited cards?
          </h2>

          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
            Contact us directly at india.taps7@gmail.com to get your account provisioned, choose your subscription plan, and start creating as many cards and forms as your business needs.
          </p>

          {/* Email Highlight Card with 1-Click Copy */}
          <div className="mt-8 max-w-lg mx-auto p-6 rounded-3xl bg-white text-[#111111] shadow-xl space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1E3A1E] text-[#D2E823] flex items-center justify-center shrink-0 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Official Contact Email
                </div>
                <div className="font-extrabold text-base sm:text-xl text-gray-900 select-all font-mono">
                  {contactEmail}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`mailto:${contactEmail}?subject=IndiaTaps%20Subscription%20and%20Pricing%20Inquiry`}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-full bg-[#1E3A1E] hover:bg-[#152B15] text-[#D2E823] font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#D2E823]" />
                <span>Email Us Directly</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-full border border-gray-300 hover:border-black bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guidance on what to mention */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left text-xs text-white/90">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
              <span className="font-bold text-[#D2E823] block mb-0.5">1. Your Business</span>
              Mention your brand, agency, or cafe name.
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
              <span className="font-bold text-[#D2E823] block mb-0.5">2. Card Count</span>
              You can create as many cards as you want.
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
              <span className="font-bold text-[#D2E823] block mb-0.5">3. Custom Features</span>
              Tell us what forms or integrations you need.
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-16 border-t border-black/10">
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E3A1E]/70">
            Common Questions
          </span>
          <h2 className="text-3xl font-black tracking-tight text-[#1E3A1E] mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-black/10 shadow-2xs space-y-2">
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="w-full bg-[#111111] text-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-800 pb-8">
          <div>
            <div className="font-black text-xl tracking-tighter flex items-center gap-0.5">
              <span>IndiaTaps</span>
              <span className="text-xl -mt-1 leading-none text-[#00E575]">*</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              The affordable L*nkT*ee alternative. All features unlocked, unlimited cards.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('/')}
              className="px-5 py-2.5 rounded-full border border-gray-600 hover:border-white text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Back to Home
            </button>
            <button
              onClick={() => (onOpenAuth ? onOpenAuth('login') : onNavigate('/dashboard'))}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-gray-100 text-[#111111] font-bold text-xs transition-colors cursor-pointer"
            >
              Client Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© {new Date().getFullYear()} IndiaTaps. Direct inquiries: <a href={`mailto:${contactEmail}`} className="text-white underline font-bold">{contactEmail}</a></div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Subscription</a>
            <a href="#faq" className="hover:text-white transition-colors cursor-pointer">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
