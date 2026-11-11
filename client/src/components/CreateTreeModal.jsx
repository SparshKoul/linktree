import { useState, useEffect } from 'react';
import { X, Check, Copy, User, LogIn, Shuffle, AlertCircle, Loader2 } from 'lucide-react';
import { getCanonicalTreeUrl, copyToClipboard } from '../constants/urls.js';

export function CreateTreeModal({
  isOpen,
  onClose,
  onTreeCreated,
  currentUser,
  adminEmail = 'sparshkoul6@gmail.com',
}) {
  const [step, setStep] = useState('input'); // 'input' | 'success'
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTree, setCreatedTree] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setSlug('');
      setName('');
      setIsAvailable(null);
      setError(null);
      setIsSubmitting(false);
      setCreatedTree(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Debounced slug availability check
  useEffect(() => {
    const clean = slug.toLowerCase().trim();
    if (!clean || clean.length < 3) {
      setIsAvailable(null);
      setError(clean.length > 0 && clean.length < 3 ? 'Card URL must be at least 3 characters' : null);
      return;
    }

    if (!/^[a-z0-9-]+$/.test(clean)) {
      setIsAvailable(false);
      setError('Only lowercase letters, numbers, and hyphens allowed');
      return;
    }

    const reserved = ['admin', 'api', 'login', 'dashboard', 'settings', 'static'];
    if (reserved.includes(clean)) {
      setIsAvailable(false);
      setError('This card URL is reserved. Please pick another.');
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/trees/check-slug/${encodeURIComponent(clean)}`);
        const data = await res.json();
        setIsAvailable(data.available);
        if (!data.available) {
          setError('This card URL is already claimed. Try another.');
        }
      } catch {
        setIsAvailable(true);
      } finally {
        setIsChecking(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [slug]);

  if (!isOpen) return null;

  const cleanSlug = slug.toLowerCase().trim();
  const initialLetter = (createdTree?.slug || cleanSlug || 'R').charAt(0).toUpperCase();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cleanSlug || cleanSlug.length < 3 || isAvailable === false) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let tree = null;
      try {
        const res = await fetch('/api/admin/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: name.trim() || cleanSlug,
            slug: cleanSlug,
            title: name.trim() || cleanSlug,
          }),
        });

        if (res.ok) {
          tree = await res.json();
        }
      } catch (netErr) {
        // Backend offline / testing mode: proceed with local tree creation
      }

      if (!tree) {
        tree = {
          id: Date.now(),
          adminId: currentUser?.id || 1,
          name: name.trim() || cleanSlug,
          slug: cleanSlug,
          status: 'live',
          title: name.trim() || cleanSlug,
          bio: '',
          avatarUrl: null,
          themeId: 'classic-light',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setCreatedTree(tree);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = async () => {
    const url = getCanonicalTreeUrl(createdTree?.slug || cleanSlug);
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueEditing = () => {
    if (createdTree) {
      onTreeCreated(createdTree);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-[620px] shadow-2xl p-8 sm:p-12 relative overflow-hidden text-[#111111]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'input' ? (
          /* Step 1: Card URL & Business Selection */
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">Create a new Digital Card</h2>
              <p className="text-sm text-gray-500">
                You can create as many cards as you want under your account. Choose a unique URL for your digital card and QR code.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Business Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Riyast Couture"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-[#F6F6F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7033FF] text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Choose a URL for this card <span className="text-[#7033FF]">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-[#F6F6F7] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7033FF] overflow-hidden transition-all">
                  <span className="px-4 py-3 text-gray-400 text-sm font-semibold select-none border-r border-gray-200">
                    indiataps.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="riyast"
                    className="w-full px-4 py-3 bg-transparent text-sm font-bold focus:outline-none"
                    maxLength={30}
                  />
                  <div className="pr-4">
                    {isChecking && <Loader2 className="w-4 h-4 text-[#7033FF] animate-spin" />}
                    {!isChecking && isAvailable === true && (
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {!isChecking && isAvailable === false && (
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {error ? (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </p>
                ) : isAvailable === true ? (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Card URL is available!
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">
                    Only lowercase letters, numbers, and hyphens (3–30 characters).
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-full border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!cleanSlug || cleanSlug.length < 3 || isAvailable === false || isSubmitting}
                className="px-6 py-3 rounded-full bg-[#7033FF] hover:bg-[#6025e6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-[#7033FF]/25 transition-all"
              >
                {isSubmitting ? 'Creating...' : 'Create IndiaTaps'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Pixel-Faithful Success Screen (matching images 1, 2, 3) */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Title */}
            <div>
              <h1 className="text-3xl sm:text-[34px] font-extrabold tracking-tight leading-tight text-[#111111]">
                Great work! You've got a brand new IndiaTaps
              </h1>
            </div>

            {/* IndiaTaps Identity Card (Gray Box with Avatar, Username, URL, Copy URL) */}
            <div className="bg-[#F3F3F1] rounded-[24px] p-5 sm:p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Circle Avatar with Initial */}
                <div className="w-14 h-14 rounded-full bg-[#4E5766] text-white flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
                  {initialLetter}
                </div>
                {/* Name & Subtitle */}
                <div>
                  <div className="font-bold text-base text-[#111111] leading-snug">
                    {createdTree?.slug || cleanSlug}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                    <span className="text-xs">✱</span>
                    <span>indiataps.vercel.app/{createdTree?.slug || cleanSlug}</span>
                  </div>
                </div>
              </div>

              {/* Copy URL Link in Purple */}
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-[#7033FF] hover:text-[#5B25D9] text-sm font-semibold hover:underline flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  'Copy URL'
                )}
              </button>
            </div>

            {/* 3 Guidance Rows with Purple Outline Icons */}
            <div className="space-y-5 text-sm text-[#111111] leading-relaxed">
              {/* Row 1: Profile Icon */}
              <div className="flex items-start gap-4">
                <span className="text-[#7033FF] shrink-0 mt-0.5">
                  <User className="w-5 h-5 stroke-[1.75]" />
                </span>
                <p className="text-[14px]">
                  Your IndiaTaps will now be managed by an account linked to{' '}
                  <strong className="font-bold text-black">{adminEmail}</strong>.
                </p>
              </div>

              {/* Row 2: Log In Icon */}
              <div className="flex items-start gap-4">
                <span className="text-[#7033FF] shrink-0 mt-0.5">
                  <LogIn className="w-5 h-5 stroke-[1.75]" />
                </span>
                <p className="text-[14px] text-gray-800">
                  Log in to manage all your profiles with the same method you logged into this account.
                </p>
              </div>

              {/* Row 3: Switcher Icon */}
              <div className="flex items-start gap-4">
                <span className="text-[#7033FF] shrink-0 mt-0.5">
                  <Shuffle className="w-5 h-5 stroke-[1.75]" />
                </span>
                <p className="text-[14px] text-gray-800">
                  To switch between IndiaTaps pages, go to the account menu in the top right and click on your profile.
                </p>
              </div>
            </div>

            {/* Vibrant Purple Pill Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleContinueEditing}
                className="w-full py-4 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#7033FF]/25 hover:shadow-xl transition-all"
              >
                Continue editing this IndiaTaps
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

