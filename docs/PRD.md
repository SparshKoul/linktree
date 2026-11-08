# Link-in-Bio Platform PRD

**Date:** Nov 8, 2026  
**Author:** @sparsh  

A single-admin link-in-bio platform with every Linktree Pro feature unlocked, where one owner account runs unlimited business trees, each with its own public page, cards, design, and analytics.

---

## 1. Overview

### Problem
Linktree gates its best features (analytics, scheduling, custom domains, commerce, integrations) behind paid tiers and caps users to one brand per plan. This product gives one owner every Pro feature, with unlimited separate trees for different businesses.

### Goals
- **Pixel-close parity** with the Linktree public page layout and the admin editor flow (same interaction patterns, same mental model).
- **All Pro features enabled by default**: no paywalls, no plan checks.
- **Single admin, unlimited business trees**: one admin account manages unlimited independent business trees.
- **Rapid editing**: edit and publish a card in under 10 seconds, with a live interactive phone preview.

### Non-Goals (v1)
- Multi-user signup, teams, or a public marketplace. Exactly one admin.
- Billing, subscriptions, or on-platform payouts platform. Shop and tip cards link out to Stripe, PayPal, or UPI.
- Native mobile apps. The admin is a responsive web app.

### Branding Note
Match Linktree's layout, spacing, interactions, and feature set, but ship under an original name, logo, colors, and copy. Copying Linktree's name, logo, icons, or exact brand assets invites trademark issues. Use an original wordmark and open icon sets (e.g., Lucide, Simple Icons).

---

## 2. Users and Roles

| Role | Who | Capabilities |
| :--- | :--- | :--- |
| **Admin (Owner)** | The single account holder | Full control: create, edit, delete trees and cards, view analytics, manage domains, integrations, settings. |
| **Visitor** | Anyone with a tree URL | View page, click cards, subscribe, submit forms, share. No login required. |

*There is no signup flow.* The admin account is created once at install (email + password, optional 2FA), and all visitor routes are public read-only.

---

## 3. Account and Multi-Tree Model

One admin account owns many trees. A tree represents one business page: its own URL, cards, design, analytics, SEO, domain, and integrations. Nothing is shared between trees except the admin login.

- **Create Tree:** Name, URL slug (`/your-slug`), optional template, optional duplicate of an existing tree.
- **Tree Switcher:** Dropdown in the admin top bar, plus a trees grid on the home screen with thumbnail, slug, status, and 30-day views.
- **Per Tree Operations:** Publish or unpublish, archive, duplicate, delete (soft delete with 30-day restore), custom domain, and QR code.
- **Slugs:** Unique, lowercase, 3–30 characters, reserved words blocked (`admin`, `api`, `login`, `static`, etc.).
- **Limits:** None enforced. Soft warning above 50 trees for performance monitoring.

---

## 4. Cards and Block Types

Every item on a tree is a card (links/blocks). All card types below ship in v1.

### Common Card Properties
- Title, optional thumbnail or icon
- Drag to reorder
- Show/hide toggle
- Scheduling (start and end datetime with timezone)
- Priority animation (shake, wobble, pulse)
- Sensitive-content gate
- Lock mechanism (age gate, email gate, or access code)
- Duplicate, delete (with 10-second undo toast)
- Per-card click analytics

### Card Types & Behaviors

| Card Type | Behavior | Key Settings |
| :--- | :--- | :--- |
| **Link** | Opens a URL | Title, URL, thumbnail, layout (classic or featured large) |
| **Header** | Section title or divider | Text, alignment |
| **Social Icons** | Row of platform icons | Platform + handle, position (top or bottom) |
| **Embedded Video** | YouTube, Vimeo, TikTok inline player | URL, autoplay off, thumbnail |
| **Music** | Spotify, Apple Music, SoundCloud, Bandcamp embed | URL, compact or full player |
| **Podcast** | Episode list or player | RSS or platform URL |
| **Image or Gallery** | Single image or carousel | Upload, alt text, link-out |
| **Email Signup** | Collects email | Fields, consent text, destination (CSV or integration) |
| **Contact Form** | Name, email, message | Fields, recipient inbox, spam check (honeypot/rate limit) |
| **Text Block** | Rich text | Bold, links, lists |
| **Shop / Product** | Product card with price and buy link | Image, price, currency, checkout URL |
| **Tip Jar / Donations** | Preset amounts with out-link | Amounts, provider (Stripe, PayPal, UPI) |
| **Events** | List of dated events with ticket links | Date, venue, link, auto-hide when past |
| **Booking** | Calendly or Cal.com embed | URL |
| **Collapsible Group** | Accordion that holds other cards | Title, default open toggle |
| **Map** | Location embed | Address, pin |
| **Phone / WhatsApp / Email** | Tap-to-contact | Number or address, prefilled message |
| **App Download** | Smart link to App Store or Play Store | Both URLs, auto-detects device |
| **Custom HTML or Embed** | Sandboxed iframe | Code, height |
| **Share Button** | Native share sheet | None |

