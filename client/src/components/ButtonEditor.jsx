import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, Pipette } from 'lucide-react';

// Color conversion helpers (RGB / HSV / HEX)
export function hsvToRgb(h, s, v) {
  s = s / 100;
  v = v / 100;
  const f = (n, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255),
  };
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

export function hexToHsv(hex) {
  if (!hex || typeof hex !== 'string') return { h: 0, s: 0, v: 100 };
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return { h: 0, s: 0, v: 100 };

  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / diff + 2) * 60;
    else h = ((r - g) / diff + 4) * 60;
  }

  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;

  return {
    h: Math.round(h),
    s: Math.round(s),
    v: Math.round(v),
  };
}

// Custom 2D HSV Color Picker Popover matching Reference Image 2
export function ColorPickerPopover({ color, onChange, onClose }) {
  const popoverRef = useRef(null);
  const satValBoxRef = useRef(null);
  const hueSliderRef = useRef(null);

  const initialHsv = useRef(hexToHsv(color));
  const [hsv, setHsv] = useState(initialHsv.current);
  const [hexInput, setHexInput] = useState(color || '#FFFFFF');

  // Keep hexInput in sync if color changes from outside
  useEffect(() => {
    if (color) {
      setHexInput(color.toUpperCase());
      const nextHsv = hexToHsv(color);
      setHsv((prev) => {
        // preserve hue if saturation is 0 (white or gray)
        if (nextHsv.s === 0 && prev.s === 0) return { ...nextHsv, h: prev.h };
        return nextHsv;
      });
    }
  }, [color]);

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [onClose]);

  // Handle saturation / brightness drag
  const handleSatValPointer = useCallback(
    (e) => {
      if (!satValBoxRef.current) return;
      const rect = satValBoxRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      const s = Math.round((x / rect.width) * 100);
      const v = Math.round((1 - y / rect.height) * 100);

      setHsv((prev) => {
        const next = { ...prev, s, v };
        const newHex = hsvToHex(next.h, next.s, next.v);
        setHexInput(newHex);
        onChange(newHex);
        return next;
      });
    },
    [onChange]
  );

  const onSatValStart = (e) => {
    handleSatValPointer(e);
    const onMove = (ev) => handleSatValPointer(ev);
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
  };

  // Handle hue slider drag
  const handleHuePointer = useCallback(
    (e) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const h = Math.round((x / rect.width) * 360) % 360;

      setHsv((prev) => {
        const next = { ...prev, h };
        const newHex = hsvToHex(next.h, next.s, next.v);
        setHexInput(newHex);
        onChange(newHex);
        return next;
      });
    },
    [onChange]
  );

  const onHueStart = (e) => {
    handleHuePointer(e);
    const onMove = (ev) => handleHuePointer(ev);
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
  };

  const handleHexInputChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith('#')) val = '#' + val;
    setHexInput(val);

    const stripped = val.replace('#', '');
    if (stripped.length === 6 && /^[0-9A-F]{6}$/i.test(stripped)) {
      const nextHsv = hexToHsv(val);
      setHsv(nextHsv);
      onChange(val);
    }
  };

  const handleEyeDropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          setHexInput(hex);
          setHsv(hexToHsv(hex));
          onChange(hex);
        }
      } catch {
        // cancelled or unsupported
      }
    }
  };

  // Pure hue RGB for base background of saturation box
  const pureHueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-0 z-50 bg-white rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-gray-100 w-[240px] sm:w-[255px] animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* 1. 2D Color Saturation & Brightness Area */}
      <div
        ref={satValBoxRef}
        onPointerDown={onSatValStart}
        className="w-full h-32 rounded-2xl relative overflow-hidden cursor-crosshair shadow-inner"
        style={{
          backgroundColor: pureHueColor,
          backgroundImage:
            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
      >
        {/* Circular Pointer Handle */}
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-md absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
          }}
        />
      </div>

      {/* 2. Rainbow Hue Slider */}
      <div
        ref={hueSliderRef}
        onPointerDown={onHueStart}
        className="w-full h-2.5 rounded-full relative cursor-pointer select-none my-3.5"
        style={{
          background:
            'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
        }}
      >
        {/* Hue Slider Thumb */}
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-md absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: pureHueColor,
          }}
        />
      </div>

      {/* 3. Hex Input & Eyedropper row */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          maxLength={7}
          className="flex-1 py-1 px-2.5 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 uppercase focus:outline-none focus:border-black"
        />
        <button
          type="button"
          onClick={handleEyeDropper}
          className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          title="Pick color from screen"
        >
          <Pipette className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Suggested Swatches matching Image 2 */}
      <div>
        <div className="text-[11px] font-semibold text-gray-500 mb-1.5">Suggested</div>
        <div className="flex items-center gap-2.5">
          {['#1E1E24', '#9CA3AF', '#000000'].map((suggestedColor) => (
            <button
              key={suggestedColor}
              type="button"
              onClick={() => {
                setHexInput(suggestedColor);
                setHsv(hexToHsv(suggestedColor));
                onChange(suggestedColor);
              }}
              className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer shadow-2xs"
              style={{ backgroundColor: suggestedColor }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ButtonEditor({ current, commitChange, onBack }) {
  const [activePicker, setActivePicker] = useState(null); // null | 'buttonColor' | 'buttonTextColor'

  const currentStyle = current.buttonStyle || 'solid';
  const isGlass = currentStyle === 'glass';

  // Corner roundness active index
  // 0: Square (0) | 1: Subtle (8) | 2: Medium (16) | 3: Pill (9999)
  const getActiveCornerIndex = () => {
    const r = current.buttonRadius;
    if (r == null || r >= 24) return 3;
    if (r > 12) return 2;
    if (r > 4) return 1;
    return 0;
  };

  const activeCorner = getActiveCornerIndex();

  const handleSelectCorner = (index) => {
    const radii = [0, 8, 16, 9999];
    commitChange({ buttonRadius: radii[index] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 relative">
      {/* 1. Header with back button "< Buttons" */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer text-gray-700"
          title="Back to Design"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-[#111111]">Buttons</h2>
      </div>

      {/* 2. Button style section */}
      <div className="space-y-2.5">
        <label className="text-xs sm:text-sm font-bold text-gray-900 block">Button style</label>
        <div className="grid grid-cols-3 gap-3 sm:gap-3.5 max-w-[420px]">
          {/* Tile 1: Solid */}
          <button
            type="button"
            onClick={() => commitChange({ buttonStyle: 'solid' })}
            className={`rounded-[20px] overflow-hidden flex flex-col bg-white transition-all cursor-pointer ${
              currentStyle === 'solid' || currentStyle === 'fill'
                ? 'border-2 border-black shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div className="h-16 sm:h-18 bg-[#B5B9BE] flex items-center justify-center relative">
              <div className="w-14 sm:w-16 h-5 sm:h-6 rounded-full bg-white shadow-2xs" />
            </div>
            <div className="py-2.5 text-center bg-white">
              <span className="text-[13px] font-semibold text-gray-900">Solid</span>
            </div>
          </button>

          {/* Tile 2: Glass */}
          <button
            type="button"
            onClick={() => commitChange({ buttonStyle: 'glass' })}
            className={`rounded-[20px] overflow-hidden flex flex-col bg-white transition-all cursor-pointer relative ${
              currentStyle === 'glass'
                ? 'border-2 border-black shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div className="h-16 sm:h-18 bg-[#B5B9BE] flex items-center justify-center relative">
              <div className="w-14 sm:w-16 h-5 sm:h-6 rounded-full bg-white/40 backdrop-blur-xs border border-white/50 shadow-2xs" />
            </div>
            <div className="py-2.5 text-center bg-white">
              <span className="text-[13px] font-semibold text-gray-900">Glass</span>
            </div>
          </button>

          {/* Tile 3: Outline */}
          <button
            type="button"
            onClick={() => commitChange({ buttonStyle: 'outline' })}
            className={`rounded-[20px] overflow-hidden flex flex-col bg-white transition-all cursor-pointer relative ${
              currentStyle === 'outline'
                ? 'border-2 border-black shadow-xs'
                : 'border border-gray-200/90 hover:border-gray-300'
            }`}
          >
            <div className="h-16 sm:h-18 bg-[#B5B9BE] flex items-center justify-center relative">
              <div className="w-14 sm:w-16 h-5 sm:h-6 rounded-full border-[1.5px] border-white bg-transparent" />
            </div>
            <div className="py-2.5 text-center bg-white">
              <span className="text-[13px] font-semibold text-gray-900">Outline</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Corner roundness section */}
      <div className="flex items-center justify-between max-w-[420px] pt-1">
        <label className="text-xs sm:text-sm font-bold text-gray-900">Corner roundness</label>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Corner 1: Sharp Square */}
          <button
            type="button"
            onClick={() => handleSelectCorner(0)}
            className={`w-11 sm:w-12 h-10 rounded-xl sm:rounded-[14px] bg-white flex items-center justify-center cursor-pointer transition-all ${
              activeCorner === 0
                ? 'border-2 border-black shadow-xs text-black'
                : 'border border-gray-200/90 hover:border-gray-300 text-gray-600'
            }`}
            title="Square corners"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="miter"
            >
              <path d="M7 17V7h10" />
            </svg>
          </button>

          {/* Corner 2: Subtle Round */}
          <button
            type="button"
            onClick={() => handleSelectCorner(1)}
            className={`w-11 sm:w-12 h-10 rounded-xl sm:rounded-[14px] bg-white flex items-center justify-center cursor-pointer transition-all ${
              activeCorner === 1
                ? 'border-2 border-black shadow-xs text-black'
                : 'border border-gray-200/90 hover:border-gray-300 text-gray-600'
            }`}
            title="Subtle rounded corners"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17V10a3 3 0 0 1 3-3h7" />
            </svg>
          </button>

          {/* Corner 3: Medium Round */}
          <button
            type="button"
            onClick={() => handleSelectCorner(2)}
            className={`w-11 sm:w-12 h-10 rounded-xl sm:rounded-[14px] bg-white flex items-center justify-center cursor-pointer transition-all ${
              activeCorner === 2
                ? 'border-2 border-black shadow-xs text-black'
                : 'border border-gray-200/90 hover:border-gray-300 text-gray-600'
            }`}
            title="Rounded corners"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17V11a5 5 0 0 1 5-5h5" />
            </svg>
          </button>

          {/* Corner 4: Pill Curved Arc */}
          <button
            type="button"
            onClick={() => handleSelectCorner(3)}
            className={`w-11 sm:w-12 h-10 rounded-xl sm:rounded-[14px] bg-white flex items-center justify-center cursor-pointer transition-all ${
              activeCorner === 3
                ? 'border-2 border-black shadow-xs text-black'
                : 'border border-gray-200/90 hover:border-gray-300 text-gray-600'
            }`}
            title="Pill corners"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17C7 11.477 11.477 7 17 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color Section Container with relative anchor for popover */}
      <div className="relative max-w-[420px] space-y-3.5 pt-1">
        {/* 4. Button Color Row (Hidden for Glass matching Image 0) */}
        {!isGlass && (
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-gray-900">Button color</label>
            <button
              type="button"
              onClick={() =>
                setActivePicker(activePicker === 'buttonColor' ? null : 'buttonColor')
              }
              className="w-28 sm:w-32 h-10 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center px-3 py-1.5 gap-2.5 cursor-pointer transition-all shadow-2xs"
            >
              <div
                className="w-5 h-5 rounded-md border border-gray-200 shadow-2xs shrink-0"
                style={{ backgroundColor: current.buttonColor || '#FFFFFF' }}
              />
              <span className="text-xs font-mono font-medium text-gray-900 tracking-wider">
                {current.buttonColor || '#FFFFFF'}
              </span>
            </button>
          </div>
        )}

        {/* 5. Button Text Color Row (Always visible) */}
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-gray-900">Button text color</label>
          <button
            type="button"
            onClick={() =>
              setActivePicker(activePicker === 'buttonTextColor' ? null : 'buttonTextColor')
            }
            className="w-28 sm:w-32 h-10 border border-gray-200/90 hover:border-gray-300 rounded-2xl bg-white flex items-center px-3 py-1.5 gap-2.5 cursor-pointer transition-all shadow-2xs"
          >
            <div
              className="w-5 h-5 rounded-md border border-gray-200 shadow-2xs shrink-0"
              style={{ backgroundColor: current.buttonTextColor || '#FFFFFF' }}
            />
            <span className="text-xs font-mono font-medium text-gray-900 tracking-wider">
              {current.buttonTextColor || '#FFFFFF'}
            </span>
          </button>
        </div>

        {/* Color Picker Popover matching Image 1: positioned on the left side */}
        {activePicker && (
          <div className="absolute left-0 -top-24 sm:-top-28 z-50">
            <ColorPickerPopover
              color={
                activePicker === 'buttonColor'
                  ? current.buttonColor || '#FFFFFF'
                  : current.buttonTextColor || '#FFFFFF'
              }
              onChange={(newColor) => {
                if (activePicker === 'buttonColor') {
                  commitChange({ buttonColor: newColor });
                } else {
                  commitChange({ buttonTextColor: newColor });
                }
              }}
              onClose={() => setActivePicker(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
