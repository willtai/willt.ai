# CLAUDE.md — willt.ai

Personal website for Will Tai. A single-page digital business card with an editorial design.

**Repo:** [github.com/willtai/willt.ai](https://github.com/willtai/willt.ai)

## Stack
- **Astro 6** — static site, zero JS shipped by default
- **Tailwind CSS v4** — utility-first styling via `@tailwindcss/vite`
- **TypeScript** — strict mode
- **Vitest** — 27 unit/integration tests
- **Docker Compose** — containerised local dev environment

## Quick Start
```bash
docker compose up        # Dev server at localhost:4321 (hot reload)
```

## Commands (inside container or with Node installed)
```bash
npm run dev              # Dev server (localhost:4321)
npm run build            # Production build (dist/)
npm run preview          # Preview production build
npm test                 # Run all tests (vitest, 27 tests)
npm run test:coverage    # Tests with coverage report
```

## Architecture
Single-page scroll site. All content lives in `src/data/site.ts`.

```
src/
  data/site.ts          — All typed content (experience, projects, socials)
  layouts/Layout.astro  — Base HTML, fonts, meta, JSON-LD
  components/           — Astro components (Hero, Experience, Projects, Contact, Nav)
  scripts/              — main.ts entry, murmuration.ts flock, nav.ts, copy-email.ts
  styles/global.css     — Tailwind v4, CSS custom properties, animations
  pages/index.astro     — Composes all sections
tests/
  data.test.ts          — Content data validation
  build.test.ts         — Build output integration tests
public/
  images/companies/     — Company logo SVGs (Meta, Neo4j, TrueLayer, Converge, Alpha-i, Cambridge)
```

## Design
- Dusk starling murmuration over reeds, with feathered haze panels
- Cormorant Garamond headings and Geist body text
- One script entry: `src/scripts/main.ts`; flock engine: `src/scripts/murmuration.ts`
- Fixed pill navigation with scroll spy; dark and reduced-motion support
- Content in `src/data/site.ts`, head metadata and JSON-LD intentionally kept unchanged
- See `DESIGN.md` for the current design system

## Deployment
Vercel with `willt.ai` custom domain. Auto-deploys from `main`.

## Guardrails
- No `any` types in TypeScript
- All content changes go through `src/data/site.ts`
- Email is obfuscated — never plaintext in the HTML body
- Company logos are SVGs in `public/images/companies/`
- Keep it minimal. When in doubt, leave it out.
