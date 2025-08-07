# Sea Here 🐠

Offline-first Seattle Aquarium companion: tap drifting pixel critters → quick facts. Accessible, fast, kid-friendly.

**Status:** MVP UI shipped (Home → Info Card → Deeper Dive).  
Camera/classifier: **planned**, interface documented.

## Features
- Tap critters → Info Card (name, badge, 3 bullets, images, TTS toggle)
- Deeper Dive: population chart with zoom/reset + fallback
- List & Search (local fuzzy), tabbed nav
- Offline core: 7 species preloaded; cache with TTL + ETag

## Stack
React + Vite + TypeScript • Tailwind • React Router • Recharts  
IndexedDB cache • Vitest/RTL • Playwright • GitHub Actions • Vercel

## Quick Start
```bash
pnpm i
pnpm dev      # run app
pnpm test     # unit
pnpm e2e      # playwright (first time: npx playwright install)

Scripts
dev • build • preview • typecheck • lint • format • test • e2e

Notes
- A11y: landmarks, aria-live, labeled controls, keyboard-safe modals
- Data flow: UI → repository → (cache → API → preload fallback)

Roadmap
- Camera view + classifier (≥0.85 threshold) + “Did you mean…?” strip
- More conservation data; optional PWA hardening

AI & Prompting
- Planned/built with Windsurf, ChatGPT (o3, o4 mini-high), Claude Sonnet 4 using a 22-step TDD roadmap.

License
MIT (update as needed).