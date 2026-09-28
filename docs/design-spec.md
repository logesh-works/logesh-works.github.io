# Design spec: HAPE-style experience for logeshkumar.in

Reference audit of hape.io (Sept 2026), measured from the live site's stylesheets and
rendered pages at 1440×900, 820×1180 and 390×844, and translated into **this repo's
stack**: Next.js 14 App Router, React, Tailwind, React Three Fiber, Lenis.

> **What we reproduce vs. what we don't.** We rebuild the *structure, layout system,
> type scale, motion curves and interaction patterns*. We do **not** copy HAPE's
> assets: their fonts (commercial licences), `ambient.mp3`, 3D characters and
> textures, logo, copy or source code. Each of those has a replacement below.

---

## 0. The experience in one paragraph

A full-viewport WebGL canvas sits behind everything. One character stands in a
studio. The page is ~11 viewports tall on desktop, but nothing scrolls visibly:
scroll drives the **camera along a spline** around the character, and **fixed text
blocks** swap in and out per step. The frame is always the same: a pill button
top-left and a pill button plus round burger top-right, a toolbar across the bottom,
and a giant wordmark in the opening shot. Film grain sits on top, sound starts on
the first click, and a full-screen menu slides over. The site's colour comes from
three **themes** (black, white, red) switched per session.

---

## 1. Design tokens

### 1.1 Themes (exact values)

HAPE sets `data-theme` on `<html>`. We keep the mechanism and use **black** as our
default (it matches the warm-black identity we already have). White is optional as a
second look; red is dropped.

| Token | black | white |
|---|---|---|
| `--page-bg` | `#0f0f0f` | `#ffffff` |
| `--noise-opacity` | `.05` | `.10` |
| `--accent` (icons, burger, progress, hovers) | `#9c7443` (bronze) | `#000000` |
| `--accent-glow` | `#794a2f` | n/a |
| `--panel` (menu, roadmap inner) | `#212121` | `#d7d7d7` |
| `--overlay` (behind menu/modals) | `rgba(0,0,0,.6)` | `rgba(0,0,0,.6)` |
| `--button-bg` (pill fill) | `rgba(0,0,0,.25)` | `rgba(255,255,255,.3)` |
| `--title` | `#fff` | `#000` |
| `--text` (body in blocks) | `rgba(255,255,255,.55)` | `rgba(0,0,0,.55)` |
| `--eyebrow` | `rgba(255,255,255,.4)` | `rgba(0,0,0,.4)` |
| `--muted-link` | `rgba(255,255,255,.54)` | `rgba(0,0,0,.54)` |
| `--hairline` | `rgba(255,255,255,.1)` | `rgba(0,0,0,.1)` |
| `--border-soft` | `rgba(255,255,255,.2)` | `rgba(0,0,0,.2)` |

Loader backgrounds:
- black: `radial-gradient(circle at 50%, transparent 50%, #000 100%), linear-gradient(to top, #0c0c0c 0%, #1e1e1e 100%)`
- white: `radial-gradient(circle at 50%, transparent 60%, rgba(0,0,0,.35) 160%), radial-gradient(circle at 50%, #dbdcdc 40%, #acacac 140%)`

**Our mapping.** Put these in `app/globals.css` as `:root[data-theme="black"] { … }`
blocks, and point Tailwind colours at them (`bg: "var(--page-bg)"`, etc.). Our
existing gold `#dea45a` is replaced by HAPE-black's bronze `#9c7443` as the single
accent, with no second accent colour.

### 1.2 Grid

```
--grid-columns: 16;  --grid-edge: 50px;  --grid-gutter: 20px;  (15 gutters)
--grid-size: calc(100vw - 100px)
mobile edge: 20px (< 64em)
```

Every width is a **fluid column span**, written as:

```
calc(Apx + k * (min(100vw, 100vw - 100px) - Cpx))
```

