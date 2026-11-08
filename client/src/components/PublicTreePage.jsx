import { useState, useEffect } from 'react';
import { CardRenderer } from '../cards/CardRenderer.jsx';
import { PRESET_THEMES } from '../constants/themes.js';
import { Share2, Check, ArrowLeft, Users } from 'lucide-react';

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
          The linktree <code className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">/{slug}</code> does not exist or has been unpublished.
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
      className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 transition-colors duration-200"
      style={{
        background: activeTheme.backgroundValue,
        color: activeTheme.textColor,
        fontFamily: activeTheme.fontFamily,
      }}
    >
      {/* Top Bar for Admin Return & Share */}
      <div className="w-full max-w-[640px] flex items-center justify-between py-2 mb-4">
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
      <main className="w-full max-w-[580px] flex flex-col items-center text-center space-y-4 flex-1">
        {/* Profile Avatar */}
        <div className="w-24 h-24 rounded-full bg-[#E5E7EB] text-white flex items-center justify-center shadow-md mb-1 overflow-hidden ring-4 ring-white/10">
          {tree.avatarUrl ? (
            <img src={tree.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Users className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* Title & Bio */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            {tree.title || `@${tree.slug}`}
          </h1>
          {tree.bio && (
            <p className="text-xs sm:text-sm opacity-80 max-w-sm mx-auto leading-relaxed">
              {tree.bio}
            </p>
          )}
        </div>

        {/* Cards Stack */}
        <div className="w-full space-y-3 pt-4">
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

      {/* Footer Branding (Linktree Pro allows removing badge) */}
      <footer className="w-full max-w-[580px] text-center pt-12 pb-4 space-y-2">
        <div className="text-[10px] opacity-40 font-semibold tracking-wider uppercase">
          {tree.name}
        </div>
      </footer>
    </div>
  );
}

