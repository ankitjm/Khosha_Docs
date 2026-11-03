# RetailerOS — Landing Page Motion Kit

Lottie icons, a Three.js hero, and a Spline-style 3D object for the RetailerOS landing page.
All of it shares one palette, one easing curve and one motion language.

Open `index.html` through any static server (`python3 -m http.server` inside this folder) to see every piece in context. It works in light and dark mode, on desktop and mobile, and with reduced motion.

> **About the brief.** I couldn't load `retaileros.in` from the build environment, because the network policy blocked the host. The plan below is based on the public product listing for *Retailer OS AI*: POS, inventory, online store, marketplaces, CRM, accounting, built-in AI, and an India focus.
> The palette, the fonts and the page copy are **placeholders**. Every colour is a CSS token in `css/retaileros.css`, so the whole kit takes on the real brand by editing about six lines.

---

## 1 · Art direction — "quiet precision"

| Principle | What it means in practice |
|---|---|
| **Warm paper, ink line, one accent** | Off-white `#F5F2EC` canvas, near-black ink, a single terracotta accent used only where meaning lives (the sale, the receipt, the ₹). |
| **Editorial type** | *Instrument Serif* for display, *Inter Tight* for UI. It feels considered rather than SaaS-generic. |
| **One curve** | Everything eases on `cubic-bezier(.16, 1, .3, 1)`: Lottie keyframes, CSS transitions and Three.js lerps. |
| **Motion with a job** | Icons draw on once when they enter, then make *one* gesture that explains the module (a receipt prints, a box drops, a ₹ is written). Nothing loops for attention except the loader. |
| **Respectful** | `prefers-reduced-motion` → static final frames. Canvases pause off-screen and in background tabs. DPR is capped at 2. |

---

## 2 · What's in the folder

```
retaileros/
├── index.html              ← showcase landing page (every asset in context)
├── css/retaileros.css      ← brand + motion tokens, Lottie recolour hooks
├── js/
│   ├── lottie-icons.js     ← tiny runtime: in-view intro, hover, loop, reduced-motion
│   ├── hero-shelf.js       ← Three.js hero "The Living Shelf"
│   └── layers-stack.js     ← Three.js "The Stack" (Spline-style clay + glass)
└── lottie/
    ├── build.mjs           ← generator: every icon authored as code
    ├── manifest.json
    └── *.json              ← 13 Lottie animations
```

### Lottie set (13 files, 0.5–1.1 KB each gzipped)

All icons are on a 96 × 96 grid with a 3 px stroke and round caps. Every file has two markers: `intro` (frames 0–60, the draw-on) and `hover` (frames 60–150, the gesture, which always returns to rest).

| File | Gesture | Use on the landing page | Use elsewhere |
|---|---|---|---|
| `pos` | terminal draws, receipt prints upward | Billing & POS card | POS app empty state, onboarding step |
| `inventory` | top box drops onto stack with a squash | Inventory card | "Low stock" alert, import complete |
| `storefront` | awning breathes, door light blinks | Online store card | "Your store is live" moment |
| `marketplaces` | pulses travel hub → channels | Marketplaces card | Channel connect / sync screen |
| `customers` | two people, heart pops | CRM / Customers card | Loyalty, repeat-customer badge |
| `books` | invoice lifts, **₹** re-writes itself | Books & GST card | Invoice generated, GST section |
| `insights` | bars dip & regrow, trend redraws | Insights card | Daily summary email header (GIF) |
| `ai` | filled sparkle turns, companion twinkles | AI card, "See it live" button | Any AI-assist button, tooltip |
| `sync` | two arcs chase a full turn | Nav CTA, "synced" toast | Sync status in app header |
| `orders` | parcel + location pin drops | Delivery / orders feature | Order tracking, WhatsApp updates |
| `success` | ring closes, check lands | Form submitted state | Payment received, return filed |
| `loader` | comet traces a rounded square (loop) | Form busy state | App-wide loader / splash |
| `flow` | Sale → Stock → Books, nodes light in sequence (loop, 360 × 120) | "One sale, everywhere at once" section | Pitch deck, explainer video, social post |

### Three.js scenes

