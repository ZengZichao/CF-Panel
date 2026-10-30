# Developer Guide

> **Version 0.1.0**

## 1. Development Setup

### 1.1 Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- [Git](https://git-scm.com/)
- VS Code recommended

### 1.2 Clone & Install

```bash
git clone https://github.com/cf-panel/cf-panel.git
cd cf-panel
npm install
```

### 1.3 Development Run

```bash
npm run dev    # Start electron-vite dev server
```

Development mode supports hot reload — code changes auto-refresh the app.

## 2. Project Structure

```
cf-panel/
├── package.json                # Project config & dependencies
├── electron.vite.config.ts     # electron-vite build config
├── electron-builder.yml        # electron-builder packaging config
├── tsconfig.json               # TypeScript config
├── LICENSE                     # MIT license
├── README.md                   # Project README
├── CONTRIBUTING.md             # Contribution guide
├── docs/                       # Documentation
│   ├── zh/                     # Chinese docs
│   └── en/                     # English docs
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.ts            # IPC handlers, file dialogs, IQ-TREE subprocess
│   │   ├── ipc-schemas.ts      # Zod IPC validation schemas
│   │   ├── iqtree-adapter.ts   # IQ-TREE version adapter
│   │   └── iqtree-adapter.test.ts # Adapter unit tests
│   ├── preload/
│   │   └── index.ts            # contextBridge API
│   ├── renderer/               # Renderer process (React)
│   │   ├── App.tsx             # Main layout & three-view linking
│   │   ├── main.tsx            # React entry
│   │   ├── index.html          # HTML template
│   │   ├── styles.css          # Global styles (dark/light theme)
│   │   ├── components/         # UI components
│   │   │   ├── TreeCanvas.tsx    # SVG/Canvas tree rendering
│   │   │   ├── TernaryPlot.tsx   # ECharts ternary scatter
│   │   │   ├── VectorTable.tsx   # TanStack Table
│   │   │   ├── SidePanel.tsx     # Branch detail panel
│   │   │   ├── CFTypeSelector.tsx # gene/site/quartet toggle
│   │   │   ├── ResizablePanels.tsx # Resizable panel layout
│   │   │   ├── OverflowMenu.tsx  # Overflow menu
│   │   │   ├── ConfirmDialog.tsx # Confirmation dialog
│   │   │   ├── FeedbackRegion.tsx # Toast feedback region
│   │   │   └── Icon.tsx          # Inline SVG icon set
│   │   ├── stores/             # Zustand state management
│   │   │   ├── selection.ts      # Global selection state
│   │   │   ├── project.ts        # Project data state
│   │   │   ├── settings.ts       # Settings (theme/language/i18n)
│   │   │   ├── ui.ts             # UI state (view mode)
│   │   │   ├── feedback.ts       # Toast feedback
│   │   │   ├── persistence.ts    # IndexedDB persistence
│   │   │   ├── treeSettings.ts   # Tree rendering settings
│   │   │   └── ternarySettings.ts # Ternary plot settings
│   │   ├── lib/                # Utilities
│   │   │   ├── parse.ts         # Pure TS parser
│   │   │   ├── parse.test.ts     # Parser tests
│   │   │   ├── loaders.ts        # Data loading/export actions
│   │   │   ├── format.ts        # Numeric formatting
│   │   │   ├── example-data.ts  # Example data loader
│   │   │   └── canvas-tree-renderer.ts # Canvas tree renderer
│   │   ├── hooks/
│   │   │   └── useRovingRadio.ts # Roving tabindex
│   │   ├── i18n/
│   │   │   └── translations.ts  # EN/ZH translations
│   │   ├── types/
│   │   │   ├── cf.ts            # CF type definitions
│   │   │   └── raw.d.ts         # Vite ?raw import declaration
│   │   ├── assets/
│   │   │   └── logo.svg          # Application logo
│   │   └── example-data/        # Built-in example data files
│   └── types/
│       └── cf.ts                 # Shared type definitions
├── out/                        # Build output (gitignored)
└── dist/                       # Package output (gitignored)
```

## 3. Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode (hot reload) |
| `npm run build` | Build production version (no packaging) |
| `npm run preview` | Preview built version |
| `npm run pack` | Package (no installer) |
| `npm run dist` | Package with installer (current platform) |
| `npm run dist:win` | Package for Windows (exe) |
| `npm run dist:mac` | Package for macOS (dmg) |
| `npm run dist:linux` | Package for Linux (AppImage / deb) |

## 4. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Shell | Electron | 30+ |
| Build | electron-vite | 2.x |
| Packaging | electron-builder | 24.x |
| UI | React | 18.x |
| Language | TypeScript | 5.x |
| State | Zustand | 4.x |
| Charts | ECharts | 5.x |
| Table | TanStack Table | 8.x |

## 5. Adding New Features

### 5.1 Add a New Translation Key

1. Add the field to `TranslationKey` interface in `src/renderer/i18n/translations.ts`
2. Add corresponding translations to `en` and `zh` objects
3. Use in components via `const { t } = useSettingsStore()`

### 5.2 Add a New IPC Handler

1. Add `ipcMain.handle(...)` in `src/main/index.ts`
2. Add corresponding method to the `api` object in `src/preload/index.ts`
3. Call via `window.cfpanel.xxx()` in the renderer process

### 5.3 Add a New CF Type

1. Add the new type to `CFType` in `src/renderer/types/cf.ts`
2. Add branches to `getPsiValues` and `getNValues` in `src/renderer/lib/parse.ts`
3. Add a button in `src/renderer/components/CFTypeSelector.tsx`
4. Add corresponding columns in `src/renderer/components/VectorTable.tsx`

## 6. Coding Conventions

- TypeScript strict mode (`strict: true`)
- Functional components + Hooks
- Zustand for state management (avoid prop drilling)
- CSS variables for theming
- No `any` type (unless unavoidable when parsing external data)

## 7. Debugging

### 7.1 Main Process

In dev mode, `console.log` in the main process outputs to the terminal that launched Electron.

### 7.2 Renderer Process

In dev mode, press `F12` or `Ctrl+Shift+I` to open DevTools.

### 7.3 Common Issues

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, reinstall |
| Electron download fails | Set `ELECTRON_MIRROR` environment variable |
| Build fails | Check Node.js version >= 18 |
