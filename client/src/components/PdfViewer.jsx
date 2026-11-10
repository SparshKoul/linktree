import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
  const containerRef = useRef(null);

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

        for (let pageNum = 1; pageNum <= maxPagesToRender; pageNum++) {
          if (isCancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: isThumbnail ? 1.0 : 1.5 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (isCancelled) return;
          renderedPages.push(canvas.toDataURL('image/jpeg', 0.88));
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
      <div className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-gray-50/80 text-gray-500 gap-2 p-4 ${className}`}>
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
      className={`w-full h-full overflow-y-auto space-y-3.5 p-2 sm:p-3 bg-gray-100 rounded-2xl touch-pan-y overscroll-contain select-none ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={(e) => e.stopPropagation()}
    >
      {pages.map((pageImg, idx) => (
        <div
          key={idx}
          className="w-full bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200/80 relative"
        >
          <img
            src={pageImg}
            alt={`Page ${idx + 1}`}
            className="w-full h-auto block select-none pointer-events-none"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono font-bold text-white shadow-xs">
            {idx + 1} / {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
}
