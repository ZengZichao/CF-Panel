# CF-Panel 文档目录

> **版本：0.1.0**

CF-Panel 是一款面向 phylogenomics 研究者的跨平台桌面工具，用于在参考树上解析、渲染、联动探索 IQ-TREE 2/3 计算的 gene / site concordance factor（gCF / sCF）以及 concordance vector（Ψ₁/Ψ₂/Ψ₃/Ψ₄ 四元组）。

## 文档索引

| 文档 | 说明 |
|------|------|
| [安装指南](./installation.md) | 如何安装 CF-Panel（预编译包 / 从源码构建） |
| [快速开始](./quick-start.md) | 5 分钟上手教程 |
| [用户手册](./user-guide.md) | 完整功能说明与操作指南 |
| [数据格式说明](./data-format.md) | IQ-TREE 输出文件格式与 CF-Panel 解析逻辑 |
| [架构设计](./architecture.md) | 系统架构、进程模型、三视图联动机制 |
| [开发者指南](./developer-guide.md) | 开发环境搭建、项目结构、构建与测试 |
| [常见问题](./faq.md) | 常见问题与解答 |
| [许可证与致谢](./license-credits.md) | 许可证信息与第三方致谢 |

## 技术栈

| 层 | 技术 | 许可证 |
|----|------|--------|
| 外壳 | Electron 30 | MIT |
| 构建 | electron-vite | MIT |
| 打包 | electron-builder | MIT |
| UI 框架 | React 18 + TypeScript 5 | MIT |
| 状态管理 | Zustand | MIT |
| 图表 | ECharts 5 | Apache-2.0 |
| 数据表格 | TanStack Table 8 | MIT |

## 相关链接

- [IQ-TREE 2](https://github.com/iqtree/iqtree2)
- [IQ-TREE Concordance Factor 文档](http://www.iqtree.org/doc/Concordance-Factor)
- [roblanf/concordance_vectors (MIT)](https://github.com/roblanf/concordance_vectors)
- [Minh, Hahn & Lanfear 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7475031/)
- [Lanfear & Hahn 2024 — concordance vector](https://iqtree.github.io/doc/recipes/concordance-vector)
