import { useState } from 'react';
import { X, Trash2, Sparkles, Lock, DollarSign, Calendar, ExternalLink } from 'lucide-react';

export function CardEditorModal({ card, isOpen, onClose, onSave, onDelete }) {
  if (!isOpen || !card) return null;

  const [title, setTitle] = useState(card.title || '');
  const [url, setUrl] = useState(card.url || '');
  const [animation, setAnimation] = useState(card.animation || 'none');
  const [lockType, setLockType] = useState(card.lockType || 'none');
  const [price, setPrice] = useState(card.settings?.price || '$49.00');
  const [eventDate, setEventDate] = useState(card.settings?.date || 'DEC 20');
  const [venue, setVenue] = useState(card.settings?.venue || 'Showcase Stage');
  const [content, setContent] = useState(card.settings?.content || '');

  const handleSave = () => {
    const updatedSettings = {
      ...(card.settings || {}),
      ...(card.type === 'product' ? { price } : {}),
      ...(card.type === 'events' ? { date: eventDate, venue } : {}),
      ...(card.type === 'collapsible' || card.type === 'text' || card.type === 'custom_html' ? { content } : {}),
    };

    onSave(card.id, {
      title,
      url,
      animation,
      lockType,
      settings: updatedSettings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 text-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7033FF] bg-purple-50 px-2 py-0.5 rounded-full">
              {card.type}
            </span>
            <h3 className="font-extrabold text-lg mt-1">Edit Card Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-0.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-[#F6F6F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7033FF] text-sm font-semibold"
            />
          </div>

          {/* URL (for links, products, bookings, events, etc.) */}
          {card.type !== 'header' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Destination URL
              </label>
              <div className="flex items-center rounded-2xl border border-gray-200 bg-[#F6F6F7] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7033FF] overflow-hidden">
                <span className="px-3 text-gray-400">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full py-2.5 pr-4 bg-transparent text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Product Specific: Price */}
          {card.type === 'product' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Price Tag
              </label>
              <div className="flex items-center rounded-2xl border border-gray-200 bg-[#F6F6F7] px-3 py-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$49.00"
                  className="w-full bg-transparent text-sm font-bold focus:outline-none ml-1"
                />
              </div>
            </div>
          )}

          {/* Events Specific: Date & Venue */}
          {card.type === 'events' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Event Date
                </label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="DEC 20"
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 bg-[#F6F6F7] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Grand Arena"
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 bg-[#F6F6F7] text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* Collapsible / Rich Text content */}
          {(card.type === 'collapsible' || card.type === 'text' || card.type === 'custom_html') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Content or HTML Code
              </label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter details, description, or embed code..."
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-[#F6F6F7] text-xs focus:outline-none"
              />
            </div>
          )}

          {/* Priority Animation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7033FF]" />
              Priority Animation
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {['none', 'pulse', 'shake', 'wobble'].map((anim) => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => setAnimation(anim)}
                  className={`py-2 rounded-xl border capitalize transition-all ${
                    animation === anim
                      ? 'border-[#7033FF] bg-purple-50 text-[#7033FF]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>

          {/* Link Lock Gate */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#7033FF]" />
              Access Lock Gate
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {[
                { id: 'none', label: 'None' },
                { id: 'age', label: '18+ Gate' },
                { id: 'email', label: 'Email Gate' },
                { id: 'code', label: 'Passcode' },
              ].map((lock) => (
                <button
                  key={lock.id}
                  type="button"
                  onClick={() => setLockType(lock.id)}
                  className={`py-2 rounded-xl border transition-all ${
                    lockType === lock.id
                      ? 'border-[#7033FF] bg-purple-50 text-[#7033FF]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lock.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(card.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Card
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-gray-200 text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold shadow-md shadow-[#7033FF]/25"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