where `C` = total gutter width for that breakpoint (220px at ≥64em, 300px at ≥83.75em)
and `k` = columns ÷ 16. Common spans:

| Use | ≥ 64em | ≥ 83.75em |
|---|---|---|
| Text block width | `100px + .5 × (vw−320)` | `100px + .375 × (vw−400)` |
| Block body max-width | `60px + .333 × (…)` | `60px + .25 × (…)` |
| Toolbar side | `60px + .333 × (…)` | `60px + .25 × (…)` |
| Intro columns | `40px + .25 × (…)` | `40px + .1875 × (…)` |

**Our mapping.** Add a `col(n)` helper in `lib/grid.ts` that returns the calc string,
or add Tailwind utilities `w-col-4`…`w-col-8` generated in `tailwind.config.ts`.
Don't reach for Tailwind's container; HAPE uses full-bleed with 50px edges.

### 1.3 Breakpoints

Primary: **64em (1024px)**; nearly everything switches here. Secondary:

| em | px | What changes |
|---|---|---|
| 28.125 | 450 | minor type tweaks |
| 37.5 | 600 | minor |
| 48 | 768 | page background image swap |
| **64** | **1024** | desktop layout: header 40px top, buttons 52px, menu goes two-column, intro lines animate |
| 68.75 | 1100 | toolbar right column appears |
| 83.75 | 1340 | larger grid math (300px gutters), menu 68px type, footer spacing |
| 90 | 1440 | narrower text blocks |
| 120 | 1920 | narrowest body copy |

**Our mapping:** Tailwind `screens: { xs: "450px", sm: "600px", md: "768px", lg: "1024px", lx: "1100px", xl: "1340px", "2xl": "1440px", "3xl": "1920px" }`.

### 1.4 Typography

HAPE uses three commercial faces. We need licensed copies or a free substitute.

| Role | HAPE font | Free substitute (Google, via `next/font`) |
|---|---|---|
| Display / headings / eyebrows | **Integral CF** 400/600/800 | **Archivo** at `wdth 125`, weights 600/800 |
| Labels on buttons, sub-nav | **Druk Text Wide** 700 | Archivo `wdth 125`, 700, uppercase |
| Body | **Neue Plak Extended** 400/600 | Archivo `wdth 112`, 400/600 |

Archivo is one variable file covering all three roles.

Type scale (from computed styles):

| Style | Mobile | ≥ 64em | Details |
|---|---|---|---|
| `.h1` block title | 24px / 0.83 | **40px / 0.9** | Integral 800, uppercase, `-0.02em` |
| `.h2` | 18px / 0.89 | 20px / 1.05 | Integral 800, uppercase |
| `.h3` intro text | 10px / 1.2 | **16px / 1.25** | Integral 400, uppercase; `<b>` = 800 |
| Page title | n/a | 84px / 0.81 | Integral 800 |
| Menu main | 34px / 1 | 58px (≥64em), **68px** (≥83.75em) | Integral 600, uppercase |
| Menu number `01/` | 8px | 9px | Integral 400, `letter-spacing .58em`, 50% alpha, superscript |
| Eyebrow `01/` | 9px / 1 | 9px / 1 | Integral 400, **`.58em` tracking**, uppercase |
| Block body | 12px / 1.33 | **15px / 1.4** | Neue Plak 400, `--text` |
| Button label | 10px / 1 | 10px / 1 | Druk Wide 700, uppercase |
| Link s / m / l / xl | 12px, 8px `.58em`, 10px, 17px | same | see `.link--*` |
| Footer bottom | 8px / 2.6 | 8px | Integral 400, `.58em`, uppercase |
| Loader percent | 13px | 13px | Integral 800, `-0.02em` |
| Loader caption | 12px / 1.5 | 12px | Neue Plak 400, 50% alpha |
| Body default | 13px / 20px | 13px / 20px | Neue Plak 400 |

