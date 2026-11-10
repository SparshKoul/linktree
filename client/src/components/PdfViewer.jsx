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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Pinch / Pan gesture tracking refs
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const initialDistanceRef = useRef(0);
  const initialZoomRef = useRef(1);
  const lastTouchRef = useRef({ x: 0, y: 0 });
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

        // Higher render scale (2.2x) so zoomed-in images stay razor sharp
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

  // Touch gesture listeners for fluid pinch-to-zoom and pan on mobile
  useEffect(() => {
    if (isThumbnail) return;
    const target = containerRef.current;
    if (!target) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Multi-touch pinch start
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialDistanceRef.current = dist;
        initialZoomRef.current = zoomRef.current;
        setIsPinching(true);
      } else if (e.touches.length === 1) {
        // Double-tap zoom toggle
        const now = Date.now();
        if (now - lastTapRef.current < 320) {
          e.preventDefault();
          if (zoomRef.current > 1.2) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          } else {
            setZoom(2.2);
          }
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistanceRef.current > 0) {
        // Two-finger pinch: scale document
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialDistanceRef.current;
        const newZoom = Math.min(Math.max(1, initialZoomRef.current * factor), 4.5);
        setZoom(Number(newZoom.toFixed(2)));
      } else if (e.touches.length === 1 && zoomRef.current > 1.05) {
        // One-finger pan when zoomed in
        e.preventDefault();
        const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
        const deltaY = e.touches[0].clientY - lastTouchRef.current.y;
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const maxPanX = 260 * (zoomRef.current - 1);
        const maxPanY = 480 * (zoomRef.current - 1);

        setPan((prev) => ({
          x: Math.min(Math.max(-maxPanX, prev.x + deltaX), maxPanX),
          y: Math.min(Math.max(-maxPanY, prev.y + deltaY), maxPanY),
        }));
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDistanceRef.current = 0;
        setIsPinching(false);
        if (zoomRef.current < 1.05) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      }
    };

    // Use non-passive touch listeners to allow preventDefault during pinch
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
      className={`relative w-full h-full overflow-y-auto overflow-x-hidden bg-gray-100 rounded-2xl select-none overscroll-contain ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: zoom > 1.05 ? 'none' : 'pan-y',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Zoomable Content Layer */}
      <div
        ref={contentRef}
        className={`w-full p-2 sm:p-3 space-y-3.5 origin-top ${
          isPinching ? 'transition-none' : 'transition-transform duration-150 ease-out'
        }`}
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'top center',
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
            setZoom((z) => {
              const next = Math.max(1, Number((z - 0.35).toFixed(2)));
              if (next <= 1.05) setPan({ x: 0, y: 0 });
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
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => {
            setZoom((z) => Math.min(4.5, Number((z + 0.35).toFixed(2))));
          }}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5 pointer-events-none" />
        </button>

        {zoom > 1.05 && (
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
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
