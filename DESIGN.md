# Murmuration

## Concept
The design should feel calm and grounded in nature, with sunrise and sunset light. Typography stays still; the murmuration provides the primary movement. Avoid blinking cursors and terminal-style decoration.

One dusk sky over a reedbed spans the page. A perspective starling flock flies behind feathered haze panels; near birds pass in front of the hero name.

## Palette
Dusk sky stops: #5d6b88, #a395ab, #dcae9f, #f1c899, #f7dcb4. Sun glow: #ffe4b0. Ink: #1c1826; secondary text: #463c4f. Panels: rgba(251, 242, 234, 0.8), with 12px backdrop blur.

Dark mode starts at blue hour: sky #1b2140 to #b97a6a; text #f4ede8 and #cdc1ca; panels rgba(22, 20, 38, 0.66).

## Type
Cormorant Garamond 500/600 for the name, section headings and project title. Geist for body text and controls. Sentence case.

## Layout
The hero fills the first screen up to 62.5rem, with content bottom-left above the reeds. A frosted navigation pill sits top-right. Experience sits left (up to 760px / 62vw), Projects right (580px / 50vw), and Contact left of centre (640px / 58vw), with 14rem gaps.

At 720px and below, navigation is centred, panels fill the width with 22px feathering, and gaps are 7rem. Links and buttons have visible keyboard focus; navigation exposes aria-current, canvases are aria-hidden, and the copy toast is aria-live.

## Flock
`src/scripts/main.ts` is the single script entry, importing navigation, email copying and `murmuration.ts`.

The simulation uses 3D boids, separation and up to seven nearest neighbours within the search radius for alignment and cohesion. Groups follow wandering attractors and swirl; occasional group transfers split and merge flocks. A falcon periodically crosses the largest flock.

Bird bodies and jointed wings orient along velocity, bank into turns and alternate flap bursts with glides. Perspective projection and six depth buckets provide size and haze cues. Birds lift off from reeds on load. Pointer movement repels them; clicks and taps startle them.

Scroll darkens the sky and reveals stars. Near the bottom, birds roost; scrolling back up releases them. Reduced motion renders one still frame, disables smooth scrolling.

Performance: one continuous animation loop, typed arrays, a counting-sort uniform grid, cached sky, batched bird paths, device pixel ratio capped at 2 and canvas backing area targeted at 5.5M pixels. Automatic flock size scales with viewport area up to 650. Animation pauses in hidden tabs.

## Do not change
Keep `src/data/site.ts`, visible copy, public assets, sitemap integration and all head metadata unchanged. The complete Person JSON-LD, including its email and detailed profile fields, is intentional. Email in the body remains split into user/domain attributes; the button copies it, shows the toast and opens mailto.
