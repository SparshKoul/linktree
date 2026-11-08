import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

export function TreeSwitcher({
  trees = [],
  currentTree,
  onSelectTree,
  onOpenCreateModal,
  onDeleteTree,
  initialOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [search, setSearch] = useState('');

  const filteredTrees = trees.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Trigger Button: Pill matching Image 0 & 1 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-[#111111] shadow-2xs transition-all cursor-pointer"
      >
        <div className="w-5 h-5 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden shrink-0">
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <span className="font-bold text-xs truncate max-w-[120px]">
          {currentTree?.slug || 'riyast'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {/* Popover Dropdown matching Image 0 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[300px] bg-white rounded-[28px] shadow-2xl border border-gray-100 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#F6F6F7] text-xs mb-2.5">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-xs focus:outline-none placeholder:text-gray-400 font-medium text-black"
              />
            </div>

            {/* Tree Accounts List */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredTrees.map((tree) => {
                const isSelected = currentTree?.id === tree.id || (!currentTree && tree.slug === 'riyast');
                const slugDisplay = tree.slug === 'helolo' ? 'helolo' : `@${tree.slug}`;

                return (
                  <button
                    key={tree.id}
                    onClick={() => {
                      onSelectTree(tree);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-2xl transition-colors text-left cursor-pointer ${
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-8 h-8 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden shrink-0 ${
                          isSelected ? 'ring-2 ring-black/80' : ''
                        }`}
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-[#111111] leading-tight truncate">
                          {slugDisplay}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono leading-tight truncate">
                          linktr.ee/{tree.slug}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full bg-white">
                        Free
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTree?.(tree);
                          setIsOpen(false);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title={`Delete @${tree.slug}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tree Actions: New Linktree & Delete Current Linktree */}
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-xs font-bold text-[#111111] transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                </div>
                <span>New Linktree</span>
              </button>

              {currentTree && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onDeleteTree?.(currentTree);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full border border-red-200 flex items-center justify-center shrink-0 bg-red-50">
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="truncate">Delete @{currentTree.slug}</span>
                </button>
              )}
            </div>

            {/* Workspaces Notice Box from Image 0 */}
            <div className="border-t border-gray-100 mt-2 pt-2.5">
              <div className="p-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-100 flex items-center justify-between gap-2.5 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-2xs">
                    <span className="text-sm">🗂️</span>
                    <span className="absolute -top-1.5 -left-1.5 bg-[#00E575] text-black font-extrabold text-[8px] px-1 rounded-sm leading-tight uppercase">
                      NEW
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600 leading-tight">
                    <strong className="text-black font-bold block text-[11px]">A faster way to switch!</strong>
                    Try Workspaces, our new way to manage multiple Linktrees.
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
