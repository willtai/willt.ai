# DESIGN.md -- willt.ai Design System

A comprehensive reference for the visual identity, colour system, typography, animation architecture, and component patterns used on [willt.ai](https://willt.ai). Written to be verbose enough that a developer or AI assistant can faithfully recreate this aesthetic in a new project without ever seeing the original site.

---

## 1. Visual Identity

### Overall Aesthetic

The site draws from two distinct visual traditions and fuses them into something singular:

**Stripe's editorial clarity.** The layout borrows Stripe's philosophy of generous whitespace, a narrow content column, small uppercase section labels, and transitions so smooth they feel hydraulic. Every interactive element has a 0.28-second ease transition -- the exact timing that feels "expensive" without feeling sluggish. Cards lift on hover. Links grow underlines from left to right. Nothing snaps; everything glides.

**Northern lights over a dark forest.** Where Stripe uses indigo-to-purple gradients, this site uses an exclusively green palette that evokes the aurora borealis seen through pine trees. The dark sections feel like standing in a clearing at night watching curtains of emerald light drift across the sky. The light sections feel like the next morning -- crisp, white, with faint traces of green still caught in the atmosphere.

The result is a site that communicates technical sophistication (the Stripe DNA) and natural beauty (the aurora DNA) simultaneously. It feels like a senior engineer's personal site should: understated, precise, with one striking visual trick that rewards attention.

### Brand Positioning

- **Quiet confidence.** No flashy animations, no scroll-jacking, no particle effects. The aurora is the single dramatic flourish, and it lives behind the content, never competing with it.
- **British dry wit.** The copy uses commas instead of hyphens, avoids exclamation marks, and includes self-deprecating asides ("the occasional side project nobody asked for"). The design supports this tone: nothing is trying too hard.
- **Minimal but rich.** The page is a single scroll with four sections. There are no subpages, no blog, no case studies. But within that constraint, every detail is considered -- the grayscale photo, the blinking cursor, the email obfuscation, the way sections bleed into each other through gradient fades rather than hard edges.

---

## 2. Colour Palette

### CSS Custom Properties (Theme Tokens)

All colours are defined as Tailwind v4 theme tokens in `src/styles/global.css` under the `@theme` block:

| Token             | Hex       | Role                                                                 |
|-------------------|-----------|----------------------------------------------------------------------|
| `--color-bg`      | `#ffffff` | Page background, light section backgrounds                          |
| `--color-fg`      | `#0a2540` | Primary text on light backgrounds (Stripe's signature dark navy)    |
| `--color-muted`   | `#425466` | Secondary text, timestamps, metadata, section labels                |
| `--color-border`  | `#e6ebf1` | Borders, timeline lines, dividers (a cool grey-blue)                |
| `--color-surface` | `#ffffff` | Card backgrounds on light sections                                  |
| `--color-accent`  | `#2d5a3d` | Primary brand green -- timeline dots, "current" badges, CTA accents |
| `--color-dark`    | `#0c1f17` | Dark section backgrounds (near-black forest green)                  |
| `--color-dark-lighter` | `#163026` | Reserved for dark section variants (slightly lifted dark green) |
| `--color-glow`    | `#34d399` | Emerald glow -- link text on dark, hover glows, gradient highlights |
| `--color-teal`    | `#0d9488` | Teal accent -- used in gradients, glow effects, aurora layers       |
| `--color-celadon` | `#ACE1AF` | Soft pastel green -- current item highlight, light aurora touches   |

### The Green Spectrum

The palette spans the full green spectrum from near-black to near-white:

```
#0c1f17  Dark (background)      -- The night sky
#163026  Dark Lighter            -- Lifted dark, nav background tint
#1a3a2a  Dark Forest (aurora)    -- Deep anchor colour in aurora gradients
#2d5a3d  Accent                  -- The "brand" green, used for active states
#87AE73  Sage (aurora)           -- Warm mid-tone, organic and mossy
#50C878  Emerald (aurora)        -- Classic bright emerald, aurora highlight
#34d399  Glow                    -- Electric emerald, links and glow effects
#0d9488  Teal                    -- Cool teal-green, aurora edge colour
#2DD4BF  Teal-green (aurora)     -- Bright teal, used in aurora flicker layer
#ACE1AF  Celadon                 -- Pale pastel green, highlight backgrounds
```

### Selection Colour

Text selection uses `--color-accent` (`#2d5a3d`) as the background with white text. This is a subtle brand touch -- every time a user selects text, they see the brand green.

### Dark Section Colour Usage

Dark sections (Hero, Projects, Footer) use:
- Background: `--color-dark` (`#0c1f17`)
- Primary text: `text-white`
- Secondary text: `text-white/60` (60% opacity white)
- Tertiary text: `text-white/50` (50% opacity white)
- Section labels: `text-white/40` (40% opacity white)
- Card backgrounds: `rgba(255, 255, 255, 0.06)` (frosted glass)
- Link text: `#34d399` (glow green)
- Social pill buttons: `bg-white/[0.06]` idle, `bg-white/[0.12]` hover

### Light Section Colour Usage

Light sections (Experience, Contact) use:
- Background: `bg-white`
- Primary text: `--color-fg` (`#0a2540`)
- Secondary text: `--color-muted` (`#425466`)
- Section labels: `--color-muted` with `uppercase tracking-widest`
- Card backgrounds: `#ffffff` with subtle shadow
- Active/hover accents: `--color-accent` (`#2d5a3d`)
- Social pill buttons: `bg-[var(--color-fg)]/[0.04]` idle, `bg-[var(--color-fg)]/[0.08]` hover

---

## 3. Typography

### Font Choice: Inter

The site uses [Inter](https://fonts.google.com/specimen/Inter), loaded from Google Fonts with weights 400, 500, 600, and 700. Inter was chosen because:

1. **It is Stripe's font.** This immediately places the site in the same visual lineage as Stripe, Linear, Vercel, and other developer-focused companies that use Inter. It signals "I build things" without being as overused as system fonts.
2. **Exceptional legibility at small sizes.** Section labels at `text-xs` with `tracking-widest` remain perfectly crisp.
3. **Clean geometric forms.** The letterforms are precise without being cold -- they match the "engineer with taste" positioning.

The font stack falls back gracefully: `"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif`.

### Font Smoothing

Both `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` are applied globally, giving text a slightly thinner, sharper appearance that looks more refined on retina displays.

### Size Scale

| Context                        | Tailwind Class  | Approx Size | Notes                                    |
|--------------------------------|-----------------|-------------|------------------------------------------|
| Hero name                      | `text-4xl sm:text-5xl` | 36px / 48px | Bold, tight tracking (`tracking-tight`) |
| Section headings               | `text-sm`       | 14px        | Uppercase, `tracking-widest`, muted colour |
| Card titles (dark)             | `text-base`     | 16px        | `font-semibold`, white                   |
| Card titles (light)            | `text-base`     | 16px        | `font-medium`, fg colour                 |
| Body / descriptions            | `text-base`     | 16px        | Normal weight, `leading-relaxed`         |
| Metadata / secondary           | `text-sm`       | 14px        | Muted colour                             |
| Links / labels                 | `text-sm`       | 14px        | `font-medium`                            |
| Navigation links               | `text-xs`       | 12px        | `font-medium`                            |
| Badges ("current")             | `text-xs`       | 12px        | `font-medium`, accent colour             |
| Footer copyright               | `text-xs`       | 12px        | `text-white/40`                          |

### Weight Usage Pattern

| Weight | Tailwind     | Where Used                                           |
|--------|--------------|------------------------------------------------------|
| 400    | (default)    | Body text, descriptions, taglines                    |
| 500    | `font-medium`| Card titles on light bg, links, nav items, badges, social pills |
| 600    | `font-semibold` | Card titles on dark bg (projects)                 |
| 700    | `font-bold`  | Hero name only                                       |

The pattern: **bold is reserved for the hero name.** Everything else uses medium or semibold. This hierarchy ensures the hero name commands immediate attention, and nothing else in the page competes with it.

### Line Height

The global `line-height: 1.6` is applied to the body. Individual text blocks add `leading-relaxed` (1.625) for descriptions. The hero tagline uses this for comfortable reading on its narrow column.

---

## 4. Aurora Animation System

The northern lights effect is the single most distinctive visual feature of the site. It runs on dark sections (Hero, Projects) using a custom TypeScript animation system in `src/scripts/aurora.ts`.

### How It Works

The aurora is built from **3 layers of oversized gradient elements** stacked inside each `.gradient-mesh` container. Each layer is an absolutely-positioned `<div>` extending 40% beyond the container bounds in every direction (`inset: -40%`), filled with 3 radial gradients using the green colour palette. The layers are animated independently via `requestAnimationFrame`, with each layer's position, scale, rotation, and opacity driven by **4 sine waves per axis**.

### The Mathematical Foundation

The animation frequencies use four mathematical constants as multipliers:

| Constant | Value    | Symbol | Why It Matters                                   |
|----------|----------|--------|--------------------------------------------------|
| Phi      | 1.61803  | phi    | The golden ratio -- the most irrational number   |
| sqrt(2)  | 1.41421  | sqrt2  | Irrational, incommensurate with phi              |
| sqrt(3)  | 1.73205  | sqrt3  | Irrational, incommensurate with both phi and sqrt2 |
| Pi       | 3.14159  | pi     | Transcendental, incommensurate with all algebraics |

These constants are **mutually irrational** -- no ratio between any two is a rational number. This is the mathematical guarantee that the animation **never repeats**. When you combine sine waves whose frequencies are mutually irrational, the resulting waveform is quasi-periodic: it comes arbitrarily close to any previous state but never exactly returns to it. This is the same mathematical principle behind the visual complexity of real aurora borealis.

Each layer has:
- **4 X-axis oscillators**: `sin(t * freq + phase) * amplitude`, summed together
- **4 Y-axis oscillators**: Same structure, different frequencies/phases/amplitudes
- **1 scale oscillator**: Breathing effect, subtle (0.04-0.08 range)
- **1 rotation oscillator**: Gentle tilt (1-2 degrees)
- **1 opacity oscillator**: Fade in/out independently

The base frequencies are tiny (0.0002-0.0012 range), meaning one full cycle takes thousands of frames. Multiplied by the irrational constants, the combined frequencies ensure each layer drifts on its own unique timeline.

### 3-Layer Architecture

**Layer 1 -- Base Curtain (slow, massive sweeps)**
- Lowest frequencies (0.0004 base range)
- Largest amplitudes (18% X, 15% Y maximum)
- Highest opacity base (0.6, range 0.4)
- Gradients: Dark forest anchor (`rgba(26, 58, 42, 0.5)`), emerald highlight (`rgba(80, 200, 120, 0.45)`), teal edge (`rgba(45, 212, 191, 0.3)`)
- This creates the broad, slow-moving curtains that define the aurora's overall shape

**Layer 2 -- Shimmer (medium speed, lateral drift)**
- Medium frequencies (0.0006 base range)
- Medium amplitudes (22% X, 18% Y maximum)
- Medium opacity base (0.5, range 0.5)
- Gradients: Celadon (`rgba(172, 225, 175, 0.35)`), sage (`rgba(135, 174, 115, 0.4)`), emerald (`rgba(80, 200, 120, 0.3)`)
- This adds lateral shimmer and colour variation, drifting across the base curtain

**Layer 3 -- Flickers (fast, small movements)**
- Highest frequencies (0.0009 base range)
- Smallest amplitudes (10% X, 12% Y maximum)
- Lowest opacity base (0.4, range 0.6) -- widest fade range
- Gradients: Glow emerald (`rgba(52, 211, 153, 0.4)`), teal-green (`rgba(45, 212, 191, 0.35)`), celadon (`rgba(172, 225, 175, 0.3)`)
- This provides quick, flickering highlights that dance across the slower layers

### Aurora Gradient Colour Palette

The five greens used across the three layers, and their approximate roles:

| Name        | RGBA                          | Character                              |
|-------------|-------------------------------|----------------------------------------|
| Dark Forest | `rgba(26, 58, 42, 0.5)`      | Deep anchor, provides depth            |
| Emerald     | `rgba(80, 200, 120, 0.45)`   | Bright mid-tone, primary aurora colour |
| Celadon     | `rgba(172, 225, 175, 0.35)`  | Light, airy, creates soft glow areas   |
| Teal-green  | `rgba(45, 212, 191, 0.3)`    | Cool edge, adds colour temperature variety |
| Sage        | `rgba(135, 174, 115, 0.4)`   | Warm mid-tone, organic and mossy feel  |

### CSS Fallback for No-JS

When JavaScript is disabled (or before the aurora script loads), the `.gradient-mesh` element's `::before` and `::after` pseudo-elements provide a static-ish aurora using CSS keyframe animations:

- `::before`: Uses `aurora-1` keyframe (12s, ease-in-out, infinite alternate) -- translates, scales, and rotates with subtle opacity changes
- `::after`: Uses `aurora-2` keyframe (16s, ease-in-out, infinite alternate-reverse) -- translates and scales on a different timing

These use the same gradient colours as the JS layers 1 and 2, so the visual appearance is consistent. When JS loads, the script injects a `<style>` block that sets `animation: none !important` and `opacity: 0 !important` on the pseudo-elements, then creates the 3 JS-driven layers that replace them.

### Performance Notes

- All aurora layers use `will-change: transform, opacity` for GPU compositing
- `pointer-events: none` ensures aurora elements never intercept clicks
- `requestAnimationFrame` ensures animation is synced to the display refresh rate
- The oversized `inset: -40%` prevents visible edges during large translations

---

## 5. Section Transitions

### The Gradient Fade Technique

Sections do not use SVG wave dividers, clip-paths, or any structural shape between them. Instead, they use **absolute-positioned gradient overlays** that create a smooth colour bleed from one section's background into the next.

The pattern is a `<div>` positioned at the bottom (or top) of a section with these classes:
```
absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[TARGET_COLOUR] pointer-events-none z-10
```

### The from-transparent-to-X Pattern

The critical insight is that the gradient always starts from `transparent` and ends at the **exact background colour of the adjacent section**. This prevents colour mismatch or visible seams:

| Transition                | Location           | Gradient                                                |
|---------------------------|--------------------|---------------------------------------------------------|
| Hero (dark) -> Experience (white) | Bottom of Hero   | `from-transparent to-white`                            |
| Experience (white) -> Projects (dark) | Bottom of Experience | `from-transparent to-[var(--color-dark)]`          |
| Projects (dark) -> Contact (white) | Bottom of Projects | `from-transparent to-white`                          |
| Contact (white) -> Projects (dark) | Top of Contact     | `from-[var(--color-dark)] to-transparent`            |

Note how some sections have fades at **both** ends. The Projects section has a `from-white to-transparent` fade at the top (blending with Experience above) and a `from-transparent to-white` fade at the bottom (blending with Contact below). The Contact section also has a `from-[var(--color-dark)] to-transparent` fade at its top.

### Why This Works Better Than SVG Waves

1. **No colour mismatch.** SVG waves require exact colour matching between the wave fill and the section background. With CSS custom properties and aurora animations changing the perceived colour, this is fragile. Gradient fades are mathematically guaranteed to match because they start from the section's own background.
2. **No layout complexity.** SVG waves need precise height calculations and responsive sizing. A `h-32` gradient just works.
3. **Aurora bleeds through.** Because the gradient goes to `transparent`, the aurora animation from the dark section partially bleeds into the transition zone, creating a natural "atmosphere" effect.
4. **z-index layering.** The fades use `z-10`, which sits above the aurora layers (`z-0`) but below the content (`z-10` on the content wrapper).

### Section Padding for Transition Space

Sections that receive a fade from the previous section add extra top padding (`pt-36`) to create breathing room beneath the gradient overlay. This ensures content doesn't start until the fade has fully resolved. Standard section padding is `py-28` with `pb-36` when there's a bottom fade.

---

## 6. Component Patterns

### Dark Sections: Glass Cards with Glow

Used in: **Projects** (and any future dark-background section)

```
Container: bg-[var(--color-dark)] gradient-mesh
Card:      glass-card glow-hover p-6 rounded-2xl
Title:     text-base font-semibold text-white
Body:      text-white/50 leading-relaxed
Links:     text-sm font-medium text-[#34d399] hover:text-white link-underline
```

**Glass card construction:**
- Background: `rgba(255, 255, 255, 0.06)` -- barely visible white tint
- No border (clean, modern)
- Backdrop blur: `blur(16px)` -- frosted glass effect
- Shadow: Multi-layer -- `0 2px 16px rgba(0,0,0,0.15)` for depth, plus `inset 0 0.5px 0 rgba(255,255,255,0.08)` for a faint top highlight that mimics glass refraction
- Hover: lifts 3px, shadow expands to include green glow (`rgba(52, 211, 153, 0.08)` and `rgba(13, 148, 136, 0.06)`)

**Glow hover construction:**
- A `::after` pseudo-element sits behind the card (`z-index: -1`)
- It fills `inset: -1px` with a 135-degree gradient of glow/teal/celadon at 30%/20%/15% opacity
- Blurred by 8px to create a soft radiant halo
- Opacity transitions from 0 to 1 on hover
- Inherits border-radius from parent for shape matching

### Light Sections: Shadow Cards with Lift

Used in: **Experience, Contact**

```
Container: bg-white gradient-mesh-light
Card:      card-light px-6 py-3 rounded-2xl
Title:     text-[var(--color-fg)] font-medium
Body:      text-sm text-[var(--color-muted)]
```

**Light card construction:**
- Background: pure `#ffffff`
- No border (shadow-only depth)
- Shadow: `0 2px 8px rgba(0,0,0,0.04)` -- barely there, just enough to lift off the white background
- Hover: lifts 2px, shadow doubles to `0 4px 16px rgba(0,0,0,0.08)` with a secondary `0 1px 4px rgba(0,0,0,0.04)`

### Light Section Aurora (gradient-mesh-light)

Light sections get their own subtle aurora using `.gradient-mesh-light`:
- `::before`: Very low-opacity green gradients (0.08-0.12 alpha), animated over 20s
- `::after`: Even lower opacity (0.07-0.08 alpha), animated over 14s
- The effect is barely perceptible -- a faint green shimmer that keeps the page feeling alive without competing with content on white

### Timeline Pattern

Used in: **Experience, Education**

Structure:
- A vertical line: `absolute left-0 top-2 bottom-2 w-px bg-[var(--color-border)]`
- Dot markers positioned at `absolute -left-[calc(1rem+5px)] top-5`
- **Current item dot**: `w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] ring-2 ring-white` -- solid accent green with white ring
- **Past item dots**: `w-2.5 h-2.5 rounded-full bg-[var(--color-border)] ring-2 ring-white` -- grey border colour with white ring
- Items use `card-hover` class for subtle lift on hover
- Each item is wrapped in a link (if URL provided) for the entire card to be clickable
- An arrow icon (`opacity-0 group-hover:opacity-100`) appears on hover for linked items

### Highlighting Current Items

The first experience entry (current job) receives special treatment:
- Background tint: `bg-[#ACE1AF]/[0.12]` -- celadon at 12% opacity, creating a barely-there green highlight
- Border: `border border-[#ACE1AF]/25` -- celadon at 25% opacity
- A "current" badge: `text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/[0.08] px-2 py-0.5 rounded-full`
- Timeline dot uses `bg-[var(--color-accent)]` instead of `bg-[var(--color-border)]`

### Social Links as Glass Pill Buttons

**On dark backgrounds (Hero):**
```
px-4 py-1.5 text-sm font-medium text-white/60 hover:text-white
rounded-full bg-white/[0.06] hover:bg-white/[0.12]
backdrop-blur-sm shadow-sm shadow-black/10
transition-all duration-200
```
Frosted glass pills that brighten on hover. The backdrop blur is subtle (`blur-sm`) to maintain readability.

**On light backgrounds (Contact):**
```
px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-accent)]
rounded-full bg-[var(--color-fg)]/[0.04] hover:bg-[var(--color-fg)]/[0.08]
transition-all duration-200
```
Nearly invisible background that darkens on hover, with text shifting from muted grey to accent green.

### Email Obfuscation Pattern

The email address is never rendered in the HTML source. Instead:
- The button stores `data-user="wtaisen"` and `data-domain="gmail.com"` as separate attributes
- JavaScript assembles the email at click time: `` `${user}@${domain}` ``
- On click: copies to clipboard, shows a "copied!" toast (opacity transition), and opens `mailto:` link
- This defeats simple email scrapers while remaining functional for real users

### Navigation

The nav is a **floating pill bar** fixed at the top center of the viewport:
- Hidden initially (`opacity-0 pointer-events-none`)
- Appears after 300px of scroll (`opacity-100 pointer-events-auto`)
- Container: `rounded-full bg-[#0c1f17]/90 backdrop-blur-lg shadow-lg shadow-black/20`
- Links: `px-3 py-1 text-xs font-medium text-white/50 hover:text-white rounded-full`
- Active link: `text-white bg-white/10` (toggled via IntersectionObserver watching sections at 30% threshold)
- Transition: `transition-all duration-300` for smooth fade in/out

### Hero Section

- Minimum height: `min-h-[90vh]` -- nearly full viewport
- Layout: flex-centered, with photo and text side-by-side on desktop, stacked on mobile
- Photo: `w-24 h-24 rounded-full grayscale shadow-lg shadow-black/30` -- greyscale filter keeps the green palette uncontaminated
- Name: `text-4xl sm:text-5xl font-bold tracking-tight text-white` with a blinking cursor (`blink-cursor`) in glow green
- Tagline: `text-base text-white/60 leading-relaxed max-w-md`
- Entrance animation: Staggered fade-up using `.hero-enter` classes with 0.15s delay increments

### Scroll Reveal System

Elements with class `reveal` start at `opacity: 0; transform: translateY(20px)` and transition to `opacity: 1; transform: translateY(0)` when they enter the viewport (10% threshold, -60px bottom margin).

The `.stagger` container applies incremental `transition-delay` to child `.reveal` elements: 0ms, 80ms, 160ms, 240ms, 320ms, 400ms. This creates a cascade effect where items appear one after another.

The IntersectionObserver `unobserve`s each element after it becomes visible, so the animation only fires once.

### Link Underline Animation

The `.link-underline` class creates an animated underline using a `::after` pseudo-element:
- A 1px-tall bar at `bottom: -1px`
- Width starts at 0, transitions to 100% on hover
- Uses `currentColor` so it inherits the link's text colour
- Transition: `width 0.28s ease`

### Text Gradients

Two gradient text utilities for accent headings:

**`.text-gradient`**: glow -> teal -> accent (bright to dark, 135 degrees)
**`.text-gradient-warm`**: glow -> teal -> celadon (bright to bright, warmer feel)

Both use the standard `background-clip: text` + `transparent text-fill-color` technique.

### Button Glow

The `.btn-glow` class adds a green glow shadow to primary CTAs:
- Base: `0 2px 8px rgba(52, 211, 153, 0.2)`
- Hover: lifts 1px, shadow expands to `0 4px 20px rgba(52, 211, 153, 0.35)` plus a wide ambient `0 0 40px rgba(52, 211, 153, 0.1)`

---

## 7. Responsive Approach

### Content Width

All content is constrained to `max-w-2xl` (672px) and centered with `mx-auto`. This creates a single, narrow reading column reminiscent of a well-typeset document. On wide screens, the aurora and dark backgrounds extend to full width while content stays centered, creating a "content in a clearing" effect.

### Section Padding Scale

| Section     | Padding Classes          | Effect                                          |
|-------------|--------------------------|--------------------------------------------------|
| Hero        | `px-6 py-40`             | Generous vertical padding for full-viewport feel |
| Experience  | `px-6 py-28 pb-36`       | Standard vertical, extra bottom for transition   |
| Projects    | `px-6 pt-36 py-28 pb-36` | Extra top for incoming fade, extra bottom for outgoing fade |
| Contact     | `px-6 pt-36 py-28`       | Extra top for incoming fade                      |
| Footer      | `px-6 py-8`              | Compact                                          |

Horizontal padding is consistently `px-6` (24px) across all sections, providing comfortable margins on mobile.

### Breakpoints

The site uses minimal breakpoints:
- `sm:` (640px): Hero name scales from `text-4xl` to `text-5xl`; hero layout shifts from stacked to side-by-side (`flex-col sm:flex-row`)
- No other explicit breakpoints -- the narrow `max-w-2xl` column and flexible padding handle everything else naturally

---

## 8. How to Emulate This in Future Projects

### Step-by-Step Recreation Guide

#### Step 1: Set Up the Colour System

Copy the `@theme` block from `global.css` into your project's CSS. These custom properties form the foundation:

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --color-bg: #ffffff;
  --color-fg: #0a2540;
  --color-muted: #425466;
  --color-border: #e6ebf1;
  --color-surface: #ffffff;
  --color-accent: #2d5a3d;
  --color-dark: #0c1f17;
  --color-dark-lighter: #163026;
  --color-glow: #34d399;
  --color-teal: #0d9488;
  --color-celadon: #ACE1AF;
}
```

For a different colour palette, replace the green spectrum with your chosen hue. The structure should remain:
- One near-black dark (`--color-dark`)
- One deep mid-tone (`--color-accent`)
- One bright mid-tone (`--color-glow`)
- One cool variant (`--color-teal`)
- One pale pastel (`--color-celadon`)

#### Step 2: Set Up Base Styles

Apply these global styles:

```css
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-fg);
  line-height: 1.6;
}

