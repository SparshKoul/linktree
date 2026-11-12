/**
 * The pdf reader.
 *
 * The library is a big piece (365 kilobytes) and is only needed when
 * somebody opens a document. It sits in a module of its own so that a
 * visitor who never opens a document never downloads it.
 */
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsPromise = null;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return pdfjsLib;
    });
  }
  return pdfjsPromise;
}
