# Link-in-Bio Platform

> A self-hosted, single-admin link-in-bio platform with every Linktree Pro feature unlocked — unlimited business trees, full design customization, cookieless analytics, scheduled links, dynamic QR codes, and zero paywalls.

## 📌 Project Overview

- **Owner/Admin:** Single administrative user managing multiple independent brand/business trees.
- **Independence:** Each tree gets its own custom slug, cards, theme, custom domain, SEO, and analytics.

---

## 📚 Documentation

The complete specifications and guides are organized under [`docs/`](docs/):

1. **[`docs/PRD.md`](docs/PRD.md)**: Product Requirements Document (features, data model, business logic).
2. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**: System architecture, folder structure, caching, auth, and database design.
3. **[`docs/DESIGN.md`](docs/DESIGN.md)**: Design system, UI tokens, public page layout, editor behavior, and accessibility.
4. **[`docs/TASKS.md`](docs/TASKS.md)**: Phased task checklist from Phase 1 through Phase 5.
5. **[`docs/ANTIGRAVITY.md`](docs/ANTIGRAVITY.md)** (and root [`ANTIGRAVITY.md`](ANTIGRAVITY.md)): Core project rules, dev commands, and coding standards.

---

## 🛠️ Tech Stack

- **Frontend:** React (JSX) + Tailwind CSS + Lucide Icons (`lucide-react`)
- **Backend:** Node.js (JavaScript / Express) + PostgreSQL / SQL + Drizzle ORM
- **Format:** Modern JavaScript (`.jsx` / `.js`) — no TSX/TypeScript

---

## 🚀 Key Features

- **Unlimited Business Trees:** Manage distinct brands from a unified top-bar switcher and dashboard.
- **20+ Card & Block Types:** Standard links, headers, socials, embedded video/audio/podcasts, product cards with buy buttons, tip jars, event lists, booking embeds, accordions, contact forms, email newsletter signups, and sandboxed custom HTML.
- **Complete Design Freedom:** 20+ preset themes, custom gradients, video backgrounds, typography scales, pill/rounded buttons, animations, and tree-scoped custom CSS.
- **Live Phone Preview:** Desktop dual-pane editor with instant (<200ms) phone frame preview and autosave.
- **Pro Analytics (Cookieless):** First-party views, click-through rates, geographical breakdown, device metrics, and CSV export.
- **Power User Controls:** Timezone-based scheduling, link locks (age gate, email gate, passcode), tracking pixels (Meta, GA4, GTM, TikTok), and dynamic vector QR codes.

---

## 🔧 Setup

### 1. Environment

Copy `server/.env.example` to `server/.env` and fill it in:

| Variable | Needed for | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side key, never exposed to the browser |
| `SUPABASE_ANON_KEY` | optional | Fallback for the session secret |
| `SESSION_SECRET` | recommended | Long random string used to sign the session cookie. If missing, the Supabase service role key is used |
| `ALLOWED_ORIGINS` | optional | Extra origins allowed to call the API with credentials. The site itself is same-origin |
| `ADMIN_INITIAL_PASSWORD` | first run | Password for the seeded super admin |

### 2. Database

- **New database:** run `server/src/db/schema.sql` in the Supabase SQL editor.
- **Existing database:** run `server/src/db/migrations/001_allow_all_card_types.sql`. It widens the `cards.type` and `cards.lock_type` checks so every card type the editor can create is accepted.

### 3. Run

```bash
npm install
npm run dev      # client on :5173, server on :3001
npm test         # server and client tests
npm run build    # production build of the client
```

### 4. Sessions

Signing in sets one signed `httpOnly` cookie (`it_session`). The server reads
the user only from that cookie: a user id sent in a header or in a plain
cookie is ignored. Everyone who was signed in before this change has to sign
in again.

### 5. Check that everything works

With the server running on port 3001:

```bash
npm run verify --workspace=server
```
This signs a session for one account, makes a few safe requests and prints
PASS or FAIL for every fix: forged identity is refused, passcodes stay on the
server, saving keeps the cards, clicks are all counted, and an unknown card
type is reported instead of silently dropped. It creates one temporary card and
removes it again.

Use `VERIFY_USER_ID=1` to test a different account, and `BASE_URL=...` to point
it at another server (for example the deployed one).

By hand, in the browser:

1. Sign in at `/dashboard`. Open DevTools → Application → Cookies: you should
   see `it_session` marked `HttpOnly`, and no `userId` or `token` cookie.
2. Edit a card and press **Save tree**. The card keeps its id, and the toast
   says it reached the database.
3. Open the public page and reload it. The view count in the database goes up
   by one per load.
4. Delete a card and reload the public page: it is gone immediately.
5. Add a card with a passcode lock, open the public page, and look at the
   network tab: the response for `/api/public/trees/<slug>` does not contain
   the passcode.

### 6. Why the public page is never cached by the edge

The public tree API answers with `Cache-Control: no-cache`. A shared cache
(the Vercel edge, or a browser) would otherwise keep serving the old links
for minutes after an owner saved, because there is no way to purge it. The
speed comes from the in-memory cache in the server, which is emptied the
moment the owner saves, so a change is live on the next request.

---

## 📂 Project Structure

```text
.
├── ANTIGRAVITY.md        # Core instructions & development rules
├── README.md             # Project overview & documentation index
└── docs/
    ├── ANTIGRAVITY.md    # Development guidelines & rules
    ├── ARCHITECTURE.md   # System architecture & data flow
    ├── DESIGN.md         # Design system & UI tokens
    ├── PRD.md            # Product requirements document
    └── TASKS.md          # Phased implementation roadmap
```

---

## 🗺️ Roadmap & Milestones

- [ ] **Phase 1: Core Foundation** (Admin auth, Multi-tree CRUD, Link/Header/Social cards, Public page SSR, Live preview)
- [ ] **Phase 2: All Card Types & Theme Engine** (All 20 card types, 20+ preset themes, image uploads)
- [ ] **Phase 3: Pro Features** (Analytics rollup engine, scheduling, locks, SEO, pixels, QR generator)
- [ ] **Phase 4: Integrations & Custom Domains** (Domain verification, webhooks, Mailchimp, JSON backup export/import)
- [ ] **Phase 5: Launch & Polish** (Accessibility pass, Lighthouse 95+ score, edge caching)
