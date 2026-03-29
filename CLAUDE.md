# CLAUDE.md — willt.ai

Personal website for Will Tai. A single-page digital business card with a Stripe-inspired design.

**Repo:** [github.com/willtai/willt.ai](https://github.com/willtai/willt.ai)

## Stack
- **Astro 5** — static site, zero JS shipped by default
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
  scripts/              — Vanilla TS (scroll reveal, copy-to-clipboard, nav, aurora)
  styles/global.css     — Tailwind v4, CSS custom properties, animations
  pages/index.astro     — Composes all sections
tests/
  data.test.ts          — Content data validation
  build.test.ts         — Build output integration tests
public/
  images/companies/     — Company logo SVGs (Meta, Neo4j, TrueLayer, Converge, Alpha-i, Cambridge)
```

## Design
- Stripe-inspired with green accent colour
- Inter font throughout
- Northern lights aurora background effect (`aurora.ts`)
- Gradient fade transitions between sections
- Floating nav with scroll spy
- British dry wit in copy, no hyphens (commas instead)
- Zero JS shipped by default, tiny scripts inlined where needed
- Whitespace is the feature

## Deployment
Vercel with `willt.ai` custom domain. Auto-deploys from `main`.

## Guardrails
- No `any` types in TypeScript
- All content changes go through `src/data/site.ts`
- Email is obfuscated — never plaintext in the HTML body
- Company logos are SVGs in `public/images/companies/`
- Keep it minimal. When in doubt, leave it out.
