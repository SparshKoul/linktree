import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

function loadPdfJs() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pdfjs-cdn-script');
    if (existing) {
      if (window.pdfjsLib) return resolve(window.pdfjsLib);
      existing.addEventListener('load', () => resolve(window.pdfjsLib));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'pdfjs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('pdfjsLib not defined'));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function PdfViewer({ url, title = 'Document', className = '', isThumbnail = false }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isGestureActive, setIsGestureActive] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const posRef = useRef(pos);
  posRef.current = pos;

  const gestureStartRef = useRef({
    dist: 0,
    scale: 1,
    center: { x: 0, y: 0 },
    pos: { x: 0, y: 0 },
    lastTouch: { x: 0, y: 0 },
  });
  const lastTapRef = useRef(0);

  useEffect(() => {
    let isCancelled = false;
    if (!url) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    async function loadPdf() {
      try {
        const pdfjsLib = await loadPdfJs();
        if (isCancelled) return;

        let loadingTask;
        if (url.startsWith('data:application/pdf;base64,')) {
          const base64Data = url.replace('data:application/pdf;base64,', '');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else {
          loadingTask = pdfjsLib.getDocument({ url });
        }

        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const maxPagesToRender = isThumbnail ? 1 : Math.min(pdf.numPages, 30);
        const renderedPages = [];

        // High 2.2x resolution render so zoomed in pages stay razor sharp
        const renderScale = isThumbnail ? 1.0 : 2.2;

        for (let pageNum = 1; pageNum <= maxPagesToRender; pageNum++) {
          if (isCancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (isCancelled) return;
          renderedPages.push(canvas.toDataURL('image/jpeg', 0.90));
        }

        if (!isCancelled) {
          setPages(renderedPages);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [url, isThumbnail]);

  // Touch gesture listeners for fluid pinch-to-zoom and full 2D left/right/up/down panning
  useEffect(() => {
    if (isThumbnail) return;
    const target = containerRef.current;
    if (!target) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Multi-touch pinch start: calculate distance and center
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        gestureStartRef.current = {
          dist,
          scale: scaleRef.current,
          center,
          pos: { ...posRef.current },
          lastTouch: { x: center.x, y: center.y },
        };
        setIsGestureActive(true);
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        const now = Date.now();

        // Double-tap zoom toggle
        if (now - lastTapRef.current < 300) {
          e.preventDefault();
          if (scaleRef.current > 1.1) {
            setScale(1);
            setPos({ x: 0, y: 0 });
          } else {
            setScale(2.2);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const tapX = t.clientX - rect.left - rect.width / 2;
              const tapY = t.clientY - rect.top - rect.height / 2;
              setPos({ x: -tapX * 0.7, y: -tapY * 0.7 });
            }
          }
          lastTapRef.current = 0;
          return;
        }

        lastTapRef.current = now;
        gestureStartRef.current.lastTouch = { x: t.clientX, y: t.clientY };
        if (scaleRef.current > 1.05) {
          setIsGestureActive(true);
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        // Two fingers: zoom in/out AND move left/right/up/down simultaneously
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const start = gestureStartRef.current;
        if (start.dist > 0) {
          const factor = dist / start.dist;
          const newScale = Math.min(Math.max(1, start.scale * factor), 4.5);

          // 2-finger translation (move left/right/up/down while pinching)
          const deltaX = center.x - start.center.x;
          const deltaY = center.y - start.center.y;

          const containerW = containerRef.current?.clientWidth || 360;
          const contentH = contentRef.current?.clientHeight || 600;

          const maxPanX = (containerW * (newScale - 1)) / 2 + 100;
          const maxPanY = (contentH * (newScale - 1)) / 2 + 150;

          const nextX = Math.min(Math.max(-maxPanX, start.pos.x + deltaX), maxPanX);
          const nextY = Math.min(Math.max(-maxPanY, start.pos.y + deltaY), maxPanY);

          setScale(Number(newScale.toFixed(2)));
          setPos({ x: nextX, y: nextY });
        }
      } else if (e.touches.length === 1 && scaleRef.current > 1.05) {
        // One finger: move left/right and up/down freely across zoomed image
        e.preventDefault();
        const t = e.touches[0];
        const deltaX = t.clientX - gestureStartRef.current.lastTouch.x;
        const deltaY = t.clientY - gestureStartRef.current.lastTouch.y;
        gestureStartRef.current.lastTouch = { x: t.clientX, y: t.clientY };

        const currentScale = scaleRef.current;
        const containerW = containerRef.current?.clientWidth || 360;
        const contentH = contentRef.current?.clientHeight || 600;

        const maxPanX = (containerW * (currentScale - 1)) / 2 + 100;
        const maxPanY = (contentH * (currentScale - 1)) / 2 + 180;

        setPos((prev) => ({
          x: Math.min(Math.max(-maxPanX, prev.x + deltaX), maxPanX),
          y: Math.min(Math.max(-maxPanY, prev.y + deltaY), maxPanY),
        }));
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        setIsGestureActive(false);
        gestureStartRef.current.dist = 0;
        if (scaleRef.current <= 1.05) {
          setScale(1);
          setPos({ x: 0, y: 0 });
        }
      } else if (e.touches.length === 1) {
        // Seamless transition when lifting one of two fingers
        gestureStartRef.current.lastTouch = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        gestureStartRef.current.dist = 0;
      }
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: false });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    target.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isThumbnail]);

  if (error) {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        title={title}
        className={`w-full h-full border-0 bg-white pointer-events-auto ${className}`}
      />
    );
  }

  if (loading) {
    return (
      <div className={`w-full h-full min-h-[220px] flex flex-col items-center justify-center bg-gray-50/80 text-gray-500 gap-2 p-4 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[#EA580C]" />
        <span className="text-xs font-semibold">Loading document pages...</span>
      </div>
    );
  }

  if (isThumbnail) {
    return (
      <div className={`w-full h-full overflow-hidden bg-white flex items-center justify-center ${className}`}>
        {pages[0] ? (
          <img
            src={pages[0]}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="text-xs text-gray-400">PDF Document</div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className={`relative w-full h-full bg-gray-100 rounded-2xl select-none overscroll-contain ${
        scale > 1.05 ? 'overflow-hidden' : 'overflow-y-auto'
      } ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: scale > 1.05 ? 'none' : 'pan-y',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Zoomable & Pannable Document Content Layer */}
      <div
        ref={contentRef}
        className={`w-full p-2 sm:p-3 space-y-3.5 origin-center ${
          isGestureActive ? 'transition-none' : 'transition-transform duration-200 ease-out'
        }`}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {pages.map((pageImg, idx) => (
          <div
            key={idx}
            className="w-full bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200/80 relative"
          >
            <img
              src={pageImg}
              alt={`Page ${idx + 1}`}
              className="w-full h-auto block select-none pointer-events-auto"
              draggable="false"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono font-bold text-white shadow-xs pointer-events-none">
              {idx + 1} / {pages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Zoom Controls & Reset Pill */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white shadow-xl border border-white/10 select-none">
        <button
          type="button"
          onClick={() => {
            setScale((s) => {
              const next = Math.max(1, Number((s - 0.35).toFixed(2)));
              if (next <= 1.05) setPos({ x: 0, y: 0 });
              return next;
            });
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5 pointer-events-none" />
        </button>

        <span className="text-[11px] font-mono font-bold px-1.5 min-w-[38px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={() => {
            setScale((s) => Math.min(4.5, Number((s + 0.35).toFixed(2))));
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5 pointer-events-none" />
        </button>

        {scale > 1.05 && (
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPos({ x: 0, y: 0 });
            }}
            className="ml-1 px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[10px] font-bold tracking-tight transition-all cursor-pointer flex items-center gap-1"
            title="Reset zoom"
          >
            <RotateCcw className="w-3 h-3 pointer-events-none" />
            <span>1x</span>
          </button>
        )}
      </div>
    </div>
  );
}
