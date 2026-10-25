# UI style alignment with the PhysioDB console

Date: 2026-10-25. Direction: the user asked PF to reference the PhysioDB console's UI style
("可以参考DB的ui风格") — the two tools are used by the same lab and should read as one family.
This pass changes **visual language only**; it must not change behaviour, markup structure or data flow.

Reference implementation: `F:/AI产出/repos/physiodb/web` (Tailwind 4 + shadcn/ui + Geist).
Reference values below were read from that repo's `src/index.css`, `src/lib/layout.ts` and
`src/routes/_authenticated.tsx` — quote them, do not invent another palette.

## What the DB console actually looks like

| Aspect | Value |
|---|---|
| Palette | **pure neutral grayscale**, no tint. Light: background/card `#ffffff`, sidebar/muted `#fafafa`, foreground `#252525`, muted-foreground `#737373`, border `#e5e5e5` |
| Primary action | **near-black** (`#333333`) filled button, white label — *not* colored |
| Accent colour | only the brand mark is green (`#1f6b46`); green is a status colour, never the primary button |
| Radius | `0.625rem` (10 px) on cards/inputs, 8 px on small controls, no pills except avatars |
| Elevation | **borders, not shadows**. No hover lift, no `translateY` |
| Type | Geist Variable, one sans family, no serifs anywhere. Page heading ≈ 20–24 px semibold, section label 12–13 px muted |
| Density | tables and rows first: 44–48 px row height, 12–14 px body text, 10–12 px meta |
| Shell | sidebar 240 px (collapsible to icons) on `#fafafa`, sticky 56 px header with a 1 px bottom border, content in `max-width: 1024px` with 24 px padding |
| Icons | lucide, 16 px, stroke 1.5 |
| Dark mode | inverted neutrals (`#252525` surface), same radii, same borders |

## What PF does today (the mismatch)

- Green-tinted neutrals and a green **primary** button on every surface.
- Warm paper background (`#fffefb` / `#f4f8f5`), serif (Georgia) numerals for stats, 16–20 px card radii.
- Card shadows + `translateY(-3px)` hover lift.
- Headings up to `clamp(1.8rem, 3vw, 2.5rem)` — larger than the console's whole hierarchy.

## Target for PF (this pass)

Edit **`src/theme/tokens.css` only** for the scale, then the two surfaces in scope (projects list and the
workspace shell in `src/dashboard.css`). Leave `src/composer/**`, `src/admin-monitor.css`,
`src/participant-ui.css` and `src/analysis/**` untouched.

1. **Neutral scale, no green tint**

   ```css
   --ink:#252525; --ink-soft:#3d3d3d; --muted:#737373; --muted-strong:#525252;
   --paper:#ffffff; --paper-soft:#fafafa; --surface:#f5f5f5;
   --line:#e5e5e5; --line-strong:#d4d4d4;
   ```

   Keep the green ramp for status/brand (`--green-600:#1f6b46`), but **stop using green as the primary
   button background**: primary = `--ink` (#333), hover `#1a1a1a`. Green stays on success chips,
   the brand mark, and focus rings.

2. **Shape and elevation**

   ```css
   --r-control:8px; --r-card:10px; --r-md:8px; --r-lg:10px; --r-xl:12px;
   --shadow-sm:none; --shadow-card:none; --shadow-card-hover:none;
   ```

   Cards/lists = 1 px `--line` border, no shadow, no hover lift. Hover = background `--paper-soft`.

3. **Type**

   - One sans stack: `"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Yu Gothic UI", "Hiragino Sans", sans-serif`. Do **not** add a font dependency; Geist simply falls through when absent.
   - Remove `Georgia` from headings and from the stat numerals (`font:500 26px/1 Georgia,serif` → tabular numbers in the sans stack).
   - Heading scale: page `h1` 22 px / 600, section title 14 px / 600, body 13–14 px, meta 11–12 px.

4. **Density**

   - Project list rows: 48 px min height, 1 px separators, no zebra.
   - Page content `max-width: 1024px`, 24 px padding, sticky 56 px top bar with a 1 px border.

5. **Status colours** (unchanged semantics, neutral presentation)

   - 記録あり / 保存済み / 良好 → green text `#1f6b46` on `#eef7f1`, 1 px `#cfe3d6` border
   - 準備中 / 注意 → amber `#8b5e14` on `#fdf2dc`, 1 px `#ecd9ae`
   - 失敗 / 使用不可 → red `#a32e25` on `#fdeceb`, 1 px `#f3cfcb`
   - Everything else: neutral chip, `--surface` background, `--line` border, `--muted` text

## Acceptance

- The projects page and the workspace shell use the neutral palette; the only green left on screen is
  status/brand (count them: at most 2 green surfaces per row).
- No serif text remains on the projects page; no card shadows; no hover lift.
- Dark mode still legible (existing `.dark-mode` block adjusted to the same neutral scale).
- `npm test`, `npm run lint -- --max-warnings=0`, `npm run build` stay green; no horizontal overflow at
  320 / 768 / 1440 px.
- **Screenshot verification is done by Hermes**, not by the agent: the agent reports the token values it
  applied; Hermes captures the projects page, the composer and `/admin` at 1440 × 900 and decides whether
  the change stays global or gets scoped back to the workspace shell.
