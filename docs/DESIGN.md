# DESIGN.md

Goal: familiar link-in-bio feel (centered column, big rounded buttons, clean admin with live phone preview) under our own branding. Do not use Linktree's name, logo, icons or copy.

## Tokens (admin UI)
- Font: Inter (UI), system fallback
- Icons: Lucide Icons (`lucide-react`) for all UI indicators and card type pickers
- Radius: 8px inputs, 12px cards, 999px pills
- Spacing scale: 4, 8, 12, 16, 24, 32, 48
- Colors (light):
  - bg `#FFFFFF`, surface `#F6F6F7`, border `#E4E4E7`
  - text `#111111`, muted `#6B6B73`
  - primary `#5B3DF5`, primary-hover `#4A2FD6`
  - success `#16A34A`, danger `#DC2626`, warning `#D97706`
- Dark mode: bg `#0B0B0D`, surface `#16161A`, border `#26262C`, text `#F4F4F5`
- Shadows: sm `0 1px 2px rgba(0,0,0,.06)`, md `0 4px 12px rgba(0,0,0,.08)`

## Public page
- Single centered column, max width 680px, side padding 16px
- Order: cover (optional) > avatar > title > bio > social icons > cards > footer
- Avatar 96px circle by default (options: rounded, square, none)
- Title 22px semibold, bio 15px muted, centered
- Card button: full width, min height 56px, 16px gap between cards, default pill radius
- Hover lift 2px, press scale 0.98, 150ms ease
- Featured card: 16:9 thumbnail on top, title below
- Thumbnail on classic card: 40px square, left aligned inside the button
- Priority animation: shake, wobble or pulse every 4s

## Theme controls (per tree)
Background (solid, gradient, image, video, pattern), button style (fill, outline, soft shadow, hard shadow), radius slider, colors, Google Fonts for heading and body, dark mode (auto, light, dark), custom CSS.
Default theme: light, white background, black pill buttons.

## Admin layout
- Top bar: logo, tree switcher, Share button, avatar menu
- Tabs: Links, Design, Analytics, Audience, Settings
- Desktop: card list (left, ~60%) and sticky phone preview (right, ~40%, 360px frame)
- Mobile: single column with a Preview toggle
- Card row: drag handle, thumbnail, title (inline edit), URL, toggle, schedule, lock, animate, stats, delete
- Add card: full-width primary button opens a type picker modal with search

## Components
Button, Input, Select, Toggle, Modal, Tabs, Toast, Dropdown, ColorPicker, FontPicker, ImageUploader, Chart (line, bar), Table, EmptyState, Skeleton.

## States
Every screen needs loading (skeleton), empty (helpful message + action), error (retry) and saved indicator. Undo toast for 10 seconds after deleting a card.

## Accessibility
Visible focus ring (2px primary), 4.5:1 contrast minimum (warn in the theme editor if violated), keyboard reorder for cards, alt text required for images, respect `prefers-reduced-motion`.

