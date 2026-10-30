# License & Credits

> **Version 0.1.0**

## License

CF-Panel is licensed under the [MIT License](../../LICENSE).

```
MIT License

Copyright (c) 2026 CF-Panel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Third-Party Dependencies

| Dependency | License | Purpose |
|------------|---------|---------|
| Electron | MIT | Cross-platform desktop app framework |
| electron-vite | MIT | Electron + Vite build tool |
| electron-builder | MIT | Packaging tool |
| React | MIT | UI framework |
| TypeScript | MIT | Type-safe JavaScript |
| Zustand | MIT | State management |
| ECharts | Apache-2.0 | Chart library (ternary plot) |
| TanStack Table | MIT | Data table |

## Third-Party Data & References

| Project | License | Usage |
|---------|---------|-------|
| [roblanf/concordance_vectors](https://github.com/roblanf/concordance_vectors) | MIT | R script logic reference, parser semantic alignment |
| [IQ-TREE 2](https://github.com/iqtree/iqtree2) | GPL-2.0 | CLI wrapper target (source code not included) |
| bird_400 dataset | MIT | Built-in example data |

## Acknowledgments

CF-Panel builds upon the pioneering work of the following researchers:

### Methodological Papers

- **Minh, Hahn & Lanfear 2020**, *Systematic Biology* — Computational definition of gCF/sCF and IQ-TREE 2 implementation
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC7475031/
- **Mo, Lanfear, Hahn & Minh 2023** — Likelihood-based sCF (`--scfl`)
  - https://github.com/iqtree/iqtree2
- **Lanfear & Hahn 2024** — Concordance vector Ψ₁/Ψ₂/Ψ₃/Ψ₄ quaternion concept
  - https://iqtree.github.io/doc/recipes/concordance-vector

### Tools & Scripts

- **Robert Lanfear** — concordance_vectors R scripts (MIT license), semantic reference for CF-Panel's parser
- **Bui Quang Minh** — Author of IQ-TREE 2/3, implementer of gCF/sCF methods
- **Hahn Lab** — Collaborators in concordance factor methodology research

### Community

Thanks to the IQ-TREE user community and the phylogenomics research community for discussions and feedback on concordance factor analysis methods.
