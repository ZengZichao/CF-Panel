# CF-Panel

> Desktop tool for exploring IQ-TREE concordance factors with three linked views.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CF-Panel** is a cross-platform desktop application for phylogenomics researchers working with IQ-TREE 2/3 concordance factor (CF) analyses. It parses IQ-TREE output files and provides three synchronized, interactive views for exploring gene, site, and quartet concordance:

- **Tree Canvas** — Phylogenetic tree with branch-level CF coloring, search, zoom/pan, and multiple layout options
- **Ternary Plot** — Ψ₁/Ψ₂/Ψ₃ projection onto an equilateral triangle with Ψ₄ warning indicator
- **Vector Table** — All 33 concordance vector columns, sortable, searchable, paginated

All three views are **linked**: click any branch, point, or row, and the other two views update in real time.

---

## Features

- **Three linked views** — tree, ternary plot, and vector table synchronized via a single selection store
- **33-column concordance vectors** — semantically aligned with Lanfear's `concordance_vector.R` R script
- **Gene / Site / Quartet** — switch between gCF, sCF, and qCF types; all views re-color and re-project
- **IQ-TREE integration** — detect installed IQ-TREE version and run concordance analysis directly from the app
- **Export** — CSV (vectors), PNG (tree or ternary), SVG (tree or ternary)
- **Dark / Light themes** — Linear-inspired design language with WCAG 2.2 contrast compliance
- **Bilingual UI** — English and Chinese, with persistent preference
- **Keyboard navigation** — arrow keys to traverse branches, Escape to deselect, roving tabindex throughout
- **Offline example data** — built-in bird_400 dataset (363 branches) for instant exploration

---

## Quick Start

### Option 1: Download a prebuilt binary

Download the installer or portable executable from the [Releases](https://github.com/ZengZichao/CF-Panel/releases) page:

| Platform | File |
|----------|------|
| Windows | `CF-Panel-Setup-0.1.0.exe` (installer) or `CF-Panel-0.1.0-portable.exe` (portable) |
| macOS | `CF-Panel-0.1.0.dmg` |
| Linux | `CF-Panel-0.1.0.AppImage` or `CF-Panel-0.1.0.deb` |

### Option 2: Build from source

```bash
git clone https://github.com/ZengZichao/CF-Panel.git
cd CF-Panel
npm install
npm run dev        # Development mode with hot-reload
npm run build      # Production build
npm run dist:win   # Package for Windows
```

**Requirements:** Node.js 18+, npm 9+

---

## Usage

1. Launch CF-Panel — the welcome screen offers **Load Example Data**, **Open Directory**, or **Open Files**
2. If you have IQ-TREE output: click **Open Directory** and select the folder containing `gcf.cf.stat`, `scfl.cf.stat`, etc.
3. The tree, ternary plot, and vector table populate and link automatically
4. Click any branch / point / row to explore — all views synchronize
5. Use the **Gene / Site / Quartet** selector to switch concordance types
6. Export CSV, PNG, or SVG from the toolbar

### Supported File Formats

| File | Required | Description |
|------|----------|-------------|
| `gcf.cf.stat` | Yes | Gene concordance statistics (12 columns) |
| `scfl.cf.stat` | Yes | Site concordance statistics (10 columns) |
| `coalescent_bl.cf.stat` | No | Coalescent branch length statistics |
| `gcf.cf.tree` | No | Newick tree with `[q1=...]/sCF/gCF` labels |
| `gcf.cf.branch` | No | Newick tree with branch ID labels (join key) |

---

## Data Model

CF-Panel produces 33-column concordance vectors (32 + Label):

```
ID, Label,
gene_psi1, gene_psi2, gene_psi3, gene_psi4,
gene_psi1_N, gene_psi2_N, gene_psi3_N, gene_psi4_N, gene_N,
site_psi1, site_psi2, site_psi3, site_psi4,
site_psi1_N, site_psi2_N, site_psi3_N, site_psi4_N, site_N,
quartet_psi1, quartet_psi2, quartet_psi3, quartet_psi4,
quartet_psi1_N, quartet_psi2_N, quartet_psi3_N, quartet_psi4_N, quartet_N,
quartet_psi1_pp, quartet_psi2_pp, quartet_psi3_pp,
length_subs_per_site, length_coalescent
```

### Ψ value mapping

| Ψ | Gene | Site | Quartet |
|-----|------|------|---------|
| Ψ₁ | gCF | sCF | 100 × q1 |
| Ψ₂ | max(gDF1, gDF2) | max(sDF1, sDF2) | 100 × max(q2, q3) |
| Ψ₃ | min(gDF1, gDF2) | min(sDF1, sDF2) | 100 × min(q2, q3) |
| Ψ₄ | gDFP | 0 | 0 |

---

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Shell | Electron 30 | MIT |
| Build | electron-vite | MIT |
| Packaging | electron-builder | MIT |
| UI Framework | React 18 + TypeScript 5 | MIT |
| State Management | Zustand | MIT |
| Charts | ECharts 5 | Apache-2.0 |
| Data Table | TanStack Table 8 | MIT |

---

## Documentation

Full documentation in English and Chinese is available under [`docs/`](./docs/):

- [Installation Guide](./docs/en/installation.md) | [安装指南](./docs/zh/installation.md)
- [Quick Start](./docs/en/quick-start.md) | [快速开始](./docs/zh/quick-start.md)
- [User Guide](./docs/en/user-guide.md) | [用户手册](./docs/zh/user-guide.md)
- [Data Format](./docs/en/data-format.md) | [数据格式说明](./docs/zh/data-format.md)
- [Architecture](./docs/en/architecture.md) | [架构设计](./docs/zh/architecture.md)
- [Developer Guide](./docs/en/developer-guide.md) | [开发者指南](./docs/zh/developer-guide.md)
- [Design System](./docs/en/design-system.md) | [设计系统](./docs/zh/design-system.md)
- [FAQ](./docs/en/faq.md) | [常见问题](./docs/zh/faq.md)
- [License & Credits](./docs/en/license-credits.md) | [许可证与致谢](./docs/zh/license-credits.md)

---

## References

- Minh, Hahn & Lanfear 2020, *Systematic Biology* — gCF/sCF definition: https://pmc.ncbi.nlm.nih.gov/articles/PMC7475031/
- Mo, Lanfear, Hahn & Minh 2023 — likelihood-based sCF (`--scfl`)
- Lanfear & Hahn 2024 — concordance vector Ψ₁/Ψ₂/Ψ₃/Ψ₄: https://iqtree.github.io/doc/recipes/concordance-vector
- IQ-TREE 2: https://github.com/iqtree/iqtree2
- roblanf/concordance_vectors (MIT): https://github.com/roblanf/concordance_vectors

## License

[MIT](./LICENSE)
