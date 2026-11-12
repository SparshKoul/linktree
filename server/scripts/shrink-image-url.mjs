/**
 * Make the pictures that are already on the site smaller.
 *
 * The browser can do it: a picture is drawn on a canvas and sent back
 * smaller. The picture keeps its look.
 */
import { spawn } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Make a picture smaller with a headless browser.
 * @param {string} url the address of the picture
 * @param {object} [options]
 * @param {number} [options.maxWidth]
 * @param {number} [options.maxHeight]
 * @param {number} [options.quality]
 * @returns {Promise<{dataUrl: string, width: number, height: number}|null>}
 */
export async function shrinkImageUrl(url, options = {}) {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  const profileDir = path.join('/tmp/opencode', 'chrome-shrink');
  fs.mkdirSync(profileDir, { recursive: true });

  const port = 9800 + Math.floor(Math.random() * 150);
  const chrome = spawn(
    '/opt/google/chrome/chrome',
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-gpu',
      '--no-first-run',
      '--disable-dev-shm-usage',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  try {
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) break;
      } catch {
        // not up yet
      }
      await sleep(250);
    }

    const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const messageId = ++id;
        pending.set(messageId, resolve);
        ws.send(JSON.stringify({ id: messageId, method, params }));
      });

    await send('Page.enable');
    await send('Runtime.enable');

    // The picture is opened on its own page, so the page can draw it.
    await send('Page.navigate', { url });
    await sleep(2500);

    const result = await send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const image = document.images[0];
        if (!image || !image.naturalWidth) return null;
        const scale = Math.min(1, ${maxWidth} / image.naturalWidth, ${maxHeight} / image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', ${quality});
        return { dataUrl, width: canvas.width, height: canvas.height };
      })()`,
    });

    ws.close();
    return result.result?.result?.value || null;
  } finally {
    chrome.kill();
  }
}
