# ANTIGRAVITY.md

Link-in-bio platform. One admin owns many "trees" (business pages). Each tree has cards, a theme, analytics, SEO and an optional custom domain. All Pro features are always on. No plans, no paywalls.

## Read first (in order)
1. `docs/PRD.md` – what to build
2. `docs/ARCHITECTURE.md` – how it is structured
3. `docs/DESIGN.md` – how it looks
4. `docs/TASKS.md` – what to do next (work top to bottom, one task at a time)

## Stack
- **Frontend:** React (`.jsx`, modern JavaScript) + Tailwind CSS + Lucide Icons (`lucide-react`)
- **Backend:** Node.js (`.js`, Express) + PostgreSQL / SQL + Drizzle ORM
- **Styling:** Tailwind CSS configured for React JSX
- **Language Standard:** JavaScript / JSX only (no TypeScript / `.tsx`)

## Commands
- `npm run dev` – start client and server dev servers
- `npm run build` – build client and server
- `npm test` – run tests

## Rules
- Single admin only. No public signup route. Admin is seeded once.
- Strictly JSX (`.jsx`) and JavaScript (`.js`) — no `.tsx` or TypeScript.
- Every query on trees, cards, subscribers or events must be scoped by `tree_id`.
- Mobile first. Every screen must work at 320px.
- Use Lucide Icons (`lucide-react`) for UI icons.
- Keep files under ~300 lines. Prefer clean components.

## Never
- Use `.tsx` or TypeScript files.
- Add billing, plan checks or feature flags that lock features.
- Commit secrets. Use `.env.local` and keep `.env.example` current.

## Done means
Lint and tests pass, features match the UI screenshots, and the task is ticked in `docs/TASKS.md`.
