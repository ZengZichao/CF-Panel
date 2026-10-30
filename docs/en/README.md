# CF-Panel Documentation Index

> **Version 0.1.0**

CF-Panel is a cross-platform desktop tool for phylogenomics researchers to parse, render, and interactively explore IQ-TREE 2/3 gene / site concordance factors (gCF / sCF) and concordance vectors (Ψ₁/Ψ₂/Ψ₃/Ψ₄ quaternions) on reference trees.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Installation Guide](./installation.md) | How to install CF-Panel (prebuilt binaries / build from source) |
| [Quick Start](./quick-start.md) | 5-minute getting started tutorial |
| [User Guide](./user-guide.md) | Full feature documentation and operation guide |
| [Data Format](./data-format.md) | IQ-TREE output file formats and CF-Panel parsing logic |
| [Architecture](./architecture.md) | System architecture, process model, three-view linking mechanism |
| [Developer Guide](./developer-guide.md) | Development setup, project structure, build and test |
| [FAQ](./faq.md) | Frequently asked questions |
| [License & Credits](./license-credits.md) | License information and third-party acknowledgments |

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

## Related Links

- [IQ-TREE 2](https://github.com/iqtree/iqtree2)
- [IQ-TREE Concordance Factor Documentation](http://www.iqtree.org/doc/Concordance-Factor)
- [roblanf/concordance_vectors (MIT)](https://github.com/roblanf/concordance_vectors)
- [Minh, Hahn & Lanfear 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7475031/)
- [Lanfear & Hahn 2024 — concordance vector](https://iqtree.github.io/doc/recipes/concordance-vector)