| Scene | Idea | Cost |
|---|---|---|
| **The Living Shelf** (`hero-shelf.js`) | A calm field of rounded tiles (shelves, SKUs, counters) breathing like a slow tide. Every ~220 ms one tile lifts and warms to the accent: a sale happening somewhere. A slight mouse parallax. | 1 InstancedMesh, ~1.2k instances, **1 draw call**, no shadows, no post-processing. |
| **The Stack** (`layers-stack.js`) | Three soft slabs, *Sell* (accent clay), *Stock* (glass, with bins inside) and *Books* (stone), float and **unfold** as the section reaches the centre of the screen or on hover. HTML labels track each layer. | ~10 meshes, environment lighting from `RoomEnvironment`, a fake contact shadow (a canvas gradient). |

**Why Spline-style rather than Spline.** The Spline runtime plus a scene export is roughly 600 KB+ and can't read your CSS tokens. The Stack gets the same soft clay and glass look with `MeshPhysicalMaterial` (clearcoat and transmission), themes itself from the page, and costs about 4 KB of code on top of Three.js. If you later want a hero-grade product render, a single Spline scene in one section is a fine addition. Keep it to one.

### Page weight

| Piece | gzip |
|---|---|
| `lottie_light.min.js` 5.12.2 (SVG-only build) | ≈ 46 KB |
| all 13 Lottie JSONs | ≈ 10 KB |
| `three.module.min.js` 0.160.0 | ≈ 163 KB, loaded as an ES module (defer it below the fold if the hero is static) |
| kit JS + CSS | ≈ 10 KB |

---

## 3 · Using it on the real site

```html
<link rel="stylesheet" href="css/retaileros.css">

<!-- an icon: draws in when visible, plays its gesture on hover of the card -->
<a class="card" data-lottie-hover>
  <span class="ros-lottie lg" data-lottie="inventory"></span> Inventory
</a>

<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js"></script>
<script src="js/lottie-icons.js" data-base="lottie/"></script>

<!-- 3D -->
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }</script>
<script type="module">
  import { mountHero } from './js/hero-shelf.js';
  mountHero(document.querySelector('[data-ros-hero]'));
</script>
```

* **Recolour:** edit `--ros-ink`, `--ros-paper`, `--ros-paper-2` and `--ros-accent` (plus their dark-mode twins). Lottie layers carry the classes `ink`, `accent`, `ink-fill` and `accent-fill`, and the CSS repaints them. Add `.is-mono` to make an icon take the text colour, for example inside a button.
* **Sizes:** `.sm` 32 px, default 48 px, `.lg` 64 px, `.xl` 96 px. The icons are built to stay crisp from 24 px up.
* **React / Next:** use `lottie-react` or `@lottiefiles/dotlottie-react` with the same JSON files. Play the `intro` and `hover` markers the same way `lottie-icons.js` does.
* **Webflow / Framer:** both accept these JSON files directly. Set the trigger to "on scroll into view" for frames 0–60 and "on hover" for frames 60–150.
* **Mobile apps:** Lottie iOS and Android read the same files and markers.

### Editing the icons

The icons are code, so changes stay consistent across the set:

```bash
node retaileros/lottie/build.mjs   # regenerates every JSON + manifest.json
```

Change `SW` (stroke weight), `INK` / `ACCENT`, or the timing of a single icon in `build.mjs`. The JSON files also open in the LottieFiles editor if a designer wants to tweak one by hand.

---

## 4 · Where else this pays off

* **Product UI.** The same icons work as sync, order and success feedback inside the app, so the marketing site and the product speak one visual language (see the "Inside the product" section of the demo page).
* **Onboarding.** Each module icon becomes a step marker ("Add your first product" uses `inventory`, "Go live" uses `storefront`).
* **WhatsApp / email.** Export `flow`, `success` or `orders` to GIF or MP4 from LottieFiles for order updates, receipts and campaign headers.
* **Sales deck and social.** `flow` and screen captures of The Stack make clean 5-second loops for LinkedIn, Instagram and pitch slides.
* **Brand system.** The grid, stroke and easing rules are a starting point for every future icon. Add one to `build.mjs` and it matches the rest.

## 5 · Next steps once the real brand is in

1. Swap the tokens to the RetailerOS palette and fonts, then run `build.mjs` with the new `INK` / `ACCENT` so non-CSS players (apps, GIFs) match too.
2. Replace the sample copy on `index.html` with the site's real sections.
3. Optional: scroll-scrub the `flow` animation (`anim.goToAndStop(progress * 240, true)`) so the sale moves as the visitor scrolls.
4. Optional: one Spline hero render of the actual POS hardware, if RetailerOS ships devices.
