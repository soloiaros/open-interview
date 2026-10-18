# Design spec

## Direction card

- **Category:** B2B knowledge-capture tool. The people using it are experts with little time and the team leads who assign them interviews.
- **First screen in the app:** start an interview, or continue one. Everything else comes second.
- **North star:** a quiet dark room. One person talks and the company remembers.
- **Style source (fixed by the brief):**
  - aprilleihuanani.com supplies the palette and type.
  - appandflow.com supplies the controls and their geometry.
- **Palette:**
  - Background `#0a0a0a`, surface `#141414`, raised `#1e1e1e`.
  - Text `#f4f4f4`, secondary text at 72%, tertiary at 40%.
  - Borders `#f4f4f4` at 12%.
  - One accent, `#0080ff`. It is used only for live state, the current topic, and citation chips.
- **Type:**
  - Instrument Serif: display, uppercase for section titles, italic for one accent clause.
  - TeX Gyre Heros: all UI and body text, 15/24 for body.
  - DM Mono 500: uppercase micro labels, timestamps, citation numbers.
- **Controls (App&Flow geometry):**
  - Primary: 52px pill, radius 40, inverted colours (light pill on dark), 12px/700 label, squish keyframe on hover.
  - Ghost: dotted SVG pill outline. Tile: 50px, radius 16, 6% tint.
  - Round icon buttons. A floating segmented tab bar with backdrop blur.
- **Surfaces:** cards with radius 24 and 32px padding, never nested. Thin 1px borders only where whitespace can't separate.
- **Icons:** characters first (→ ↗ ●). Where an icon is needed, Lucide at 1.5px stroke, 16px.
- **Motion (the three basic motions):**
  1. The primary button squish, plus a 0.97 press scale.
  2. A sliding indicator in the tab bar and in the mode selector.
  3. A first-entry stagger of 40 to 60ms per item, played once.
  - Interview screen: the voice visualizer is the one visual focal point.
  - `prefers-reduced-motion` turns all of this off.
- **Copy:** stop-slop rules. Buttons say what happens ("Start interview", "Generate draft", "Publish to wiki"). No taglines beyond one line. No emoji.