Hierarchy rule: headings are **heavy, wide, uppercase, tightly set**. Body is small
and pale (55% alpha). The only large type is the opening wordmark, block titles and
the menu.

### 1.5 Motion

| Name | Curve | Used for |
|---|---|---|
| `ease-out-quart` | `cubic-bezier(.165,.84,.44,1)` | **Default for everything** (83 rules) |
| `ease-in-out-quart` | `cubic-bezier(.77,0,.175,1)` | sound bars, menu panel slide |
| `ease-expo-wipe` | `cubic-bezier(1,.01,.24,.995)` | loader and page wipes |
| `ease` | `ease` | minor |

Durations: **0.3s** for colour and opacity (most common), **0.5s** for moves, **1s**
for scale-ins and title rotations. Stagger: **0.05–0.1s** per item.

Keyframes to reproduce (add to `globals.css`):

```css
@keyframes fade-in   { from { opacity: 0 } to { opacity: 1 } }
@keyframes fade-y-in { from { opacity: 0; transform: translate3d(0,30px,0) } to { opacity: 1; transform: none } }
@keyframes scale-in  { from { transform: scale3d(0,0,0) } to { transform: none } }
@keyframes scale-x-in{ from { transform: scale3d(0,1,1) } to { transform: none } }
@keyframes move-y-in { from { transform: translate3d(0,110%,0) } to { transform: none } }
@keyframes title-rotate {           /* the signature heading reveal */
  from { opacity: 0; transform: rotate3d(1,.15,0,-90deg) translate3d(0,10px,0); transform-origin: 0 100% }
  to   { opacity: 1; transform: rotate3d(1,.1,0,0deg);                          transform-origin: 0 100% }
}
```

`title-rotate` is applied **per line**. The parent has `perspective: 1500px` and each
`.line` has `transform-style: preserve-3d`, so lines swing up from lying flat, like a
hinged card.

### 1.6 Texture

- **Noise.** A tiling PNG (`200px`, repeat) over the page at `--noise-opacity`, plus
  heavy animated film grain and **RGB fringing** in the WebGL post-process. Ours:
  keep the `FilmPass` and `RGBShift` passes in `PostFX.tsx`; replace the CSS SVG
  grain with a 200px PNG noise tile.
- **No box shadows, no borders on cards.** Depth comes from the 3D scene, blur-free
  translucent fills (`rgba(0,0,0,.25)`) and the vignette.
- Radius: pills `26px` (height 52), round buttons `50%`, cards `0`.

---

## 2. Layout and structure

### 2.1 Page skeleton (home)

```
<html data-theme="black">
  Loader           fixed, z 999          (removed after entry)
  Canvas           fixed, 100vw×100vh    (the 3D world, behind all UI)
  Header           absolute top          (pill left, pill + burger right)
  Intro            absolute top          (wordmark + 2 text columns), only in first viewport
  Content blocks   position: FIXED, vertically centred, one visible at a time
  Toolbar          fixed bottom
  Scroll track     ~11 × 100vh of empty height that drives the camera
  Footer           in flow at the very end (partners slider, quote, links)
  Menu overlay     fixed, z 900
```

The page **looks** static while the scroll position animates the camera; text
blocks are fixed and swap by step. That is the main difference from our current
build, where copy scrolls past.

**Our mapping.**
- `app/(root)/page.tsx` renders `<Stage />` (canvas), `<Header />`, `<Intro />`,
  `<Blocks />` (fixed), `<Toolbar />`, a `<ScrollTrack steps={n} />` spacer, and
  `<Footer />`.
- `ScrollController` already turns scroll into `world.beat`. Blocks read the rounded
  beat instead of each owning a full-height section.
- Screen readers and no-JS visitors still get the content in DOM order; the fixed
  presentation is only visual.

### 2.2 Header (fixed frame, top)

