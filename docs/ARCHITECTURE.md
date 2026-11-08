# ARCHITECTURE.md

## Overview
Fullstack architecture using **React** (with Tailwind CSS & Lucide Icons) on the frontend and a **Node.js** (TypeScript REST API) backend. PostgreSQL is the source of truth managed via Drizzle ORM. Redis buffers analytics and enforces rate limits. Public link pages are served fast from cache.

## Tech Stack
- **Frontend:** React (JSX) + Tailwind CSS + Lucide Icons (`lucide-react`)
- **Backend:** Node.js (JavaScript / Express) + SQL / PostgreSQL (Drizzle ORM)
- **Database:** PostgreSQL (SQL)
- **Format:** Modern JavaScript `.jsx` and `.js` (Strictly JSX, not TSX)

## Folder Layout
```
├── client/                      # React frontend
│   ├── src/
│   │   ├── assets/              # Static assets, branding
│   │   ├── cards/               # Card types: schema.ts, Editor.tsx, Public.tsx
│   │   ├── components/          # Reusable UI (buttons, inputs, phone preview, modals)
│   │   │   └── icons/           # Lucide icon wrappers
│   │   ├── hooks/               # Custom React hooks (autosave, analytics)
│   │   ├── pages/
│   │   │   ├── admin/           # Dashboard: trees home, editor, design, analytics, audience, settings
│   │   │   └── public/          # Public tree page (/[slug])
│   │   ├── services/            # API client layer (TanStack Query / fetch)
│   │   └── styles/              # Tailwind CSS styles & design tokens
│   ├── index.html
│   └── vite.config.ts (or config)
│
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── controllers/         # Request handlers (admin, public, track, forms)
│   │   ├── db/                  # Drizzle ORM schema, migrations, client
│   │   ├── middleware/          # Session auth, rate limits, error handler
│   │   ├── routes/              # Express API route definitions
│   │   ├── services/            # Analytics buffer, caching, domain verification, S3
│   │   └── index.ts             # Server entry point
│   └── tsconfig.json
│
└── docs/                        # Specifications (PRD, ARCHITECTURE, DESIGN, TASKS, ANTIGRAVITY)
```

## Routing
- Public tree: `/:slug` (mapped to tree by slug). Reserved slugs: `admin`, `api`, `login`, `static`.
- Custom domain: reverse proxy / middleware inspects `Host` header, routes to the matching tree.
- Admin routes: `/admin/*` protected by session cookie.
- API endpoints: `/api/admin/*` (authenticated), `/api/track` (public telemetry), `/api/forms/:cardId` (public submissions).

## Data Model
Admin, Tree, Card, Theme, Subscriber, Submission, Event, Integration, Asset. See `PRD.md` Section 9 for complete field specifications. Every entity except Admin carries `tree_id`. Type-specific card settings are validated using Zod.

## Public Page Rendering & Performance
1. Request hits `/:slug` (or custom domain).
2. Look up cached tree bundle (tree details + active cards + theme).
3. On cache miss, fetch from PostgreSQL, apply schedule window filter, and populate Redis cache.
4. Cache is automatically invalidated when an admin publishes or edits that tree.
5. Scheduled cards use short TTL / evaluation so links appear and disappear on schedule.

## Auth
Single admin only. Email + password hashed using Argon2, optional TOTP 2FA, httpOnly secure session cookie, CSRF validation on mutating actions, login rate limit. No public signup route.

## Analytics (Cookieless)
- Client dispatches `view` on load and `click` on link tap via `/api/track` (using `navigator.sendBeacon`).
- Server computes a salted daily hash of (IP + User-Agent). Raw IP is never persisted.
- Events stream into Redis buffer and flush in periodic batches into the `Event` table.
- Daily aggregation job produces summary stats for responsive admin analytics charts.

## Uploads
Client requests presigned S3 upload URL from Node.js backend. Uploads transfer directly to S3/R2 storage with MIME type and size checks.

## Custom Domains
Admin inputs custom domain, system validates CNAME/A records, and reverse proxy (Caddy / Cloudflare for SaaS) auto-issues TLS/SSL certificates.

## Integrations
Submissions from email signup and contact forms push to an asynchronous queue with retries to sync with Mailchimp, Klaviyo, ConvertKit, Google Sheets, or webhooks.

## Security
Enforce HTTPS, strict Zod validation on every endpoint, sanitize rich text, sandbox custom HTML inside `<iframe>`, encrypt integration credentials at rest, and employ honeypot + rate limits on public forms.
