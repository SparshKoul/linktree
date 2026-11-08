import { useState, useRef, useEffect } from 'react';
import { Image, Upload, Trash2, Check, RotateCcw, RotateCw } from 'lucide-react';

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl === 'string') {
        commitChange({ [fieldKey]: rawDataUrl });

        // Background CDN upload
        fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: rawDataUrl, filename: file.name, folder: folderName }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.url) {
              commitChange({ [fieldKey]: data.url });
            }
          })
          .catch(() => {});
      }
    };
    reader.readAsDataURL(file);
  };

  // Demo girl image matching Reference Image 0 & 1 for faithful reproduction
  const demoGirlImg = current.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Row with Undo, Redo, Cancel, Save matching Image 2 */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
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
            className="py-1.5 px-3.5 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-all cursor-pointer shadow-2xs"
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

      {/* Main 2-Column Section matching Image 2 */}
      <div className="space-y-5 text-xs text-gray-900">
        {/* ROW 1: Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <label className="font-bold text-gray-900 pt-2 text-xs">Layout</label>

          {/* 5 Layout Cards matching Reference Images 0, 1 & 2 */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full">
            {/* 1. Classic */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'classic' })}
              className={`w-[88px] sm:w-[94px] h-[116px] rounded-[22px] flex flex-col items-center justify-between p-2 shrink-0 cursor-pointer transition-all ${
                current.headerLayout === 'classic'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-full flex-1 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-rose-500 shadow-2xs">
                  <img src={demoGirlImg} alt="Classic" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-xs text-gray-900">Classic</span>
            </button>

            {/* 2. Hero (⚡ Pro) */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'hero' })}
              className={`w-[88px] sm:w-[94px] h-[116px] rounded-[22px] flex flex-col items-center justify-between p-2 shrink-0 cursor-pointer transition-all relative ${
                current.headerLayout === 'hero'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs text-[#00E575] flex items-center justify-center text-[9px] z-10">
                ⚡
              </span>
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl relative">
                <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-t from-white via-transparent to-transparent relative">
                  <img src={demoGirlImg} alt="Hero" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                </div>
              </div>
              <span className="font-bold text-xs text-gray-900">Hero</span>
            </button>

            {/* 3. Banner (⚡ Pro) */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'banner' })}
              className={`w-[88px] sm:w-[94px] h-[116px] rounded-[22px] flex flex-col items-center justify-between p-2 shrink-0 cursor-pointer transition-all relative ${
                current.headerLayout === 'banner'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs text-[#00E575] flex items-center justify-center text-[9px] z-10">
                ⚡
              </span>
              <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                {/* Top pink banner */}
                <div className="w-full h-7 rounded-t-lg bg-gradient-to-r from-pink-200 via-rose-200 to-pink-300 overflow-hidden">
                  <div className="w-full h-full opacity-60 bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:6px_6px]" />
                </div>
                {/* Overlapping circle */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-rose-500 -mt-4 ring-2 ring-white shadow-2xs">
                  <img src={demoGirlImg} alt="Banner" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-xs text-gray-900">Banner</span>
            </button>

            {/* 4. Cutout (⚡ Pro) */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'cutout' })}
              className={`w-[88px] sm:w-[94px] h-[116px] rounded-[22px] flex flex-col items-center justify-between p-2 shrink-0 cursor-pointer transition-all relative ${
                current.headerLayout === 'cutout'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs text-[#00E575] flex items-center justify-center text-[9px] z-10">
                ⚡
              </span>
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                <div className="w-10 h-13 rounded-t-full overflow-hidden filter drop-shadow-sm">
                  <img src={demoGirlImg} alt="Cutout" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-xs text-gray-900">Cutout</span>
            </button>

            {/* 5. Shape (⚡ Pro) */}
            <button
              type="button"
              onClick={() => commitChange({ headerLayout: 'shape' })}
              className={`w-[88px] sm:w-[94px] h-[116px] rounded-[22px] flex flex-col items-center justify-between p-2 shrink-0 cursor-pointer transition-all relative ${
                current.headerLayout === 'shape'
                  ? 'border-2 border-black bg-white shadow-xs'
                  : 'border border-gray-200/90 bg-white hover:border-gray-300'
              }`}
            >
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/60 backdrop-blur-xs text-[#00E575] flex items-center justify-center text-[9px] z-10">
                ⚡
              </span>
              <div className="w-full flex-1 flex items-center justify-center">
                {/* 4-lobed cloud/flower shape matching Image 0, 1 & 2 */}
                <div className="w-12 h-9 rounded-[38%_62%_63%_37%_/_41%_44%_56%_59%] bg-rose-600 overflow-hidden shadow-2xs p-0.5">
                  <img src={demoGirlImg} alt="Shape" className="w-full h-full object-cover rounded-[38%_62%_63%_37%_/_41%_44%_56%_59%]" />
                </div>
              </div>
              <span className="font-bold text-xs text-gray-900">Shape</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Profile Image matching Image 0, 1 & 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <label className="font-bold text-gray-900 text-xs">Profile image</label>

          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadFile(e, 'avatarUrl', 'avatars')}
            />

            {/* Squircle container matching Reference Images */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-18 h-18 rounded-[24px] bg-[#9CA3AF]/60 relative flex items-center justify-center cursor-pointer overflow-hidden group hover:opacity-90 transition-all shadow-inner"
              title="Upload profile image"
            >
              {current.avatarUrl ? (
                <img src={current.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}

              {/* Circular plus button badge on bottom right matching image */}
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 font-bold text-sm border border-gray-100">
                +
              </div>
            </div>

            {/* Remove option if photo is uploaded */}
            {current.avatarUrl && (
              <button
                type="button"
                onClick={() => commitChange({ avatarUrl: null })}
                className="text-xs text-red-600 hover:text-red-700 font-bold transition-colors cursor-pointer"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Optional Banner Upload if Banner layout is active */}
        {current.headerLayout === 'banner' && (
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100 animate-in fade-in">
            <label className="font-bold text-gray-900 text-xs">Banner cover</label>
            <div className="space-y-2 max-w-md">
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
                className="py-1.5 px-3.5 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
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
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100 animate-in fade-in">
            <label className="font-bold text-gray-900 text-xs">Hero cover</label>
            <div className="space-y-2 max-w-md">
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
                className="py-1.5 px-3.5 rounded-full border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
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

        {/* ROW 3: Title matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <label className="font-bold text-gray-900 pt-2 text-xs">Title</label>

          <div className="max-w-md w-full">
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

        {/* ROW 4: Bio matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <label className="font-bold text-gray-900 pt-2 text-xs">Bio</label>

          <div className="max-w-md w-full">
            <div className="relative">
              <textarea
                maxLength={160}
                rows={3}
                value={current.bio}
                onChange={(e) => commitChange({ bio: e.target.value })}
                placeholder="Add a short bio"
                className="w-full px-4 py-3 rounded-[20px] bg-white border border-gray-200/90 focus:border-black focus:outline-none text-xs font-medium text-black resize-none transition-all"
              />
              <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-gray-400 pt-1">
                <span>{current.bio.length}/160</span>
                <span className="text-gray-300 select-none"> //</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: Title style matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <label className="font-bold text-gray-900 pt-2 text-xs">Title style</label>

          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-3">
              {/* Aa Text */}
              <button
                type="button"
                onClick={() => commitChange({ titleStyle: 'text' })}
                className={`w-28 py-3 rounded-[18px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  current.titleStyle === 'text'
                    ? 'border-2 border-black bg-white shadow-xs'
                    : 'border border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-base font-serif font-black text-gray-900 leading-none">Aa</span>
                <span className="text-xs font-bold text-gray-900">Text</span>
              </button>

              {/* Logo (⚡ Pro) */}
              <button
                type="button"
                onClick={() => commitChange({ titleStyle: 'logo' })}
                className={`w-28 py-3 rounded-[18px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative ${
                  current.titleStyle === 'logo'
                    ? 'border-2 border-black bg-white shadow-xs'
                    : 'border border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-black/60 text-[#00E575] flex items-center justify-center text-[8px] z-10">
                  ⚡
                </span>
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
                    className="py-1 px-3 rounded-full bg-black text-white text-[11px] font-bold"
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
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 6: Alternative title font matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-3 sm:gap-6 pb-5 border-b border-gray-100">
          <div>
            <label className="font-bold text-gray-900 block text-xs">Alternative title font</label>
            <span className="text-[11px] text-gray-400 block pt-0.5">Matches page font by default</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-black/60 text-[#00E575] flex items-center justify-center text-[9px] shrink-0">
              ⚡
            </span>

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

        {/* ROW 7: Title color matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-3 sm:gap-6 pb-2">
          <label className="font-bold text-gray-900 text-xs">Title color</label>

          <div className="flex items-center gap-2">
            {/* Color swatch pill button */}
            <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#F6F6F7] border border-gray-200/90 hover:border-gray-300 cursor-pointer shadow-2xs transition-all">
              <input
                type="color"
                value={current.titleColor}
                onChange={(e) => commitChange({ titleColor: e.target.value })}
                className="w-5 h-5 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
              />
              <span className="font-mono text-xs font-bold text-gray-900 uppercase">
                {current.titleColor}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