- Container: `absolute; top 0; padding: 30px 20px 0` (mobile), **`40px 50px 0`** (≥64em); `pointer-events: none` with children re-enabled.
- **Left:** label pill "PLAY TRAILER ▶", 52px tall, then the animated logo sprite, which becomes fixed at `top 53px; left 50px` after the intro scrolls away.
- **Centre-left:** "HIGH-FASHION HAPES", 13px Integral 600 uppercase, positioned at column 7 (~475px at 1440).
- **Right:** label pill "VIEW MARKETPLACE" + **round burger** (52px, white disc with black icon on the white theme; black disc with bronze icon on black). Burger margin-left 25px. The right group sits 75px in from the edge (to make room for the burger).

**Ours:**

| Slot | Content |
|---|---|
| Left pill | `RESUME ▸` (opens `/resume.pdf`); resume is primary |
| Centre label | `SOFTWARE DEVELOPMENT ENGINEER` |
| Right pill | `GITHUB ↗` |
| Burger | opens menu |

### 2.3 Hero / intro (first viewport)

- **Wordmark** spans the full grid width (`width: 100%`), aspect ratio `9.3%`
  (≥1340px), `13%` (≥1024px) or `19.5%` (mobile). It is an **animated sprite**
  (`steps(60)` / `steps(83)` sequence) that draws itself in. Set in the sans display
  weight, not the heavy one.
- The character's **head fills the lower two-thirds**, an extreme close-up that
  overlaps the wordmark.
- Two small text columns under the wordmark, 16px Integral uppercase, with the key
  phrase in 800:
  - left (col 1–4): "**FULLY 3D** AND READY TO REDEFINE DIGITAL FASHION"
  - right (col 8–11): "DISCOVER **8192 UNIQUE** BEAUTIFUL HAPES"
  - each line reveals with `move-y-in` inside an `overflow:hidden` wrapper, staggered
- "Scroll to explore" with a mouse icon (gradient wheel), centred above the toolbar.

**Ours:**
- **Wordmark:** `LOGESH KUMAR`. No ® (not a registered mark). Draw it with an SVG
  stroke-dash reveal or a clip-path wipe; no sprite needed.
- **Left column:** "**ENGINEERING PRODUCTS** FROM IDEAS".
- **Right column:** "DESIGNING **DISTRIBUTED SYSTEMS** AND LOW-LATENCY APIS".
- **Opening shot:** a close-up of the engineer's face with glasses, pulling back as
  you scroll.

### 2.4 Content blocks ("01/ STREET FASHION, YOUR STYLE")

- `position: fixed; top: 50%; transform: translateY(-50%)`.
- Width `240px` on mobile; `col(8)` at ≥1024px; `col(6)` at ≥1340px; `col(5)` at ≥1440px.
- Alternating sides: block 1 on the **right** (`right: 50px`), block 2 on the
  **left** (`left: 50px` + one column), and so on. On mobile block 2 is
  right-aligned text.
- Structure:
  1. eyebrow `01/`: 9px, `.58em` tracking, 40% alpha, 30px margin below
  2. title: `.h1` 40px/0.9, split into `.line` spans; a `<b>` inside is tinted with `--content-block-dot` (bronze on black)
  3. body: 15px/1.4, 55% alpha, max-width `col(5)`
- Entrance: lines animate with `title-rotate` 1s ease-out-quart, stagger .1s; body lines follow. Exit reverses.

**Our blocks** (one per camera stop):

| # | Eyebrow | Title | Body (from `constants/index.ts`) |
|---|---|---|---|
| 01 | ABOUT | I BUILD THE SYSTEMS **BEHIND** THE PRODUCT | `profile.statement` |
| 02 | SYSTEMS | SKILLS, ARRANGED LIKE **SYSTEMS** | stack layers (compact list) |
| 03 | EXPERIENCE | CYCES **INNOVATION LABS** | role + highlights; "View timeline" opens the roadmap modal |
| 04 | OPEN SOURCE | POSTMAN **MCP** | summary, pipeline one-liner, GitHub / PyPI |
| 05 | RESEARCH | BEST PAPER **AWARD** | ICA6NT 2026 + paper title |
| 06 | CONTACT | HAVE A SYSTEM **TO BUILD?** | email, LinkedIn, resume |

