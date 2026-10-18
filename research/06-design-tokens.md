# Design tokens (taken from the reference sites' source)

Pulled from the live HTML/CSS on 2026-10-17. Values marked *(css)* are copied from source. Values marked *(visual)* were read off a screenshot.

## Style reference: aprilleihuanani.com (Readymag site)

| Token | Value |
|---|---|
| Background | near-black, `#000`–`#0A0A0A` *(visual)* |
| Text | `#F4F4F4` at 100% *(css: `F4F4F464`, Readymag stores RRGGBB plus a 0–100 opacity)*, `#F4F4F4` at 72% for secondary text *(css: `F4F4F448`)* |
| Accent | `#0080FF` *(css)*, used sparingly |
| Display font | **Instrument Serif** 400, regular + italic *(css: `lgwy`)*. Section titles are UPPERCASE at 80/80 or 152/152, letter-spacing -0.1. The italic sits inside a sentence to accent a clause. OFL license, available on Google Fonts and `@fontsource/instrument-serif` |
| Text font | **TeX Gyre Heros** (an open-source Helvetica clone, GUST Font License) *(css: `custom_183229` for body, `custom_183228` "Heros On" for H3)*. Sizes 12/16, 15/19, 16/20. H3 sizes 27/27 and 42/42, letter-spacing -0.1 |
| Micro labels | UPPERCASE, about 11–12px, Heros *(visual)* |
| Tags | 1px `#F4F4F4` outline, about 4px radius, Instrument Serif 14px *(visual)* |
| Cards | 1px outline at roughly 40% white, about 12px radius, numbered `(01)` in Instrument Serif at top right *(visual)* |
| Layout | Full-bleed and dark. A four-column "values" grid. Lots of empty vertical space *(visual)* |

## Component reference: appandflow.com (Next.js + Emotion)

### Colour variables *(css, verbatim)*
```css
:root{--color-bg-primary:#f0f0f0;--color-bg-secondary:#ffffff;--color-bg-menu:#ffffff7e;--color-footer-bg:#f0f0f080;
--color-text-primary:#121212;--color-text-secondary:#828282;--color-border:#1212120f;
--color-brand-primary:#3891ff;--color-brand-primary-transparent:#3892ff22}
[data-theme=dark]{--color-bg-primary:#121212;--color-bg-secondary:#1e2121;--color-bg-menu:#ffffff33;--color-footer-bg:#f0f0f01a;
--color-text-primary:#ffffff;--color-text-secondary:#999999;--color-border:#ffffff20;--color-brand-primary:#7bb6ff;--color-brand-primary-transparent:#7bb6ff70}
body{word-spacing:-2%} h3{letter-spacing:-2%}
```
Theme switches fade every colour over `.25s ease`.

### Primary button *(css, verbatim, this is the button to copy)*
```css
.btn-primary{height:52px;width:fit-content;padding:16px 32px;border-radius:40px;border:none;cursor:pointer;
  font-size:12px;font-family:Maru; /* GT Maru is a commercial font (Grilli Type), so swap it, see below */
  color:var(--color-bg-primary);background:var(--color-text-primary);transform-origin:bottom center}
.btn-primary:hover{animation:squish .3s ease-out}
@keyframes squish{0%{transform:scale(1,1)}33%{transform:scale(1.02,.98)}66%{transform:scale(.99,1.01)}100%{transform:scale(1,1)}}
@media (prefers-reduced-motion:reduce){.btn-primary:hover{animation:none}}
```
On the live site the source reads `padding:16px+32px`, which is invalid CSS. Use `16px 32px`.

### Secondary/ghost link button *(css)*
`padding:12px 16px; border-radius:40px`. The outline is an SVG `<rect rx="16.5" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round">` drawn as a dotted pill. The label colour moves from `--color-text-secondary` to `--color-text-primary` on hover, and the stroke opacity goes from 0.5 to 1 over `.3s`. The label is set in mono, for example `< Blog/ >`, weight 600, letter-spacing -0.36px.

