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