### 2.5 Toolbar (fixed frame, bottom)

- Row at the bottom edge (`y ≈ 803px` of 900), height 52px, three zones sized with `col()` spans.
- **Left:** "OUR ROADMAP" label pill (opens the roadmap modal) + a round icon button (character logo).
- **Centre:** "PRESS [ HAPEBAR ] TO SWITCH" (keyboard hint; the key-cap is a black pill 150×44 with a 3px lower "shadow" plate). On mobile this becomes a "SWITCH HAPE" button.
- **Right:** "FASHION INDEX ↗" (Druk Wide 10px link) + the **sound toggle**.

**Ours:**

| Zone | Content |
|---|---|
| Left | `EXPERIENCE` pill (opens the timeline modal) + round `LK` monogram |
| Centre | `PRESS [ SPACE ] TO SWITCH LOOK` (switches camera preset or outfit); on mobile a `SWITCH` button |
| Right | `BLOG ↗` link + sound toggle |

### 2.6 Footer (in flow, after the scroll track)

- Section eyebrow `03/`, title `OUR PARTNERS` (two lines, `title-rotate`).
- **Horizontal slider** of cards: 235px wide, aspect `85.84%` (height 202), 20px gap,
  translucent fill `rgba(0,0,0,.3)`, image inside. On hover a **name pill** (white,
  black Druk Wide text) appears under the card. Below it a **custom scrollbar**:
  1px track `rgba(255,255,255,.1)` with a 2px thumb in the accent, which scales in
  (`scale-x-in`).
- Cards enter with `fade-y-in` 0.5s, staggered 0.05s.
- **Top row:** quote (h2 style) + attribution (12px, 40% alpha) on the left;
  "CONNECT WITH US" title + two link columns (`.link--s`, 54% alpha, ↗ icons) on the
  right. 1px hairline below.
- **Bottom row:** `© 2024 • HAPE LABS` · `STYLED BY @…` · `TERMS & CONDITIONS` ·
  `PRIVACY POLICY` · sound toggle. All 8px Integral with `.58em` tracking.
- A 530px **gradient** (`to top, black 15%, transparent`) behind the footer so it
  rises out of the scene.

