import { useState, useRef, useEffect } from 'react';
import { Image, Trash2, Check, RotateCcw, RotateCw, Upload } from 'lucide-react';
import { uploadPicture } from '../lib/uploadPicture.js';

const FONTS = [
  'Inter',
  'Poppins',
  'DM Sans',
  'Playfair Display',
  'Space Grotesk',
  'Syne',
  'Caveat',
  'Courier New',
];

export function HeaderEditor({ currentTree, onUpdateTree }) {
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Snapshot initial tree values for Cancel & Undo
  const initialSnapshot = useRef({
    headerLayout: currentTree?.headerLayout || currentTree?.customTheme?.headerLayout || 'classic',
    avatarUrl: currentTree?.avatarUrl || null,
    bannerUrl: currentTree?.bannerUrl || currentTree?.customTheme?.bannerUrl || null,
    heroUrl: currentTree?.heroUrl || currentTree?.customTheme?.heroUrl || null,
    title: currentTree?.title ?? `@${currentTree?.slug || 'riyast'}`,
    bio: currentTree?.bio ?? '',
    titleStyle: currentTree?.titleStyle || currentTree?.customTheme?.titleStyle || 'text',
    logoUrl: currentTree?.logoUrl || currentTree?.customTheme?.logoUrl || null,
    altFontEnabled: currentTree?.altFontEnabled || currentTree?.customTheme?.altFontEnabled || false,
    titleFont: currentTree?.titleFont || currentTree?.customTheme?.titleFont || 'Inter',
    titleColor: currentTree?.titleColor || currentTree?.customTheme?.titleColor || '#000000',
    seo: currentTree?.seo || currentTree?.customTheme?.seo || { title: '', description: '', faviconUrl: '' },
  });

  const [history, setHistory] = useState([initialSnapshot.current]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedToast, setSavedToast] = useState(false);

  const current = history[historyIndex] || initialSnapshot.current;

  // Sync state if tree changes externally
  useEffect(() => {
    if (currentTree) {
      const snap = {
        headerLayout: currentTree?.headerLayout || currentTree?.customTheme?.headerLayout || 'classic',
        avatarUrl: currentTree?.avatarUrl || null,
        bannerUrl: currentTree?.bannerUrl || currentTree?.customTheme?.bannerUrl || null,
        heroUrl: currentTree?.heroUrl || currentTree?.customTheme?.heroUrl || null,
        title: currentTree?.title ?? `@${currentTree?.slug || 'riyast'}`,
        bio: currentTree?.bio ?? '',
        titleStyle: currentTree?.titleStyle || currentTree?.customTheme?.titleStyle || 'text',
        logoUrl: currentTree?.logoUrl || currentTree?.customTheme?.logoUrl || null,
        altFontEnabled: currentTree?.altFontEnabled || currentTree?.customTheme?.altFontEnabled || false,
        titleFont: currentTree?.titleFont || currentTree?.customTheme?.titleFont || 'Inter',
        titleColor: currentTree?.titleColor || currentTree?.customTheme?.titleColor || '#000000',
        seo: currentTree?.seo || currentTree?.customTheme?.seo || { title: '', description: '', faviconUrl: '' },
      };
      initialSnapshot.current = snap;
    }
  }, [currentTree?.id]);

  const commitChange = (patch) => {
    const updated = { ...current, ...patch };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Apply live to tree state
    onUpdateTree({
      ...patch,
      customTheme: {
        ...(currentTree?.customTheme || {}),
        ...patch,
      },
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      const target = history[nextIdx];
      onUpdateTree({
        ...target,
        customTheme: { ...(currentTree?.customTheme || {}), ...target },
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const target = history[nextIdx];
      onUpdateTree({
        ...target,
        customTheme: { ...(currentTree?.customTheme || {}), ...target },
      });
    }
  };

  const handleCancel = () => {
    const snap = initialSnapshot.current;
    setHistory([snap]);
    setHistoryIndex(0);
    onUpdateTree({
      ...snap,
      customTheme: { ...(currentTree?.customTheme || {}), ...snap },
    });
  };

  const handleSave = () => {
    onUpdateTree({
      ...current,
      customTheme: { ...(currentTree?.customTheme || {}), ...current },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleUploadFile = (e, fieldKey, folderName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // The picture goes to the storage first, made smaller. Only the address
    // of it goes into the tree.
    uploadPicture(file, { folder: folderName, maxWidth: 1600, maxHeight: 1600 })
      .then((url) => {
        if (url) commitChange({ [fieldKey]: url });
      })
      .catch(() => {});
  };

  // The icon of the page. It is shown in the browser tab, in a bookmark and
  // in the preview when the link is shared.
  const handleFaviconSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') return;

      // A favicon is shown at 16 or 32 pixels, so it is made small here.
      const image = new Image();
      image.onload = () => {
        try {
          const size = 64;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, size, size);
          const small = canvas.toDataURL('image/png');

          commitChange({
            seo: { ...(current.seo || {}), faviconUrl: small },
          });

          fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ file: small, filename: file.name, folder: 'favicons' }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.url) {
                commitChange({
                  seo: { ...(current.seo || {}), faviconUrl: data.url },
                });
              }
            })
            .catch(() => {});
        } catch {
          // The browser could not make the picture smaller: keep the original.
          commitChange({
            seo: { ...(current.seo || {}), faviconUrl: rawDataUrl },
          });
        }
      };
      image.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Demo girl image matching Reference Image 0 & 1 for faithful reproduction
  const demoGirlImg = current.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row with Undo, Redo, Cancel, Save matching Reference Images */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#111111]">
          Header
        </h1>

        <div className="flex items-center gap-2">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={handleCancel}
            className="py-1.5 px-4 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-all cursor-pointer shadow-2xs bg-white"
          >
            Cancel
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            className="py-1.5 px-5 rounded-full bg-[#7033FF] hover:bg-[#6025e6] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            {savedToast ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Rows with Strict Label Width Alignment matching Reference Images */}
      <div className="space-y-6 text-xs text-gray-900">
        {/* ROW 1: Layout - NO SCROLL SLIDER, compact layout fitting cleanly */}
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0 pt-2">
            <label className="font-bold text-gray-900 text-[13px]">Layout</label>
          </div>

          {/* 5 Layout Cards fitting completely without horizontal scroll slider */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
            {/* 1. Classic */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'classic' })}
              className={`w-[78px] sm:w-[84px] h-[100px] sm:h-[106px] rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between p-1.5 sm:p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'classic'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex items-center justify-center">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-rose-500 shadow-2xs">
                  <img src={demoGirlImg} alt="Classic" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-semibold text-[10px] sm:text-[11px] text-gray-900">Classic</span>
            </button>

            {/* 2. Hero */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'hero' })}
              className={`w-[78px] sm:w-[84px] h-[100px] sm:h-[106px] rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between p-1.5 sm:p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'hero'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-[12px] relative">
                <div className="w-full h-full rounded-[12px] overflow-hidden bg-gradient-to-t from-white via-transparent to-transparent relative">
                  <img src={demoGirlImg} alt="Hero" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                </div>
              </div>
              <span className="font-semibold text-[10px] sm:text-[11px] text-gray-900">Hero</span>
            </button>

            {/* 3. Banner */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'banner' })}
              className={`w-[78px] sm:w-[84px] h-[100px] sm:h-[106px] rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between p-1.5 sm:p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'banner'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                {/* Top pink banner */}
                <div className="w-full h-6 rounded-t-lg bg-gradient-to-r from-pink-200 via-rose-200 to-pink-300 overflow-hidden">
                  <div className="w-full h-full opacity-60 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:6px_6px]" />
                </div>
                {/* Overlapping circle */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-500 -mt-3.5 ring-2 ring-white shadow-2xs">
                  <img src={demoGirlImg} alt="Banner" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-semibold text-[10px] sm:text-[11px] text-gray-900">Banner</span>
            </button>

            {/* 4. Cutout */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'cutout' })}
              className={`w-[78px] sm:w-[84px] h-[100px] sm:h-[106px] rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between p-1.5 sm:p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'cutout'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                <div className="w-9 h-11 rounded-t-full overflow-hidden filter drop-shadow-xs">
                  <img src={demoGirlImg} alt="Cutout" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-semibold text-[10px] sm:text-[11px] text-gray-900">Cutout</span>
            </button>

            {/* 5. Shape */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'shape' })}
              className={`w-[78px] sm:w-[84px] h-[100px] sm:h-[106px] rounded-[18px] sm:rounded-[20px] flex flex-col items-center justify-between p-1.5 sm:p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'shape'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex items-center justify-center">
                <div
                  className="w-12 h-9 relative flex items-center justify-center overflow-hidden shadow-2xs"
                  style={{ clipPath: 'url(#linktree-organic-shape)' }}
                >
                  <div className="absolute inset-0 bg-rose-600" />
                  <img src={demoGirlImg} alt="Shape" className="w-full h-full object-cover relative z-10" />
                </div>
              </div>
              <span className="font-semibold text-[10px] sm:text-[11px] text-gray-900">Shape</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Profile Image - reduced to exact original Linktree size */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0">
            <label className="font-bold text-gray-900 text-[13px]">Profile image</label>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadFile(e, 'avatarUrl', 'avatars')}
            />

            {/* Sleek squircle container matching original Linktree */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-12 h-12 rounded-[16px] bg-[#9CA3AF]/60 relative flex items-center justify-center cursor-pointer overflow-hidden group hover:opacity-95 transition-all shadow-inner shrink-0"
              title="Upload profile image"
            >
              {current.avatarUrl ? (
                <img src={current.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}

              {/* Circular plus button badge on bottom right */}
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow-xs flex items-center justify-center text-gray-800 font-bold text-[10px] border border-gray-100">
                +
              </div>
            </div>

            {/* Actions if photo is uploaded */}
            {current.avatarUrl && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="block text-xs font-bold text-gray-800 hover:text-black cursor-pointer"
                >
                  Change image
                </button>
                <button
                  type="button"
                  onClick={() => commitChange({ avatarUrl: null })}
                  className="block text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Optional Banner Upload if Banner layout is active */}
        {current.headerLayout === 'banner' && (
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100 animate-in fade-in">
            <div className="w-28 sm:w-36 shrink-0">
              <label className="font-bold text-gray-900 text-[13px]">Banner cover</label>
            </div>
            <div className="space-y-2 max-w-sm w-full">
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadFile(e, 'bannerUrl', 'banners')}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="py-1.5 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
              >
                {current.bannerUrl ? 'Change banner image' : 'Upload banner image'}
              </button>
              {current.bannerUrl && (
                <div className="w-full h-20 rounded-xl overflow-hidden border border-gray-200 relative">
                  <img src={current.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => commitChange({ bannerUrl: null })}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Hero Upload if Hero layout is active */}
        {current.headerLayout === 'hero' && (
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100 animate-in fade-in">
            <div className="w-28 sm:w-36 shrink-0">
              <label className="font-bold text-gray-900 text-[13px]">Hero cover</label>
            </div>
            <div className="space-y-2 max-w-sm w-full">
              <input
                type="file"
                ref={heroInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadFile(e, 'heroUrl', 'heroes')}
              />
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                className="py-1.5 px-4 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
              >
                {current.heroUrl ? 'Change hero image' : 'Upload hero image'}
              </button>
              {current.heroUrl && (
                <div className="w-full h-24 rounded-xl overflow-hidden border border-gray-200 relative">
                  <img src={current.heroUrl} alt="Hero" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => commitChange({ heroUrl: null })}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROW 3: Title */}
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0 pt-2.5">
            <label className="font-bold text-gray-900 text-[13px]">Title</label>
          </div>

          <div className="max-w-[340px] w-full">
            <input
              type="text"
              maxLength={30}
              value={current.title}
              onChange={(e) => commitChange({ title: e.target.value })}
              placeholder="@yourname"
              className="w-full px-4 py-2.5 rounded-[18px] bg-white border border-gray-200/90 focus:border-black focus:outline-none text-xs font-semibold text-black transition-all"
            />
            <div className="text-[11px] font-mono text-gray-400 text-right pt-1">
              {current.title.length}/30
            </div>
          </div>
        </div>

        {/* ROW 4: Bio */}
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0 pt-2.5">
            <label className="font-bold text-gray-900 text-[13px]">Bio</label>
          </div>

          <div className="max-w-[340px] w-full">
            <div>
              <textarea
                maxLength={160}
                rows={3}
                value={current.bio}
                onChange={(e) => commitChange({ bio: e.target.value })}
                placeholder="Add a short bio"
                className="w-full px-4 py-3 rounded-[20px] bg-white border border-black focus:outline-none text-xs font-medium text-black resize-none min-h-[96px] transition-all"
              />
              <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-gray-400 pt-1">
                <span>{current.bio.length}/160</span>
                <span className="text-gray-300 select-none">//</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Title style */}
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0 pt-2">
            <label className="font-bold text-gray-900 text-[13px]">Title style</label>
          </div>

          <div className="space-y-3 max-w-[340px] w-full">
            <div className="flex items-center gap-3">
              {/* Aa Text */}
              <button
                type="button"
                onClick={() => commitChange({ titleStyle: 'text' })}
                className={`w-28 py-2.5 rounded-[18px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  current.titleStyle === 'text'
                    ? 'border-2 border-black bg-white shadow-2xs'
                    : 'border border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-base font-serif font-black text-gray-900 leading-none">Aa</span>
                <span className="text-xs font-bold text-gray-900">Text</span>
              </button>

              {/* Logo (NO THUNDER ICON) */}
              <button
                type="button"
                onClick={() => commitChange({ titleStyle: 'logo' })}
                className={`w-28 py-2.5 rounded-[18px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                  current.titleStyle === 'logo'
                    ? 'border-2 border-black bg-white shadow-2xs'
                    : 'border border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <Image className="w-4 h-4 text-gray-800" />
                <span className="text-xs font-bold text-gray-900">Logo</span>
              </button>
            </div>

            {/* Brand Logo Image Uploader if Logo style selected */}
            {current.titleStyle === 'logo' && (
              <div className="p-3 rounded-2xl bg-[#F6F6F7] border border-gray-200/80 space-y-2 animate-in fade-in">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadFile(e, 'logoUrl', 'logos')}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Upload logo image</span>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="py-1 px-3 rounded-full bg-black text-white text-[11px] font-bold cursor-pointer"
                  >
                    {current.logoUrl ? 'Change' : 'Pick logo'}
                  </button>
                </div>
                {current.logoUrl && (
                  <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between">
                    <img src={current.logoUrl} alt="Logo" className="max-h-7 max-w-[140px] object-contain" />
                    <button
                      type="button"
                      onClick={() => commitChange({ logoUrl: null })}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 6: Alternative title font */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pb-6 border-b border-gray-100">
          <div className="w-28 sm:w-36 shrink-0">
            <label className="font-bold text-gray-900 block text-[13px]">Alternative title font</label>
            <span className="text-[11px] text-gray-400 block pt-0.5 leading-tight">Matches page font by default</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => commitChange({ altFontEnabled: !current.altFontEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                current.altFontEnabled ? 'bg-[#7033FF]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  current.altFontEnabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>

            {/* Font selector if enabled */}
            {current.altFontEnabled && (
              <select
                value={current.titleFont}
                onChange={(e) => commitChange({ titleFont: e.target.value })}
                className="py-1 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-black focus:outline-none"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ROW 7: Title color */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pb-2">
          <div className="w-28 sm:w-36 shrink-0">
            <label className="font-bold text-gray-900 text-[13px]">Title color</label>
          </div>

          <div className="flex items-center gap-2">
            {/* Color swatch pill button matching Reference Images */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-[16px] bg-[#F6F6F7] border border-gray-200/90 hover:border-gray-300 cursor-pointer shadow-2xs transition-all">
              <input
                type="color"
                value={current.titleColor}
                onChange={(e) => commitChange({ titleColor: e.target.value })}
                className="w-5 h-5 rounded-[6px] border-0 cursor-pointer p-0 bg-transparent"
              />
              <span className="font-mono text-xs font-bold text-gray-900 uppercase">
                {current.titleColor}
              </span>
            </label>
          </div>
        </div>

        {/* ROW 8: What people see when the link is shared */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-3 mt-1 border-t border-gray-100">
          <div className="w-28 sm:w-36 shrink-0">
            <label className="font-bold text-gray-900 text-[13px]">When shared</label>
            <p className="text-[10px] text-gray-400 mt-0.5">
              The title, the description and the small picture people see when the link is shared.
            </p>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500">Title</label>
              <input
                type="text"
                value={current.seo?.title || ''}
                onChange={(e) => commitChange({ seo: { ...(current.seo || {}), title: e.target.value } })}
                placeholder="Riyast Boutique · Menu, locations and contact"
                maxLength={70}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#7033FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500">Description</label>
              <textarea
                value={current.seo?.description || ''}
                onChange={(e) => commitChange({ seo: { ...(current.seo || {}), description: e.target.value } })}
                placeholder="A short line about what is on this page"
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#111111] focus:outline-none focus:border-[#7033FF] resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-500">Small picture (icon)</label>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {current.seo?.faviconUrl ? (
                    <img src={current.seo.faviconUrl} alt="The icon of this page" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-gray-300 font-bold">none</span>
                  )}
                </div>
                <label className="px-3 py-2 rounded-full bg-[#F6F6F7] border border-gray-200/90 hover:border-gray-300 cursor-pointer text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  {current.seo?.faviconUrl ? 'Change' : 'Choose a picture'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFaviconSelect} />
                </label>
                {current.seo?.faviconUrl && (
                  <button
                    type="button"
                    onClick={() => commitChange({ seo: { ...(current.seo || {}), faviconUrl: '' } })}
                    className="px-3 py-2 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
