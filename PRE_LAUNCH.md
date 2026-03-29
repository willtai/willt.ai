# Pre-Launch Checklist — willt.ai

## Content
- [x] Replace profile photo (`public/images/will.jpg`) with preferred image
- [x] Replace placeholder company logos with official brand assets (Meta SVG official, Neo4j/TrueLayer/Converge/Alpha-i from old repo, Cambridge official crest)
- [x] Confirm email address is correct and obfuscated
- [ ] Review hero tagline copy
- [ ] Review Worduel project description
- [ ] Verify all external links work (Meta, Neo4j, TrueLayer, Converge, npm, GitHub)

## Design
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1024px+)
- [ ] Check scroll reveal animations are smooth, not janky
- [x] Copy-to-clipboard + mailto works
- [x] Floating nav with scroll spy highlights active section

## Technical
- [x] `npm run build` passes with zero errors
- [x] `npm test` — all 27/27 pass
- [x] JSON-LD structured data implemented with rich CV content
- [x] Open Graph + Twitter Card tags present
- [x] Sitemap generates at build time
- [ ] JSON-LD validates at https://validator.schema.org
- [ ] Lighthouse score 95+ across all categories
- [ ] Test on slow connection (Chrome DevTools > Network > Slow 3G)
- [ ] Generate OG image (1200x630px) for social sharing previews (currently missing)

## Deployment
- [ ] Push to `main` on github.com/willtai/willt.ai
- [ ] Connect repo to Vercel
- [ ] Configure `willt.ai` custom domain in Vercel
- [ ] Update DNS: CNAME `willt.ai` -> `cname.vercel-dns.com`
- [ ] Verify HTTPS works on willt.ai
- [ ] Test live site loads correctly

## Post-Launch
- [ ] Check OG preview on X/LinkedIn/Slack
- [ ] Monitor Vercel analytics for first 24h
