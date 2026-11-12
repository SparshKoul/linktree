/**
 * Measure what a page really costs: what is downloaded, how long it takes
 * to show something, and how many nodes the cards make.
 *
 *   node scripts/measure.mjs <url> [width] [height]
 */
import { spawn } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';

const [url, width = '390', height = '844'] = process.argv.slice(2);
if (!url) {
  console.error('usage: node scripts/measure.mjs <url> [width] [height]');
  process.exit(1);
}

const profileDir = path.join('/tmp/opencode', 'chrome-measure');
fs.mkdirSync(profileDir, { recursive: true });

const port = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn(
  '/opt/google/chrome/chrome',
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-dev-shm-usage',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

async function main() {
  await waitForChrome();

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
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: Number(width),
    height: Number(height),
    deviceScaleFactor: 1,
    mobile: Number(width) < 768,
  });

  // A clean cache, so the numbers are the real ones.
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Network.clearBrowserCache');

  const started = Date.now();
  await send('Page.navigate', { url });
  await sleep(4500);

  const measured = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paints = {};
      for (const entry of performance.getEntriesByType('paint')) {
        paints[entry.name] = Math.round(entry.startTime);
      }
      const resources = performance.getEntriesByType('resource').map((r) => ({
        name: r.name.replace(location.origin, ''),
        type: r.initiatorType,
        transfer: r.transferSize,
        decoded: r.decodedBodySize,
        time: Math.round(r.duration),
      }));
      const byType = {};
      for (const r of resources) {
        const key = r.type;
        byType[key] = byType[key] || { count: 0, transfer: 0, decoded: 0 };
        byType[key].count += 1;
        byType[key].transfer += r.transfer;
        byType[key].decoded += r.decoded;
      }
      return {
        paints,
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        responseEnd: Math.round(nav.responseEnd || 0),
        nodes: document.getElementsByTagName('*').length,
        resources: resources.sort((a, b) => b.decoded - a.decoded).slice(0, 14),
        byType,
        memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      };
    })()`,
  });

  const value = measured.result?.result?.value;
  console.log('url:', url);
  console.log('first paint:', value.paints['first-paint'], 'ms   first contentful paint:', value.paints['first-contentful-paint'], 'ms');
  console.log('response end:', value.responseEnd, 'ms   dom ready:', value.domContentLoaded, 'ms   load:', value.load, 'ms');
  console.log('nodes in the page:', value.nodes, '   javascript heap:', value.memory, 'MB');
  console.log('by type:', JSON.stringify(value.byType));
  console.log('biggest files:');
  for (const r of value.resources) {
    console.log(`  ${(r.decoded / 1024).toFixed(0).padStart(5)} KB  ${String(r.transfer).padStart(7)} B  ${String(r.time).padStart(5)} ms  ${r.name.slice(0, 90)}`);
  }
  console.log('wall clock:', Date.now() - started, 'ms');

  ws.close();
  chrome.kill();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message);
    chrome.kill();
    process.exit(1);
  });