::selection {
  background-color: var(--color-accent);
  color: #ffffff;
}
```

And the global transition on interactive elements:

```css
a, button, input, textarea, [role="button"] {
  transition-property: color, background-color, box-shadow, transform, opacity;
  transition-duration: 0.28s;
  transition-timing-function: ease;
}
```

The `0.28s ease` timing is critical -- it is the site's signature "feel". Faster feels cheap, slower feels sluggish.

#### Step 3: Copy the CSS Utility Classes

These classes from `global.css` are self-contained and reusable:

1. **`.gradient-mesh`** and **`.gradient-mesh-light`** -- Aurora backgrounds with CSS fallback animations
2. **`.glass-card`** -- Frosted glass card for dark sections
3. **`.card-light`** -- Shadow card for light sections
4. **`.glow-hover`** -- Radiant green glow behind element on hover
5. **`.reveal`** and **`.stagger`** -- Scroll reveal with staggered delays
6. **`.hero-enter`** and delay variants -- Hero entrance animation
7. **`.link-underline`** -- Animated underline on hover
8. **`.btn-glow`** -- Glowing CTA button
9. **`.text-gradient`** and **`.text-gradient-warm`** -- Gradient text fills
10. **`.blink-cursor`** -- Terminal-style blinking cursor
11. **`.copy-toast`** -- Fade-in toast notification

#### Step 4: Add the Aurora Script

Copy `src/scripts/aurora.ts` into your project. It is self-contained with zero dependencies.

**To adapt for a different colour palette:**

1. Modify the 3 `background` declarations in the injected `<style>` block (lines defining `.aurora-layer-1`, `.aurora-layer-2`, `.aurora-layer-3`)
2. Replace the RGBA values with your chosen palette. Maintain this structure:
   - Layer 1: Use your deepest and brightest colours at highest opacity (0.3-0.5)
   - Layer 2: Use your mid-tones at medium opacity (0.3-0.4)
   - Layer 3: Use your brightest and lightest colours at medium opacity (0.3-0.4)
3. Keep the frequency/amplitude/phase values unchanged -- they produce the organic motion regardless of colour

**For example, a blue aurora:**
```css
/* Layer 1 */
radial-gradient(ellipse 130% 70% at 15% 25%, rgba(59, 130, 246, 0.45) 0%, transparent 50%),
radial-gradient(ellipse 90% 90% at 75% 15%, rgba(30, 58, 138, 0.5) 0%, transparent 45%),
radial-gradient(ellipse 70% 100% at 40% 80%, rgba(56, 189, 248, 0.3) 0%, transparent 50%);
```

Also update the CSS fallback `::before` and `::after` gradients in the `.gradient-mesh` rules to match.

#### Step 5: Structure Sections with Gradient Fades

Alternate between dark and light sections. At each boundary, add a gradient fade div:

```html
<!-- At the bottom of a dark section, fading to white -->
<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-white pointer-events-none z-10"></div>