### Wide tile button *(css)*
`height:50px; width:100%; padding:8px 32px; border-radius:16px; background:var(--color-border)` (`#1212120f`, a 6% tint). It uses the same squish animation on hover.

### Icon buttons *(css)*
- Social icons: `padding:16px; border-radius:99px; opacity:.4`. On hover, opacity goes to 1 and scale to 1.1 over `.3s`.
- Floating theme toggle: 48×48 circle at the bottom right. Background `--color-footer-bg` with `backdrop-filter:blur(7px)` and `box-shadow:0 4px 16px -4px rgba(0,0,0,.15)`. Scales to 1.1 on hover. Focus ring is `2px solid var(--color-brand-primary)` with a 2px offset. The sun and moon icons crossfade with `blur(6px)`.

### Surfaces *(css)*
- Section sheet: white `--color-bg-secondary`, a centred column about 480px wide, radius 32–40px *(visual)*.
- Cards: `padding:32px; border-radius:24px; background:var(--color-bg-primary)` (grey card on a white sheet), `gap:16px`.
- Row tiles: `padding:32px; border-radius:26px; border:1px solid transparent`.
- Tooltip pill: `padding:8px 16px; border-radius:40px; 1px solid var(--color-border)`, fades in over `.35s`.
- Bottom tab bar: a segmented pill with `padding:4px`, a blurred background, and an icon above a 11px label *(visual)*.
- Sticky header: background matches the page. A shadow `0 2px 6px -2px` appears on scroll.

### Type *(css)*
- Headings: Maru 32px/120%, weight 600, letter-spacing -4%. Sub-headings 24px, -3%. Inter for body. **DM Mono 500 UPPERCASE** for micro labels ("SERVICES", "WHAT IT IS", "↳YEAR 2025").
- Two-tone headline: the first sentence in primary text, the rest in `--color-text-secondary`, in the same paragraph.
- Accent word: one leading word in `--color-brand-primary` ("**Build** the best app").
- Badge: small pill in a blue tint, `#3892ff22` background with `#3891ff` text.

## Merged system for the clone

The plan combines the two references. April supplies the palette and fonts. App&Flow supplies the component geometry and motion.

```css
:root{ /* dark is the default, following April */
  --bg:#0a0a0a; --surface:#141414; --surface-2:#1e1e1e;
  --text:#f4f4f4; --text-2:#f4f4f4b8; --text-3:#f4f4f466;
  --border:#f4f4f420; --tint:#f4f4f40f;
  --accent:#0080ff; --accent-tint:#0080ff22;
  --font-display:"Instrument Serif",serif;      /* headlines, UPPERCASE, italic accents */
  --font-text:"TeX Gyre Heros","Helvetica Neue",Arial,sans-serif;
  --font-mono:"DM Mono",ui-monospace,monospace;  /* micro labels, citations, timestamps */
  --r-pill:40px; --r-card:24px; --r-tile:16px; --r-tag:4px;
}
[data-theme=light]{ --bg:#f0f0f0; --surface:#ffffff; --surface-2:#f0f0f0; --text:#121212; --text-2:#828282; --border:#1212120f; --tint:#1212120f; }
```
- Buttons copy App&Flow's geometry and squish animation exactly. The label uses `--font-text` 12px weight 700 instead of GT Maru (commercial). If a rounded face is wanted, the free option nearest to Maru's soft geometric shapes is **"M PLUS Rounded 1c"** or **"Nunito"**, both OFL.
- Headlines follow April: Instrument Serif, uppercase for section titles, and an italic clause inside sentence-case lead copy.
- Micro labels follow App&Flow: DM Mono, uppercase, 11px, `--text-3`.
- Copy rules: no hero subtitles longer than one line, no "unlock / supercharge / seamless / revolutionize", no emoji, no gradient blobs, no testimonial walls. One verb per button ("Start interview", "Generate", "Export").