**Ours:**
- **Slider:** "WORKED WITH": BUDDI AI, CSC Education and Cyces as text cards (no
  logos we don't own), plus your photo card.
- **Quote:** your statement line.
- **Links:** GitHub, LinkedIn, X, Instagram, Email, Blog, GitHub activity, Memories.
- **Bottom row:** `© 2026 · LOGESH KUMAR` · `RESUME` · sound toggle.

### 2.7 Menu (full-screen overlay)

- `fixed; inset 0; z 900; padding 50px`, backdrop `rgba(0,0,0,.6)`, inner panel
  `--panel` with the noise overlay. On mobile the inner panel fills the screen.
- **Header row:** logo left, "CLOSE ✕" label button right (the ✕ rotates 1s on hover).
- **Main list** (left, grows): Integral 600 uppercase at 68px/58px/34px, each item
  followed by a superscript `01/`. Hover colour is the accent (0.3s).
- **Sub list** (right column `col(4)`): Druk Wide 10px uppercase, 30px apart, ↗ icons,
  50% alpha, white on hover.
- **Footer row:** 1px rule, "PLAY TRAILER" pill, and a centred tertiary list (8px,
  `.58em`).
- **Enter:** panel slides (ease-in-out-quart), then main lines `move-y-in` 0.5s
  staggered 0.1s from 0.2s, and sub lines the same from 0.3s. The rule `scale-x-in`s.

**Ours:**
- **Main list:** HOME 01/, ABOUT 02/, EXPERIENCE 03/, OPEN SOURCE 04/, RESEARCH 05/,
  CONTACT 06/.
- **Sub list:** GitHub, LinkedIn, X, Instagram, Blog, GitHub activity, Memories.
- **Footer:** `RESUME` pill.

### 2.8 Roadmap modal (reuse as the Experience timeline)

HAPE opens "OUR ROADMAP" as an overlay panel with a vertical dotted line, **phases**
(eyebrow + big title + marker dot) and **items** (dot, title, text). The tokens are
already in the table above (`--roadmap-*`: accent line and dots on `#212121`).

**Ours:** the modal is the career timeline. Phases are Cyces (2025–present),
Freelance (2023–25) and CSC Educator (2022–25); items are each role's highlights.
Education goes in a final phase.

---

## 3. Components

### 3.1 Pill button (`.button--with-label`)

```
height 52 (40 on mobile) · border-radius 26 · label padding 12px 10px 8px 30px
[ LABEL TEXT ]( ● icon )   icon = circle, the height of the pill minus ~10px, 10px left gap
```

| State | Behaviour |
|---|---|
| **In view** | The background disc `scale-in`s from 0 over **1s** ease-out-quart. The icon circle `scale-in`s from 0.15s. The svg glyph fades in at 0.3s. The label is revealed. |
| **Hover** | Icon circle and glyph swap colours (`--button-hover-*`) over 0.3s; black theme adds a bronze glow `#794a2f`. |
| **Active** | No distinct style observed; use `scale(.97)` over 0.1s. |
| **Disabled** | Not used on the site. Use 40% opacity and `pointer-events:none`. |
| **Focus** | Not styled by HAPE. Add a 2px accent `outline-offset: 3px` for accessibility. |

Variants:
- `--with-background`: an icon-only round button (52×52; 40×40 for the burger on
  mobile).
- The burger's disc is solid (`--burger-background-color`) and turns accent on hover.

**Ours:** `components/hud/PillButton.tsx` with props `label?`, `icon`, `href | onClick`,
`size: "md" | "sm"`, `variant: "label" | "round"`, and a `data-in-view` attribute that
triggers the CSS keyframes.

### 3.2 Sound toggle

- A 23×15 box of **5 bars**, each 3px wide, `transform-origin: bottom`.
- **Playing:** each bar loops `scaleY` over **1s** `ease-in-out-quart` infinite, with
  its own range and delay (see below).
- **Muted:** bars ease to `scaleY(.1)` over 0.5s.
- **Hover:** colour becomes the accent.

| Bar | Range | Delay |
|---|---|---|
| 1 | .1 ↔ .55 | .26s |
| 2 | .1 ↔ .55 | .32s |
| 3 | .41 ↔ .86 | .04s |
| 4 | .45 ↔ .90 | .47s |
| 5 | .45 ↔ .90 | .18s |

It appears in the toolbar and footer. No text label, so add an `aria-label` and
`aria-pressed`.

### 3.3 Text link (`.link`)

- `inline-flex`, with a 6px ↗ arrow svg 6px to the right. The colour transition is
  0.3s ease-out-quart.
- Sizes: `s` (12px Plak), `m` (8px Integral, `.58em`), `l` (10px Druk Wide), `xl`
  (17px Plak 600), `xxl` (14px Druk Wide).
- `--animate` variant: content starts at `translateY(100%)` inside `overflow:hidden`
  and slides up in view.

### 3.4 Tutorial chips

- **"Click anywhere to enable the sound".** A pill with a translucent fill
  (`rgba(0,0,0,.25)`), speaker icon and 13px Plak. It sits right of centre at
  y ≈ 320 and disappears after the first click.
- **"Scroll to explore".** A mouse outline with a gradient wheel plus 15px Plak at 50%
  alpha. Fades in at 0.3s and out when scrolling starts.
- **Touch:** a full-screen `rgba(0,0,0,.7)` overlay with a hand-swipe sprite
  animation.
- **"Drag"** tutorial: on hover over the character, a mouse-drag icon. The character
  can be **rotated by dragging**.

### 3.5 Loader

- `fixed; z 999`, with the theme gradient and noise overlay.
- The logo is centred (the animated sprite draws the wordmark in bronze on black).
- **Progress block** 30px from the bottom:
  - an SVG ring 62px with `r=29` (circumference **182.212**), rotated -90°;
  - track 2px `rgba(255,255,255,.25)`, progress 3px accent, driven by
    `stroke-dashoffset`;
  - the percent is centred in the ring (13px Integral 800);
  - a caption below (12px Plak, 50% alpha), each word in its own span rising with
    `move-y-in`, staggered 0.05s from 0.1s.
- **Exit:** the whole loader translates `-100vh` using the wipe curve.
- The site then shows a first-gesture state ("Click anywhere to enable the sound").
  On desktop it took ~20–25s to reach 100%, because it loads ~100 KTX2 textures and 3
  rigged characters.

**Ours:** `LoadingScreen.tsx` already has the ring and percent. Change these:
- ring to r=29 / 62px, 2px track / 3px progress;
- caption to word-by-word `move-y-in`, with a fitting line such as "Compiling the
  engineer";
- exit to `translateY(-100vh)` with `cubic-bezier(1,.01,.24,.995)`;
- keep the enter gate.

### 3.6 Cursor

HAPE uses the **native cursor** (`.no-touchevents` only gates hover styles), so
there's no custom cursor. Drop our custom cursor to match, or keep it subtle. Match:
**drop it**.

---

## 4. Animation and interaction behaviour

| Trigger | What changes | Implementation (ours) |
|---|---|---|
| Page load | Loader ring fills; words rise; logo sprite plays | `LoadingScreen` |
| Loader done | Loader slides up 100vh; header pills scale in (1s, staggered); intro lines rise | `data-entered` on `<html>` triggers CSS |
| First click / keypress anywhere | Ambient music fades in; sound-chip hides; bars start | `SoundController` (exists) |
| Scroll (wheel/touch) | Camera travels along a **spline**; nothing in the DOM scrolls visibly | Lenis + `ScrollController` → `world.beat` → `CameraController` samples a `CatmullRomCurve3` |
| Scroll crosses a step | Previous block's lines rotate out; next block's lines rotate in (`title-rotate`) | `Blocks` reads `Math.round(world.beat)`; toggles `data-active` |
| Pointer move | Slight camera parallax | exists |
| Drag on character | Rotates the character (yaw), with inertia | pointer handlers on the canvas → `characterState.yawOffset` |
| Spacebar ("hapebar") / mobile button | Switches to another character with a dissolve | switch camera preset or outfit colourway |
| Hover pill | Icon colours swap, 0.3s | CSS |
| Burger | Menu overlay enters (panel slide + staggered lines) | `SiteMenu` |
| Scroll to end | Footer rises from the scene with gradient; partners slide in | normal flow |
| Konami code | Plays `konami.mp3` Easter egg | optional |
| Tab hidden | Audio suspends; render loop pauses | exists |

### 4.1 Camera and 3D (what the scene does)

- **One full-viewport WebGL canvas** (a custom "glxp" engine, not three.js), with
  Basis/KTX2 compressed textures and a WASM transcoder.
- **Assets** (for reference; we build our own equivalents):
  - rigged characters as JSON plus separate animation JSON (including dance clips);
  - `Camera_Splines_002.json`, the authored camera path;
  - an environment JSON;
  - HDR and KTX2 environment maps (`LightBlack`, `LightWhite`, `oberer_kuhberg`);
  - a fur-density texture (shell fur);
  - concrete displacement for the floor.
- **Opening shot:** an extreme close-up of the head (it fills the frame under the
  wordmark), slow idle.
- **Scroll path:** the camera pulls back and orbits along the spline: head → ¾ torso →
  side profile → full body walking toward camera → feet close-up near the footer.
  The character idles, breathes and walks in place; the camera does the travelling.
- **Look:** soft high-key studio (white theme) or low-key (black theme); heavy film
  grain; RGB fringing on edges; floating dust motes; gentle vignette; no visible
  floor horizon (seamless cyclorama).

**Our mapping.**
- **Replace station choreography with one stage.** The character stays at the origin
  with walk-in-place or idle, and the camera follows a single `CatmullRomCurve3`
  defined in `components/world/cameraPath.ts`, one control point per block (see 2.4).
  This replaces `choreography.ts`'s per-beat marks.
- **Environment:** a seamless cyclorama (large curved plane) plus dust and grain.
  Remove the studio walls, floor grid, pipelines and gallery; the environmental
  storytelling moves into the text blocks.
- **Character:** keep `character/config.ts`. A rigged, textured GLB (idle and walk
  clips) is the single biggest quality lever. The code-built stand-in cannot reach
  HAPE's fidelity.
- **Drag to rotate:** add it.

### 4.2 Audio

- One looping ambient track, loaded as a normal `<audio>`/MP3, started on the first
  gesture, with a fade.
- A second SFX file for the Easter egg.

**Ours:** `lib/audio/config.ts` supports a licensed track. Until you supply one, the
original generative score plays. HAPE's `ambient.mp3` must not be used.

---

## 5. Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| **< 64em** (mobile/tablet) | Edge 20px. Buttons 40px. Header top 30px. Intro text 10px. Wordmark aspect 19.5%. Blocks 240px wide, pinned right or left. Body 12px. Menu full-screen single column (34px items, sub-links 17px Plak). Toolbar: "SWITCH HAPE" button instead of the key hint. Touch scroll tutorial overlay. Lower-resolution texture set. |
| **≥ 64em** | Desktop frame as described. Menu two-column. Intro lines animate. |
| **≥ 83.75em** | Wider grid math, 68px menu, narrower blocks. |
| Performance | HAPE's mobile load took **>25s** on our test device and never finished in the time we waited. That's the one thing **not** to copy: keep our lazy-load, tiered quality and 9s bail-out. |

---

## 6. Build plan in this repo

1. **Tokens.** Replace `globals.css` tokens with the `data-theme="black"` set, add
   the keyframes (1.5), the Archivo font (1.4), the grid helper (1.2) and Tailwind
   screens (1.3).
2. **Frame components** (`components/hud/`): `PillButton`, `SoundToggle` (5-bar
   spec), `Header`, `Toolbar`, `SiteMenu`, `TimelineModal`, `Tutorials`.
3. **Loader** changes (3.5).
4. **Intro and Blocks:** `Intro.tsx` (wordmark and two columns), `Blocks.tsx` (fixed
   blocks, `title-rotate`), `ScrollTrack.tsx`.
5. **Stage.** Replace the station world with cyclorama, character, `cameraPath.ts`,
   drag rotate and PostFX. Delete `Pipeline`, `ProjectGallery`, `PostmanStation`,
   `AwardScene`, `ArchitectureGraph`, `StudioSet` and `stations.ts`.
6. **Footer** with the "worked with" slider and custom scrollbar.
7. **Verify** at 1440, 1280, 1024, 768, 390 and 375, with reduced motion, no WebGL,
   keyboard-only and a screen reader.

### Inputs only you can provide

| Item | Why | Without it |
|---|---|---|
| Rigged character GLB (idle and walk) | HAPE-level character quality | Code-built stand-in |
| Licensed fonts (Integral CF, Druk Wide, Neue Plak) | Exact typography | Archivo substitute |
| Licensed music track | Specific soundtrack | Original generative score |
| Wordmark or logo design | Brand mark | Typeset `LOGESH KUMAR` |

Reference screenshots from this audit are in the session scratchpad (`audit/`): desktop
hero, menu, scroll steps, footer and the mobile loader.
