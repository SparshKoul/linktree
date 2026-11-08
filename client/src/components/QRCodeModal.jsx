import { useState } from 'react';
import { X, Download, Copy, Check, QrCode, Sparkles } from 'lucide-react';

export function QRCodeModal({ isOpen, onClose, treeSlug = 'riyast' }) {
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#111111');
  const [bgColor, setBgColor] = useState('#FFFFFF');

  if (!isOpen) return null;

  const url = `https://indiataps.com/${treeSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svgElement = document.getElementById('indiataps-qr-code-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${treeSlug}-qr-code.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6 text-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#7033FF]">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base">QR Code</h3>
              <p className="text-xs text-gray-400">Share your IndiaTaps in print and offline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas Card */}
        <div className="p-6 rounded-[28px] bg-[#F3F3F1] flex flex-col items-center justify-center space-y-3">
          <div
            className="p-4 rounded-2xl shadow-sm border border-gray-200/50"
            style={{ backgroundColor: bgColor }}
          >
            {/* Vector SVG QR Code */}
            <svg
              id="indiataps-qr-code-svg"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 200"
              className="w-44 h-44"
            >
              <rect width="200" height="200" fill={bgColor} />
              {/* Corner position markers */}
              {/* Top-left */}
              <rect x="20" y="20" width="46" height="46" fill={qrColor} rx="6" />
              <rect x="26" y="26" width="34" height="34" fill={bgColor} rx="4" />
              <rect x="34" y="34" width="18" height="18" fill={qrColor} rx="2" />
              
              {/* Top-right */}
              <rect x="134" y="20" width="46" height="46" fill={qrColor} rx="6" />
              <rect x="140" y="26" width="34" height="34" fill={bgColor} rx="4" />
              <rect x="148" y="34" width="18" height="18" fill={qrColor} rx="2" />

              {/* Bottom-left */}
              <rect x="20" y="134" width="46" height="46" fill={qrColor} rx="6" />
              <rect x="26" y="140" width="34" height="34" fill={bgColor} rx="4" />
              <rect x="34" y="148" width="18" height="18" fill={qrColor} rx="2" />

              {/* Pattern modules */}
              <rect x="76" y="24" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="94" y="24" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="112" y="24" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="76" y="42" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="112" y="42" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="76" y="60" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="94" y="60" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="24" y="76" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="42" y="76" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="76" y="76" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="134" y="76" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="160" y="76" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="24" y="94" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="60" y="94" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="94" y="94" width="12" height="12" fill="#7033FF" rx="3" />
              <rect x="134" y="94" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="42" y="112" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="76" y="112" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="112" y="112" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="148" y="112" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="76" y="134" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="112" y="134" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="148" y="134" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="76" y="152" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="94" y="152" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="134" y="152" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="160" y="152" width="10" height="10" fill={qrColor} rx="2" />

              <rect x="94" y="170" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="112" y="170" width="10" height="10" fill={qrColor} rx="2" />
              <rect x="148" y="170" width="10" height="10" fill={qrColor} rx="2" />
            </svg>
          </div>

          <div className="font-mono text-xs font-semibold text-gray-500">
            indiataps.com/{treeSlug}
          </div>
        </div>

        {/* Customization Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Color Preset</span>
            <div className="flex items-center gap-2">
              {['#111111', '#7033FF', '#10B981', '#0F172A'].map((c) => (
                <button
                  key={c}
                  onClick={() => setQrColor(c)}
                  className={`w-5 h-5 rounded-full border border-gray-200 transition-transform ${
                    qrColor === c ? 'scale-125 ring-2 ring-black' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Link' : 'Copy Link'}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-full bg-[#7033FF] hover:bg-[#5F24F0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#7033FF]/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}

