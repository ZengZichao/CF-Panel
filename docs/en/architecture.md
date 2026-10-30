# Architecture

> **Version 0.1.0**

## 1. Process Model

CF-Panel is built on Electron with three process layers:

```
┌─────────────────────────────────────────────────┐
│ Electron Main Process (Node.js)                 │
│  - App lifecycle, menu, file dialogs             │
│  - IPC handlers: file I/O, IQ-TREE subprocess    │
└──────────┬──────────────────────────────────────┘
           │ IPC (contextBridge + ipcRenderer.invoke)
┌──────────▼──────────────────────────────────────┐
│ Renderer Process (React + Zustand)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Tree     │◄─┤ Ternary  │◄─┤ Vector   │       │
│  │ Canvas   │  │ Plot     │  │ Table    │       │
│  │(SVG/Canvas)│ │(ECharts) │  │(TanStack)│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│         ▲            ▲             ▲             │
│         └────────────┼─────────────┘             │
│                      │                            │
│         selectionStore (branch_id: number|null)  │
└──────────────────────────────────────────────────┘
```

### 1.1 Main Process

The main process handles:
- Creating the BrowserWindow
- IPC channel handlers:
  - `dialog:openDirectory` / `dialog:openFiles` / `dialog:saveFile`: File dialogs
  - `file:read` / `file:readCfDirectory` / `file:save`: File I/O
  - `iqtree:detectVersion` / `iqtree:run`: IQ-TREE subprocess management
  - `export:vectorsCSV`: CSV export

### 1.2 Preload

Exposes a safe API to the renderer process via `contextBridge`:
- File operations: `openDirectory`, `openFiles`, `saveFile`, `readFile`, `readCfDirectory`, `saveFileContent`
- IQ-TREE: `detectIQTreeVersion`, `runIQTree`
- Export: `exportVectorsCSV`

### 1.3 Renderer Process

Built on React 18 + TypeScript 5:

- **Component layer**: `TreeCanvas`, `TernaryPlot`, `VectorTable`, `SidePanel`, `CFTypeSelector`, `ResizablePanels`, `OverflowMenu`, `ConfirmDialog`, `FeedbackRegion`, `Icon`
- **State layer**: Zustand stores
- **Parser layer**: Pure TypeScript parser (cf.stat / Newick / vector builder)
- **i18n**: English/Chinese bilingual support

## 2. Three-View Linking Mechanism

### 2.1 Global Selection Store

A single global Zustand store manages selection state:

```typescript
interface SelectionState {
  selectedBranchId: number | null   // Primary selection
  hoveredBranchId: number | null     // Hover highlight
  filterPredicate: ((row: CFVector) => boolean) | null
  activeCFType: 'gene' | 'site' | 'quartet'
}
```

All three views subscribe to the same store, each only re-rendering "which rows/points/branches need highlighting." Zustand's subscription granularity is at the field level, avoiding full tree redraws.

### 2.2 Linking Matrix

| User Action | Tree Canvas | Ternary Plot | Vector Table |
|-------------|-------------|--------------|--------------|
| Hover tree branch | Branch thickens | Point enlarges + tooltip | Row highlights |
| Click tree branch | Color change + sidebar | Highlight, others fade | Scroll to row |
| Click ternary point | Select branch | Highlight | Row highlights |
| Table row click | Select branch | Select point | Row selected |
| Keyboard ↑↓ | Focus branch switch | Focus point switch | Table scroll follows |
| Switch CF type | Recolor | Redraw points | Column switch |

## 3. Parser Layer

### 3.1 Pure TypeScript Implementation

The parser is entirely TypeScript, no Python dependency:

- `parseCfStat(content: string): StatRow[]` — Parse cf.stat files
- `extractQuartetAnnotation(label: string): QuartetAnnotation | null` — Extract quartet annotations from Label column
- `buildVectors(gcfRows, scflRows, cblRows): CFVector[]` — Build 33-column CF vectors (32 + Label)
- `parseNewick(newickStr: string): ParsedNewick` — Parse Newick trees
- `layoutTree(root, width, height, branchIdMap, vectors, layoutType, useBranchLength): void` — Tree layout (Rectangular / Unrooted / Circular)

### 3.2 Semantic Alignment

Parsing logic strictly aligns with Lanfear's `concordance_vector.R` script:
- Ψ₂ = max(DF1, DF2), Ψ₃ = min(DF1, DF2) (larger value first after sorting)
- Quartet values = 100 × q1/q2/q3 (converted to percentage range 0-100)
- scfl rows as the primary table for left join

## 4. Theme System

- Dark theme and light theme (light is default)
- Implemented via CSS variables, no component re-render needed on toggle
- Theme preference persisted to localStorage

## 5. Internationalization

- Supports English and Chinese
- Translations managed centrally in `translations.ts`
- Language preference persisted to localStorage
- Defaults to Chinese