<!-- At the top of a light section, fading from dark -->
<div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--color-dark)] to-transparent pointer-events-none z-20"></div>
```

The rule: **`from-transparent` always points toward the current section. The opaque end matches the adjacent section's background.**

#### Step 6: Set Up Scroll Reveal

Add this script (or equivalent):

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
```

Then apply `class="reveal"` to any element that should animate in, and wrap groups in `class="stagger"` for cascading entrance.

### Key Tailwind Utilities Used Throughout

These Tailwind utilities form the backbone of the visual language:

| Utility                    | Purpose                                              |
|----------------------------|------------------------------------------------------|
| `max-w-2xl mx-auto`       | Narrow centered content column                      |
| `px-6`                     | Consistent horizontal padding                       |
| `rounded-full`             | Pill shapes (nav, social buttons, badges, dots)     |
| `rounded-2xl`              | Card corners                                        |
| `rounded-xl`               | Timeline item corners                               |
| `backdrop-blur-lg`         | Heavy glass blur (nav)                              |
| `backdrop-blur-sm`         | Light glass blur (social pills on dark)             |
| `tracking-tight`           | Hero name letter spacing                            |
| `tracking-widest`          | Section label letter spacing                        |
| `uppercase`                | Section labels                                      |
| `leading-relaxed`          | Body text line height                               |
| `text-white/60`            | Opacity modifier for text on dark backgrounds       |
| `bg-white/[0.06]`          | Arbitrary opacity for glass backgrounds             |
| `shadow-lg shadow-black/20`| Drop shadow with controlled opacity                 |
| `transition-all duration-200` | Smooth state changes                             |
| `pointer-events-none`      | Overlay elements that shouldn't intercept clicks    |
| `grayscale`                | Photo filter to maintain colour palette purity      |

### The Three Rules

If you take nothing else from this document, remember these three principles:

1. **The 0.28-second rule.** Every transition in the site uses `0.28s ease`. This is the tempo. It makes everything feel connected and deliberate.

2. **Green is the only colour.** There are no blues, purples, oranges, or reds anywhere in the design. Every colour is a shade of green, from near-black `#0c1f17` to pale `#ACE1AF`. The constraint creates coherence.

3. **Content floats above atmosphere.** The aurora, the gradient meshes, the glass cards -- these all create an atmospheric backdrop. Content (`z-10`) always sits above it, clean and readable. The atmosphere enriches without interfering.

---

*This document describes the design system as implemented across `src/styles/global.css`, `src/scripts/aurora.ts`, and all Astro components in `src/components/`. Last updated: 2026-03-29.*
