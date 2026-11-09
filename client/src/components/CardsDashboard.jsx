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
} from 'lucide-react';
import { storage } from '../services/storage.js';

export function CardsDashboard({
  currentUser,
  currentTree,
  trees = [],
  onSelectTree,
  onOpenCreateTree,
  onGoToWorkspace,
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

  const handleCopyUrl = (slug) => {
    const url = `https://indiataps.com/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }).catch(() => {});
  };

  return (
    <div className="flex-1 bg-[#F9FAFB] overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
              Account details and overview of all trees owned by{' '}
              <span className="font-bold text-black">@{username}</span> ({email})
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
              <span>Create New Tree</span>
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
            <div className="text-[11px] text-gray-400 mt-0.5">@{username}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white to-purple-50/40 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">Total Trees</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-950 mt-2">{totalTrees}</div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Configured on this ID
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
                        indiataps.com/{tree.slug}
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
                        href={`https://indiataps.com/${tree.slug}`}
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
