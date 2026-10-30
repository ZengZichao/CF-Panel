# Design System Contract

> **Version: 0.1.0**
> **Scope**: all UI code under `src/renderer/**`
> **Maintenance rule**: any change to tokens or component APIs must update both language versions of this document.

## 1. Token Governance (Three Layers)

All design tokens live at the top of `src/renderer/styles.css`, organized in three layers. **Cross-layer consumption is forbidden**:

| Layer | Responsibility | Prefix / examples | Consumers |
|-------|----------------|-------------------|-----------|
| L1 Structure | Interface skeleton: surfaces, borders, text | `--bg-*` `--border-*` `--text-*` | All UI |
| L2 Brand & semantic | Interaction & feedback: primary / success / warning / error | `--color-*` `--accent-*` | Buttons, feedback, badges |
| L3 Data graphics | Chart-only: tree / ternary / color schemes | `--tree-*` `--ternary-*` | TreeCanvas, TernaryPlot |

### 1.1 Contrast Requirements (WCAG 2.2)

| Usage | Minimum ratio | Criterion |
|-------|---------------|-----------|
| Body text | 4.5:1 | 1.4.3 AA |
| Large text (≥18.66px bold) | 3:1 | 1.4.3 AA |
| Graphical elements (branches, ternary outline, grid, icon strokes) | 3:1 | 1.4.11 |

**Semantic color used as text must be `--color-primary-text` (not `--color-primary`)**:
in dark theme `#5e6ad2` on `#0f1011` is ≈4.4:1 (fails); `--color-primary-text` passes in both themes (≥5:1).

**Theme values are calibrated**:
- light `--color-success: #197a33` (5.4:1) / dark `#4ec46a` (8.7:1)
- light `--tree-branch-default: #707070` (4.5:1) / dark `#62666d`
- light `--ternary-grid-color: #949494` (3.0:1)

## 2. Feedback System

Single entry point `stores/feedback.ts`; single render slot `components/FeedbackRegion.tsx` (top-right toast stack).

| kind | Meaning | Screen-reader role | Auto-dismiss |
|------|---------|--------------------|--------------|
| success | Operation succeeded | `role="status"` polite | 3s |
| info | Neutral notice (may carry an action, e.g. Undo) | `role="status"` polite | 4s (10s with action) |
| warning | Capability gaps etc. | `role="alert"` | 6s |
| error | Failure requiring user action | `role="alert"` assertive | manual only |

Rules:
1. **Never** report success through the error channel.
2. Duplicate messages are de-duplicated.
3. Destructive operations must provide an `action` (e.g. Undo) with a window ≥10s.

## 3. Component Inventory

| Component | File | Notes |
|-----------|------|-------|
| Icon | `components/Icon.tsx` | 26 inline SVGs, 24×24, `currentColor` stroke, `aria-hidden`; **no new emoji allowed** |
| FeedbackRegion | `components/FeedbackRegion.tsx` | See §2 |
| ConfirmDialog | `components/ConfirmDialog.tsx` | `role="alertdialog"` + focus trap + Escape cancels + focus return; replaces `window.confirm` |
| OverflowMenu | `components/OverflowMenu.tsx` | APG Menu Button pattern: `aria-haspopup/expanded`, ↑↓/Home/End/Escape/Tab |
| useRovingRadio | `hooks/useRovingRadio.ts` | Radiogroup roving tabindex (single Tab stop + arrow cycling + focus follows); used by CFTypeSelector, view toggle, tree layout selector |

### 3.1 Header Information Architecture

```
[Logo] ｜ [Open Directory (primary)] [Open ▾] [Export ▾] [Clear (danger)]   …   [CF type] [View] [🌐] [Theme]
```

- Exactly one solid primary CTA; low-frequency actions (Open Files / Example Data) collapse into "Open ▾"; the three exports collapse into "Export ▾" (visible only with data).
- "Clear" is destructive: red outline + ConfirmDialog + 10s undo toast.
- Before adding a header action, ask: can it live in a menu? More than 5 sibling buttons is an information-architecture regression.

## 4. Keyboard Model

