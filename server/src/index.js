import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { SESSION_COOKIE, verifySession } from './utils/session.js';
import { authRateLimiter, trackRateLimiter } from './lib/rate-limit.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerTreeRoutes } from './routes/trees.js';
import { registerCardRoutes } from './routes/cards.js';
import { registerPublicRoutes } from './routes/public.js';
import { registerAssetRoutes } from './routes/assets.js';
import { registerCronRoutes } from './routes/cron.js';
import { warmUpPublicTreeCache } from './lib/cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Only these origins may call the API with credentials. The site itself is
// same-origin, so this list exists to keep other websites from acting as a
// signed-in visitor.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function isAllowedOrigin(origin, req) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (DEV_ORIGINS.includes(origin)) return true;
  try {
    // Same host as the request itself (the normal case) is always allowed.
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    const allowed = isAllowedOrigin(origin, req);
    callback(null, {
      origin: allowed ? origin : false,
      credentials: true,
      allowedHeaders: ['Content-Type', 'X-User-Id', 'X-Visitor-Id'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Identity comes from the signed session cookie only.
// The x-user-id header and the legacy userId/token cookies are ignored on
// purpose: they are caller-supplied and were used to impersonate any account.
app.use((req, res, next) => {
  req.userId = verifySession(req.cookies?.[SESSION_COOKIE]) || null;
  next();
});

registerAuthRoutes(app);
registerTreeRoutes(app);
registerCardRoutes(app);
registerPublicRoutes(app);
registerAssetRoutes(app);
registerCronRoutes(app);

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server/src/index.js') ||
  process.argv[1].endsWith('src/index.js')
);

if (isDirectRun && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    warmUpPublicTreeCache().catch(() => {});
  });
}

export default app;
export { app };
