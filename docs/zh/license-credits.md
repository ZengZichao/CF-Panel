# 许可证与致谢

> **版本：0.1.0**

## 许可证

CF-Panel 使用 [MIT 许可证](../../LICENSE)。

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

## 第三方依赖

| 依赖 | 许可证 | 用途 |
|------|--------|------|
| Electron | MIT | 跨平台桌面应用框架 |
| electron-vite | MIT | Electron + Vite 构建工具 |
| electron-builder | MIT | 打包工具 |
| React | MIT | UI 框架 |
| TypeScript | MIT | 类型安全 JavaScript |
| Zustand | MIT | 状态管理 |
| ECharts | Apache-2.0 | 图表库（三元图） |
| TanStack Table | MIT | 数据表格 |

## 第三方数据与参考

| 项目 | 许可证 | 用途 |
|------|--------|------|
| [roblanf/concordance_vectors](https://github.com/roblanf/concordance_vectors) | MIT | R 脚本逻辑参考，解析层语义对齐 |
| [IQ-TREE 2](https://github.com/iqtree/iqtree2) | GPL-2.0 | CLI wrapper 对象（不包含源码） |
| bird_400 数据集 | MIT | 内置示例数据 |

## 致谢

CF-Panel 的开发基于以下研究者的开创性工作：

### 方法学论文

- **Minh, Hahn & Lanfear 2020**, *Systematic Biology* — gCF/sCF 的可计算定义与 IQ-TREE 2 实现
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC7475031/
- **Mo, Lanfear, Hahn & Minh 2023** — likelihood-based sCF（`--scfl`）
  - https://github.com/iqtree/iqtree2
- **Lanfear & Hahn 2024** — concordance vector Ψ₁/Ψ₂/Ψ₃/Ψ₄ 四元组概念
  - https://iqtree.github.io/doc/recipes/concordance-vector

### 工具与脚本

- **Robert Lanfear** — concordance_vectors R 脚本（MIT 许可），CF-Panel 解析层的语义参考
- **Bui Quang Minh** — IQ-TREE 2/3 的作者，gCF/sCF 方法的实现者
- **Hahn Lab** — concordance factor 方法学研究的合作者

### 社区

感谢 IQ-TREE 用户社区和 phylogenomics 研究者社区对 concordance factor 分析方法的讨论和反馈。