| Area | Keys | Behavior |
|------|------|----------|
| Table (role=grid) | ↑ ↓ Home End | Move row cursor (roving tabindex; stops at page boundaries) |
| Table | Enter / Space | Select cursor row, linked views update |
| Header | Tab + Enter | Toggle sort (real `<button class="th-sort">`) |
| Tree canvas / global | ↑ ↓ | Select next/previous branch; **↓ selects the first branch when nothing is selected** (no deadlock) |
| Tree canvas | Drag / Ctrl+Wheel / bare Wheel | Pan / zoom / vertical scroll (Shift = horizontal) |
| Radiogroup | ↑↓←→ | Cycle; focus follows |
| Splitter | ←→ (horizontal) / ↑↓ (vertical) / Home End | 8% step; Home/End = extremes; live aria-valuenow |
| Dialog | Escape / Tab | Cancel / focus trap |
| Settings panel | Escape / outside click | Close and return focus |

Mutual exclusion: keys inside the table grid, dialogs, menus and the settings panel **never** trigger global branch navigation (the global handler excludes via `closest('[role="grid"]…')`; components `stopPropagation`).

## 5. Numeric Formatting — Single Source of Truth

All through `lib/format.ts`; **never** call `toFixed` directly in components:

| Function | Semantics | Output |
|----------|-----------|--------|
| `formatPsi(v)` | Concordance factor (percentage) | `62.34%` (`{withUnit:false}` when the header already declares the unit) |
| `formatN(v)` | Counts (genes / sites / quartets) | Integer; at most 2 decimals when fractional |
| `formatLength(v)` | Branch length | 6 decimals |
| `formatPp(v)` | Posterior probability | 1 decimal |
| `formatBranchIdLabel(tpl, id)` | Branch label | `Branch #12` (i18n template) |

Rationale: `parse.ts buildVectors` normalizes quartet q1×100 into 0–100, matching gene/site as percentages — **no view may omit % for quartet Ψ**.

## 6. Layout & Responsiveness

- Breakpoints: `1366px` (lower density: hide panel hints / logo text, tighten controls) and `1200px` (compact header).
- Main-process window default size = `min(1600, workArea − 80)`, `minWidth 1024` — the fixed 1600×1000 that overflowed small screens is gone.
- Fonts: `@fontsource/inter` + `@fontsource/jetbrains-mono` bundled locally (imported in `main.tsx`); **no CDN fonts** (CSP tightened to `font-src 'self'`).

## 7. Motion Spec

| Variable | Value | Usage |
|----------|-------|-------|
| `--motion-duration-fast` | 100ms | Hover, press, color transitions |
| `--motion-duration-mid` | 200ms | Panel / popover enter-exit |
| `--motion-duration-slow` | 300ms | Theme switch |
| `--motion-ease` | cubic-bezier(0.4,0,0.2,1) | Standard easing |

Rules:
1. **`transition: all` is forbidden** — enumerate properties (background-color / border-color / color / box-shadow / transform).
2. Lift effect (`translateY(-1px)`) is button-only; **table rows must not transform** (prevents subpixel jitter).
3. Under `prefers-reduced-motion: reduce` all animation durations collapse to zero (global rule in place).

## 8. Empty States & Legends

- Every panel empty state = icon + one sentence + **next action** (Load example / Open directory, reusing `lib/loaders.ts`).
- Tree canvas and ternary plot show a persistent Ψ₁-share gradient legend (`SCHEME_GRADIENTS` endpoints match `getColorByScheme`).
- Tree canvas `role="img"` aria-label carries a branch-count summary.

## 9. Persistence Key Registry

| localStorage key | Owning store | Content |
|------------------|--------------|---------|
| `cfpanel-language` / `cfpanel-theme` | settings | Language, theme |
| `cfpanel-ui` | ui | viewMode + panel sizes (`main-horizontal` / `main-vertical`) |
| `cfpanel-tree-settings` | treeSettings (zustand persist; legacy key kept for compatibility) | Layout, color scheme, font size etc. (searchQuery not persisted) |
| `cfpanel-ternary-settings` | ternarySettings | Focus mode, convex hull, density contours |
| IndexedDB (persistence.ts) | selection / project | Selected branch, CF type, recent projects |

All new persistence must use the zustand `persist` middleware and be registered here.