import React from 'react';

/**
 * TreeSkeleton
 * Linktree-style animated skeleton placeholder displayed while a public
 * profile/card is loading from the server.
 * Uses empty structured divs with pulse & shimmer effects so zero mock data
 * is flashed to the user.
 */
export function TreeSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#F3F3F1] flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-x-hidden select-none pointer-events-none"
      aria-busy="true"
      aria-label="Loading digital card"
    >
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white/60 via-transparent to-black/5" />

      {/* Top Header Bar */}
      <header className="w-full max-w-xl flex items-center justify-between mb-6 z-10">
        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center animate-pulse">
          <span className="text-black/25 text-base font-black leading-none">✱</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center animate-pulse shadow-sm">
          <div className="w-3.5 h-3.5 rounded-full bg-black/20" />
        </div>
      </header>

      {/* Profile Section */}
      <div className="w-full max-w-xl flex flex-col items-center text-center z-10 mb-8">
        {/* Avatar Circle */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/10 border-2 border-white/70 shadow-sm animate-pulse flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          <svg className="w-10 h-10 text-black/15" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        {/* Profile Title / Handle */}
        <div className="mt-4 h-6 w-36 sm:w-44 bg-black/15 rounded-full animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>

        {/* Bio / Tagline */}
        <div className="mt-2.5 h-3.5 w-48 sm:w-60 bg-black/10 rounded-full animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Empty Structured Cards (Skeleton Placeholders) */}
      <div className="w-full max-w-xl space-y-3.5 z-10 flex-1 flex flex-col items-center justify-start">
        {/* 1. Featured / Map-style Card */}
        <div className="w-full h-44 sm:h-48 rounded-3xl bg-white/80 border border-black/10 shadow-sm p-4 flex flex-col justify-between animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="w-full h-24 sm:h-28 rounded-2xl bg-black/10 flex items-center justify-center relative overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-4 w-40 bg-black/15 rounded-full" />
            <div className="h-3 w-56 max-w-[80%] bg-black/10 rounded-full" />
          </div>
        </div>

        {/* 2. Standard Pill Card */}
        <div className="w-full h-14 sm:h-16 rounded-full bg-white/80 border border-black/10 shadow-sm px-6 flex items-center justify-between animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="w-4" />
          <div className="h-4 w-36 bg-black/15 rounded-full" />
          <div className="flex gap-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
          </div>
        </div>

        {/* 3. Icon + Text Pill Card */}
        <div className="w-full h-14 sm:h-16 rounded-full bg-white/80 border border-black/10 shadow-sm px-4 flex items-center gap-3.5 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="w-9 h-9 rounded-full bg-black/10 shrink-0" />
          <div className="space-y-1 flex-1">
            <div className="h-3.5 w-48 max-w-[75%] bg-black/15 rounded-full" />
            <div className="h-2.5 w-24 bg-black/10 rounded-full" />
          </div>
          <div className="flex gap-1 shrink-0 pr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
          </div>
        </div>

        {/* 4. Compact Pill Card */}
        <div className="w-full h-14 sm:h-16 rounded-full bg-white/80 border border-black/10 shadow-sm px-4 flex items-center gap-3.5 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          <div className="w-9 h-9 rounded-full bg-black/10 shrink-0" />
          <div className="h-3.5 w-32 bg-black/15 rounded-full flex-1" />
          <div className="flex gap-1 shrink-0 pr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <footer className="z-10 mt-10 mb-2 flex items-center justify-center">
        <div className="h-3.5 w-20 bg-black/15 rounded-full animate-pulse" />
      </footer>
    </div>
  );
}
