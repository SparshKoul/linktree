import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  LayoutGrid,
  Globe,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Bell,
  Send,
  Share2,
  ChevronRight,
  ShoppingBag,
  Palette,
} from 'lucide-react';
import { storage } from '../services/storage.js';
import { getCanonicalTreeUrl, copyToClipboard } from '../constants/urls.js';

export function CardsDashboard({
  currentUser,
  currentTree,
  trees = [],
  onSelectTree,
  onOpenCreateTree,
  onGoToWorkspace,
  onOpenAddCard,
  onSelectRail,
  onSelectTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Compute card counts per tree
  const treesWithCounts = useMemo(() => {
    return (trees || []).map((t) => {
      const cards = t.cards || storage.getCards(t.id) || [];
      return {
        ...t,
        cardsCount: cards.length,
      };
    });
  }, [trees]);

  const filteredTrees = useMemo(() => {
    if (!searchQuery.trim()) return treesWithCounts;
    const q = searchQuery.toLowerCase();
    return treesWithCounts.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q)
    );
  }, [treesWithCounts, searchQuery]);

  const totalTrees = treesWithCounts.length;
  const totalCardsAcrossTrees = treesWithCounts.reduce(
    (acc, t) => acc + (t.cardsCount || 0),
    0
  );
  const accountId = currentUser?.id || 1;
  const username = currentUser?.username || currentTree?.slug || 'riyast';
  const email = currentUser?.email || 'sparshkoul6@gmail.com';

  const handleCopyUrl = async (slug) => {
    const url = getCanonicalTreeUrl(slug);
    await copyToClipboard(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="flex-1 bg-white lg:bg-[#F9FAFB] overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* 1. MOBILE DASHBOARD VIEW matching uploaded Linktree screenshot */}
      <div className="lg:hidden flex flex-col space-y-4 max-w-md mx-auto pb-24">
        {/* Top Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
              {currentTree?.avatarUrl ? (
                <img src={currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <button className="px-3 py-1 rounded-full border border-gray-300 text-xs font-semibold text-gray-800 bg-white shadow-2xs hover:bg-gray-50 transition-colors">
              Try Pro free
            </button>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <button
              onClick={() => handleCopyUrl(currentTree?.slug || username)}
              className="p-1 hover:text-black cursor-pointer transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5 stroke-[1.8]" />
            </button>
            <button className="p-1 hover:text-black cursor-pointer transition-colors relative" title="Notifications">
              <Bell className="w-5 h-5 stroke-[1.8]" />
            </button>
            <button className="p-1 hover:text-black cursor-pointer transition-colors relative" title="Messages">
              <Send className="w-5 h-5 stroke-[1.8]" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#7033FF] text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
                1
              </span>
            </button>
          </div>
        </div>

        {/* User Handle & Tree Link */}
        <div className="space-y-0.5 pt-1 text-left">
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            {currentTree?.slug || username}
          </h1>
          <div className="text-xs text-gray-500 font-medium">
            indiataps.vercel.app/{currentTree?.slug || username}
          </div>
        </div>

        {/* Quick Action Pills: + Add, Products, Design */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              onGoToWorkspace && onGoToWorkspace(currentTree);
              onOpenAddCard && onOpenAddCard();
            }}
            className="px-4 py-2 rounded-full bg-[#EAEAEA] hover:bg-gray-300 text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>

          <button
            onClick={() => {
              onGoToWorkspace && onGoToWorkspace(currentTree);
              onSelectTab && onSelectTab('shop');
            }}
            className="px-4 py-2 rounded-full bg-[#EAEAEA] hover:bg-gray-300 text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
            <span>Products</span>
          </button>

          <button
            onClick={() => {
              onGoToWorkspace && onGoToWorkspace(currentTree);
              onSelectRail && onSelectRail('design');
            }}
            className="px-4 py-2 rounded-full bg-[#EAEAEA] hover:bg-gray-300 text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer relative shrink-0"
          >
            <Palette className="w-3.5 h-3.5 stroke-[2]" />
            <span>Design</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2.5" />
          </button>
        </div>

        {/* Big Phone Preview Card matching Reference Image */}
        <div className="w-full bg-[#4E5049] rounded-[28px] p-5 text-white space-y-4 shadow-lg relative overflow-hidden">
          {/* Unpublished badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-semibold text-white/95">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Unpublished changes</span>
          </div>

          {/* Center Avatar Graphic */}
          <div className="py-7 flex justify-center">
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/25 flex items-center justify-center overflow-hidden shadow-inner">
              {currentTree?.avatarUrl ? (
                <img src={currentTree.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-white/75" />
              )}
            </div>
          </div>

          {/* Bottom Bar: Tree name, links count, share & Edit buttons */}
          <div className="flex items-end justify-between pt-1">
            <div className="text-left">
              <div className="font-extrabold text-base text-white leading-tight">
                {currentTree?.slug || username}
              </div>
              <div className="text-xs text-white/70 font-medium mt-0.5">
                {(currentTree?.cards || []).length || 5} links
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyUrl(currentTree?.slug || username)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onGoToWorkspace && onGoToWorkspace(currentTree)}
                className="px-4 py-2 rounded-full bg-[#E5E7EB] hover:bg-white text-black text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Section: In the last week */}
        <div className="pt-2 space-y-2 text-left">
          <h2 className="text-base font-extrabold text-[#111111]">
            In the last week
          </h2>

          {/* Analytics Visitors Card */}
          <div className="w-full bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-sm text-[#111111]">
                IndiaTaps visitors
              </div>
              <button className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer">
                <span>Last 7 days</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-gray-500">
              No activity during this time
            </div>

            {/* Visual Progress / Setup Stats & Map graphic */}
            <div className="flex items-center justify-between pt-2">
              {/* Circular progress "33% set up" */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#7033FF]"
                    strokeDasharray="33, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center leading-none">
                  <div className="text-[11px] font-black text-gray-900">33%</div>
                  <div className="text-[7px] text-gray-500 font-bold mt-0.5">set up</div>
                </div>
              </div>

              {/* Globe illustration with location pins matching screenshot */}
              <div className="relative w-24 h-16 flex items-end justify-center opacity-60">
                <svg className="w-20 h-16 text-gray-300" viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="50" cy="50" r="40" />
                  <path d="M10 50h80M20 30h60M30 50c0-20 40-20 40 0" />
                  <g transform="translate(56, 12)">
                    <circle cx="5" cy="5" r="4" fill="#9CA3AF" />
                    <path d="M5 9v5" stroke="#9CA3AF" strokeWidth="2" />
                  </g>
                  <g transform="translate(38, 28)">
                    <circle cx="4" cy="4" r="3" fill="#9CA3AF" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP VIEW (hidden on mobile, untouched for desktop managers) */}
      <div className="hidden lg:block max-w-5xl mx-auto space-y-6">
        {/* Top Header Section: Account ID & Trees Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Account Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                ID #{accountId}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Account details and overview of all digital cards owned by{' '}
              <span className="font-bold text-black">{email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onGoToWorkspace && onGoToWorkspace(currentTree)}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Open Workspace</span>
            </button>
            <button
              onClick={onOpenCreateTree}
              className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Card</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid: How many trees this ID has */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Account ID</span>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 mt-2">#{accountId}</div>
            <div className="text-[11px] text-gray-400 mt-0.5 truncate">{email}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white to-purple-50/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">Total Digital Cards</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-950 mt-2">{totalTrees}</div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Created under this account
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Total Links/Cards</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 mt-2">{totalCardsAcrossTrees}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Across all {totalTrees} trees</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Active Tree</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-black text-gray-900 truncate mt-2">
              @{currentTree?.slug || 'none'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Currently editing</div>
          </div>
        </div>

        {/* Trees List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Trees Registered Under ID #{accountId}
              </h2>
              <p className="text-xs text-gray-500">
                This account has {totalTrees} {totalTrees === 1 ? 'tree' : 'trees'} in total.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trees..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            </div>
          </div>

          {filteredTrees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
              <Layers className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-xs font-bold text-gray-700">No trees found</div>
              <p className="text-xs text-gray-400">
                {searchQuery
                  ? `No trees matching "${searchQuery}"`
                  : `User ID #${accountId} does not have any trees yet.`}
              </p>
              <button
                onClick={onOpenCreateTree}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Tree</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrees.map((tree) => {
                const isSelected = tree.id === currentTree?.id;
                return (
                  <div
                    key={tree.id}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-100 shadow-xs'
                        : 'border-gray-200/90'
                    }`}
                  >
                    <div>
                      {/* Top status & Active pill */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-2xs">
                            Active in Workspace
                          </span>
                        )}
                      </div>

                      {/* Tree Name & Slug */}
                      <h3 className="font-extrabold text-sm text-gray-900 truncate">
                        {tree.name || tree.title || tree.slug}
                      </h3>
                      <div className="text-xs text-purple-700 font-mono font-semibold truncate mt-0.5">
                        indiataps.vercel.app/{tree.slug}
                      </div>

                      {/* Info badges */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-600">
                        <span className="font-bold text-black bg-gray-100 px-2 py-0.5 rounded-md">
                          {tree.cardsCount} {tree.cardsCount === 1 ? 'card' : 'cards'}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500 capitalize">{tree.themeId || 'classic-light'}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onGoToWorkspace && onGoToWorkspace(tree)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white hover:bg-neutral-800'
                            : 'bg-gray-100 hover:bg-black hover:text-white text-gray-800'
                        }`}
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleCopyUrl(tree.slug)}
                        className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-black transition-colors cursor-pointer"
                        title="Copy tree link"
                      >
                        {copiedSlug === tree.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={getCanonicalTreeUrl(tree.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-black transition-colors cursor-pointer"
                        title="Visit live tree"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