### Card Actions in the Editor
- Add card (type picker modal)
- Drag handle for reordering
- Inline title edit
- Quick visibility toggle
- Thumbnail picker / icon selector
- Layout switch
- Schedule & lock settings
- Animation trigger
- Card stats quick modal
- Delete with 10-second undo toast

---

## 5. Design and Appearance

All Pro design controls are unlocked by default. Changes preview live in the phone frame and autosave.

| Area | Options |
| :--- | :--- |
| **Themes** | 20+ prebuilt themes plus custom theme saved per tree |
| **Profile** | Avatar (circle, rounded, square, none), title, bio (up to 160 characters), verified-style badge (toggleable) |
| **Background** | Solid color, gradient (angle + stops), image upload, video loop, animated patterns, blur and overlay |
| **Buttons** | Fill, outline, soft shadow, hard shadow; corner radius slider (square to pill); color, text color, border |
| **Fonts** | Google Fonts picker (headings and body), size scale, weight |
| **Layout** | Classic stack, grid for products, featured card first |
| **Header** | Centered or left, cover banner, logo mode |
| **Footer** | Hide platform badge toggle, custom footer text |
| **Dark Mode** | Per-tree setting: auto (system), force light, or force dark |
| **Custom CSS** | Advanced editor, scoped to the specific tree |

**Defaults:** New trees start with a clean neutral light theme and rounded-pill button style matching the modern link-in-bio aesthetic.

---

## 6. Public Page UX

Single centered column, mobile-first, responsive from 320px up to 680px max width on desktop.

1. **Top Section:** Optional cover banner, avatar, title, bio, verified badge, top social icon row.
2. **Body:** Cards rendered in admin-specified order, full-width buttons or rich blocks. Headers divide sections.
3. **Footer:** Bottom social icons (optional), share button, and optional custom footer text.

### Interactions
- Card tap opens link in same tab or new tab (configurable). Micro-interactions: active press state and hover lift.
- Priority-animated cards trigger shake, wobble, or pulse on periodic interval.
- Locked cards display gate modal (age verification, email collector, or passcode prompt) before granting access.
- Lazy-load embeds; video players never autoplay with audio.
- Share sheet opens modal with copy link, QR code, and Web Share API.
- Email and contact forms validate inline with immediate success/confirmation states.

### States
- Loading skeleton
- Tree unpublished (friendly 404 screen)
- Tree empty (placeholder message)
- Card scheduled out (hidden automatically)
- Broken link flag (renders gracefully, flagged in admin diagnostics)

### Visitor Tracking
- First-party, cookieless by default.
- Tracks page views, unique visitors, link clicks, referrer, country/city, device category, browser.
- IP addresses hashed with salt, never stored in raw form.

---

## 7. Admin Dashboard UX

| Screen | Purpose |
| :--- | :--- |
| **Login** | Email + password, optional 2FA (TOTP), session timeout handling |
| **Trees Home** | Grid/list of all trees with views, clicks, status, quick actions, "New Tree" button |
| **Editor (Links Tab)** | Two-pane view: card list with dnd-kit drag-reorder, Add Card modal, inline edits; sticky live interactive phone preview on right |
| **Design Tab** | Real-time appearance controls (themes, background, buttons, fonts, header, CSS) |
| **Analytics Tab** | Date range picker, charts (views, clicks, CTR), referrer breakdown, geographic maps, top cards |
| **Audience Tab** | Collected emails, contact form submissions, export to CSV |
| **Settings Tab** | Slug, custom domain, SEO meta tags, tracking pixels, integrations, QR code generator, danger zone |

### Editor Behavior
- Desktop: Split two-pane layout (controls left, phone preview right).
- Mobile: Single column with a floating preview toggle button.
- Autosave with visible sync indicator ("Saved" / "Saving...").
- Share button to copy live URL or test in new tab.
- Undo toast for accidental card deletions.
- Keyboard navigation and shortcut support.

---

## 8. Pro Features (All Included)

1. **Comprehensive Analytics:** Views, unique visitors, total clicks, CTR, per-card performance, referrers, geographic data, device & browser breakdowns, custom date ranges, CSV export.
2. **Scheduling:** Precise start/end scheduling per card with timezone support.
3. **Custom Domains:** Connect custom subdomains (e.g., `links.yourbrand.com`), automatic SSL certificate issuance and DNS status validation.
4. **SEO & Metadata:** Page title, meta description, Open Graph / Twitter image preview, canonical URL, noindex toggle, auto-generated sitemaps.
5. **Tracking Pixels:** Meta (Facebook) Pixel, Google Analytics 4, Google Tag Manager, TikTok Pixel per tree.
6. **Integrations:** Mailchimp, Klaviyo, ConvertKit, Google Sheets, Zapier webhooks for form and email card submissions.
7. **Commerce & Monetization:** Product cards with price tags and direct checkout links; tip jars with preset amounts linking out to Stripe, PayPal, or UPI.
8. **Access Locks:** Gate specific links with age verification, email capture, or passcode.
9. **Dynamic QR Codes:** Downloadable PNG and SVG vector QR codes with custom colors and logo embedding.
10. **Branding Removal:** Complete white-label support; platform badge hidden by default.
11. **Tree Backup & Portability:** Full tree export and import as standardized JSON.

