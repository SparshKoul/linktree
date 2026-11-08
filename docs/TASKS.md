# TASKS.md

Work top to bottom. One task at a time. Tick when done (typecheck, lint, tests pass).

## Phase 1 – Core (weeks 1-3)
- [x] Init React (JSX) + Node.js (Express, JS) + Tailwind CSS + Lucide Icons
- [x] PostgreSQL schema & queries (admin, tree, card, theme)
- [x] Seed data & profile for single admin (sparshkoul6@gmail.com)
- [x] Login session handling, cookies, logout
- [x] Auth middleware protecting `/admin/*` and `/api/admin/*`
- [x] Trees API: check-slug uniqueness, create, list, update, archive, soft delete
- [x] Trees home & switcher in admin top bar
- [x] 2-Step "Create New Tree" onboarding modal (unique username check + success copy screen)
- [x] Editor layout: card list left, phone preview right
- [x] Cards: link, header, social, product, booking (schema, editor, public render)
- [x] Show/hide toggle, inline title edit, delete with 10s undo toast
- [x] Public page endpoint & telemetry tracking
- [x] Prebuilt themes & real-time appearance controls

## Phase 2 – Cards and design (weeks 4-6)
- [ ] Image upload to S3, thumbnails, alt text
- [ ] Cards: video, music, podcast, image/gallery, text, map
- [ ] Cards: email signup, contact form, booking, phone/WhatsApp, app download
- [ ] Cards: shop/product, tip jar, events (auto-hide past)
- [ ] Cards: collapsible group, custom HTML (sandboxed), share button
- [ ] Full design tab: backgrounds, buttons, fonts, layouts, dark mode, custom CSS
- [ ] 20+ prebuilt themes, save custom theme per tree

## Phase 3 – Pro features (weeks 7-9)
- [ ] Event tracking (view, click) via first-party endpoint, hashed IP
- [ ] Daily rollup job, analytics tab with charts and date range, CSV export
- [ ] Card scheduling with timezone
- [ ] Card locks: age, email, code
- [ ] Priority animations
- [ ] SEO fields, Open Graph image, sitemap, noindex toggle
- [ ] Tracking pixels: Meta, GA4, GTM, TikTok
- [ ] QR codes per tree and per card (PNG, SVG)

## Phase 4 – Integrations and domains (weeks 10-11)
- [ ] Audience tab: subscribers and submissions, CSV export
- [ ] Integrations: Mailchimp, Klaviyo, ConvertKit, Google Sheets, webhooks
- [ ] Custom domain per tree: verification, auto SSL
- [ ] Tree export and import as JSON

## Phase 5 – Polish (week 12)
- [ ] Accessibility pass (WCAG 2.1 AA)
- [ ] Performance pass: LCP under 1.5s on 4G, JS under 100 KB on public page
- [ ] Empty, loading and error states everywhere
- [ ] Security pass: CSRF, rate limits, sanitization, secrets
- [ ] Launch checklist, README, `.env.example`

