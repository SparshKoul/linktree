/**
 * A small check of the dashboard in a browser of a given size.
 *
 * It opens the dashboard, signs in with a session that is made here (the
 * secret comes from the environment), sets the size of the window and takes
 * a picture. It is only a helper for looking at the screens.
 *
 * node scripts/shoot.mjs <url> <out.png> [width] [height] [waitMs]
 */
import { spawn } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [url, out, width = '1440', height = '900', waitMs = '3500'] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [waitMs]');
  process.exit(1);
}

const secret =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!secret) {
  console.error('no SESSION_SECRET in the environment');
  process.exit(1);
}

const userId = Number(process.env.SHOOT_USER_ID || 1);

function sign(userIdValue) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userIdValue, exp: Date.now() + 3600 * 1000 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

const profileDir = path.join('/tmp/opencode', 'chrome-profile');
fs.mkdirSync(profileDir, { recursive: true });

const port = 9333 + Math.floor(Math.random() * 200);
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

  const origin = new URL(url).origin;
  await send('Network.setCookie', {
    name: 'it_session',
    value: sign(userId),
    domain: 'localhost',
    path: '/',
  });

  await send('Page.navigate', { url });
  await sleep(2500);

  // The dashboard also keeps the signed in person in the browser.
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('linktree_user', ${JSON.stringify(
      JSON.stringify({
        id: userId,
        email: process.env.SHOOT_USER_EMAIL || 'sparshkoul6@gmail.com',
        username: 'sparshkoul6',
        role: 'super_admin',
        accountType: 'super_admin',
        isSuperAdmin: true,
      })
    )}); location.reload();`,
  });

  await sleep(Number(waitMs));
  await send('Runtime.evaluate', { expression: 'location.reload()' });
  await sleep(Number(waitMs));

  // Optional: press some buttons with these texts before the picture.
  const clickText = process.env.SHOOT_CLICK;
  if (clickText) {
    for (const wanted of clickText.split('|')) {
      const result = await send('Runtime.evaluate', {
        expression: `(() => {
          const wanted = ${JSON.stringify(wanted.trim())};
          const all = [...document.querySelectorAll('button, a, [role="button"], div, span')];
          const byText = all.filter((b) => b.innerText && b.innerText.trim() === wanted);
          // The deepest one is the element itself, not its wrapper.
          const button = byText[byText.length - 1]
            || all.find((b) => b.title === wanted)
            || all.find((b) => b.getAttribute('aria-label') === wanted);
          if (button) button.click();
          return button ? 'clicked' : 'not found';
        })()`,
      });
      console.log('click', wanted.trim(), '->', result.result?.result?.value);
      await sleep(1200);
    }
    await sleep(Number(process.env.SHOOT_CLICK_WAIT || 4000));
  }

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved', out);

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