---

## 9. Data Model

### Entities & Attributes
- **Admin:** `id`, `email`, `password_hash`, `two_factor_secret`, `two_factor_enabled`, `created_at`, `updated_at`
- **Tree:** `id`, `admin_id`, `name`, `slug`, `status` (draft, live, archived), `theme_id`, `seo_title`, `seo_description`, `og_image_url`, `noindex`, `custom_domain`, `custom_domain_verified`, `pixels` (JSON), `deleted_at`, `created_at`, `updated_at`
- **Card:** `id`, `tree_id`, `type`, `title`, `url`, `thumbnail_url`, `position`, `visible`, `start_at`, `end_at`, `lock_type`, `lock_value`, `animation`, `settings` (JSON per type), `created_at`, `updated_at`
- **Theme:** `id`, `tree_id`, `name`, `background_type`, `background_value`, `button_style`, `button_color`, `button_text_color`, `button_radius`, `font_family`, `text_color`, `custom_css`, `created_at`, `updated_at`
- **Subscriber:** `id`, `tree_id`, `card_id`, `email`, `consent_given`, `created_at`
- **Submission:** `id`, `tree_id`, `card_id`, `data` (JSON), `created_at`
- **Event (Analytics):** `id`, `tree_id`, `card_id` (nullable), `event_type` (`view` or `click`), `referrer`, `country`, `city`, `device`, `browser`, `session_hash`, `created_at`
- **AnalyticsSummary:** `id`, `tree_id`, `date`, `total_views`, `unique_visitors`, `total_clicks`
- **Integration:** `id`, `tree_id`, `provider`, `credentials_encrypted`, `status`, `created_at`, `updated_at`
- **Asset:** `id`, `tree_id`, `file_url`, `file_type`, `file_size`, `created_at`

---

## 10. Architecture & Tech Stack

- **Frontend:** React (JavaScript / JSX) with Tailwind CSS:
  - **Component Format:** React `.jsx` (JavaScript, no TypeScript)
  - **Styling:** Tailwind CSS
  - **Icons:** Lucide Icons (`lucide-react`)
  - **State & Interactions:** React Hooks & Drag-and-Drop
  - **Public Pages & Phone Preview:** Responsive live phone simulation matching Linktree's exact UI
  - **Admin Dashboard:** Pixel-close recreation of Linktree's two-pane dashboard and multi-tree switcher
- **Backend:** Node.js (JavaScript / Express):
  - **API Format:** REST API with JSON responses
  - **Authentication:** Single-admin session cookies, password hashing
- **Database:** PostgreSQL / SQL database with Drizzle ORM
- **Deployment:** Docker container / Node.js service

---

## 11. Non-Functional Requirements (NFR)

- **Performance:** Public page LCP < 1.5s on 4G, bundle < 100 KB JS, Lighthouse score 95+.
- **Editor Latency:** Live phone preview reflects updates in < 200ms; autosaves within 1s.
- **Availability:** 99.9% uptime for public link pages.
- **Security:** Strict HTTPS, CSRF mitigation, brute-force rate limits on login/forms, sandboxed iframe embeds, input sanitization.
- **Privacy:** Cookieless analytics by default, salted hash IP storage, GDPR-compliant subscriber export and wipe.
- **Accessibility:** WCAG 2.1 AA compliant, full keyboard navigable, minimum 4.5:1 color contrast ratio.
- **Responsiveness:** Flawless rendering from 320px to 4K displays.
- **Scale:** Engineered to handle 100+ business trees and 1M+ monthly visits on a lightweight host.

---

## 12. Milestones

1. **Phase 1: Core Foundation (Weeks 1–3)**
   - Setup project, database schema, and admin authentication.
   - Multi-tree management (CRUD, tree switcher, slugs).
   - Core cards: Link, Header, Social Icons.
   - Public page rendering & live preview synchronization.
2. **Phase 2: Comprehensive Cards & Design (Weeks 4–6)**
   - All 20 card types (media embeds, commerce out-links, forms, booking, etc.).
   - Full appearance controls: 20+ preset themes, custom color/font picker, background effects.
   - File upload handling for avatars and thumbnails.
3. **Phase 3: Pro Capabilities (Weeks 7–9)**
   - Real-time cookieless analytics engine & dashboard charts.
   - Scheduling engine (timezone-aware auto show/hide).
   - Link locks (age, email, passcode).
   - SEO settings, Open Graph generator, tracking pixels, QR codes.
4. **Phase 4: Integrations & Custom Domains (Weeks 10–11)**
   - Custom domain verification & proxy routing.
   - Webhooks, Zapier, Google Sheets, Mailchimp, Klaviyo.
   - Tree import/export (JSON backups).
5. **Phase 5: Production Polish & Launch (Week 12)**
   - WCAG 2.1 AA accessibility audit.
   - Lighthouse 95+ optimization pass.
   - Edge caching and resilience testing.

