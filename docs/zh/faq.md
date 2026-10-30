# 常见问题

> **版本：0.1.0**

## 1. 通用问题

### Q: CF-Panel 支持 IQ-TREE 2 和 IQ-TREE 3 吗？

A: 是的。CF-Panel 解析的文件格式（`gcf.cf.stat`、`scfl.cf.stat` 等）在 IQ-TREE 2 和 3 之间兼容。如果 IQ-TREE 3 的输出格式有变化，解析层使用 adapter pattern 可以轻松适配。

### Q: CF-Panel 需要安装 IQ-TREE 才能使用吗？

A: 不需要。CF-Panel 可以直接解析已有的 IQ-TREE 输出文件。IQ-TREE 仅在您希望从 CF-Panel 内直接运行 concordance 分析时才需要安装。

### Q: CF-Panel 支持哪些操作系统？

A: Windows 10+、macOS 11+、Linux（Ubuntu 20.04+/Debian 11+）。

### Q: CF-Panel 是免费的吗？

A: 是的。CF-Panel 采用 MIT 许可证，完全免费开源。

## 2. 数据加载

### Q: 支持哪些文件格式？

A: CF-Panel 解析以下 IQ-TREE 输出文件：
- `gcf.cf.stat`（必需）
- `scfl.cf.stat`（必需）
- `coalescent_bl.cf.stat`（可选）
- `gcf.cf.tree`（可选）
- `gcf.cf.branch`（可选）

### Q: 打开目录后提示「未找到有效的 CF 数据」

A: 请检查所选目录是否包含 `gcf.cf.stat` 和 `scfl.cf.stat` 文件。这两个文件是必需的。如果文件名不同，可以使用「打开文件」手动选择。

### Q: 可以只加载部分文件吗？

A: 可以。使用「打开文件」按钮选择需要的文件。CF-Panel 会根据文件名自动识别文件类型。缺少的文件对应的列将显示为 0。

### Q: 示例数据是什么？

A: bird_400 数据集，来自 IQ-TREE recipe（MIT 许可），包含 363 个分支的完整 CF 分析输出。可以直接体验全部功能而无需任何外部文件。

## 3. 功能使用

### Q: Ψ₁/Ψ₂/Ψ₃/Ψ₄ 分别代表什么？

A:
- **Ψ₁**：一致性因子（concordance factor），与参考树一致的比例
- **Ψ₂**：主要冲突（major discordance），max(DF1, DF2)
- **Ψ₃**：次要冲突（minor discordance），min(DF1, DF2)
- **Ψ₄**：全部其他冲突（仅 gene 类型），其余类型为 0

### Q: 三元图中的点代表什么？

A: 每个点代表一个内部分支。点的位置由 Ψ₁/Ψ₂/Ψ₃ 的归一化值决定。越靠近左下角（Ψ₁），表示一致性越高；越靠近右下角或顶部，表示冲突越大。

### Q: 导出的 CSV 格式是什么？

A: 33 列 CSV（32 + Label），与 Lanfear 的 `concordance_vector.R` 脚本输出格式对齐。包含 ID、Label、gene/site/quartet 的 Ψ 值和 N 值、后验概率、分支长度。

### Q: 如何切换语言？

A: 点击右上角的 🇬🇧/🇨🇳 按钮切换英文/中文。语言选择会持久化到浏览器存储。

### Q: 如何切换主题？

A: 点击右上角的 🌙/☀️ 按钮切换暗色/亮色主题。主题选择会持久化。

## 4. 性能

### Q: 树很大时会卡顿吗？

A: CF-Panel 使用 SVG/Canvas 渲染（根据分支数量自动选择），对于 1000 个以内分支的树性能良好。更大的树可以使用缩放和平移功能。

### Q: 支持多大的数据集？

A: 已测试过 363 个分支（bird_400 数据集）的流畅渲染。理论上可以处理数千个分支的解析，但渲染性能可能受限。

## 5. 与其他工具的关系

### Q: CF-Panel 与 Lanfear 的 concordance_vectors R 脚本有什么关系？

A: CF-Panel 的解析层语义对齐了 Lanfear 的 R 脚本输出。导出的 CSV 文件可以直接与 R 脚本的输出进行对比验证。

### Q: CF-Panel 与 FigTree/iTOL/Dendroscope 有什么区别？

A: CF-Panel 专门为 concordance factor 分析设计，解决了 FigTree/iTOL/Dendroscope 无法正确解析 cf.tree 斜杠标签的问题，并提供了三视图联动探索功能。

### Q: CF-Panel 与 IQ-TREE 是什么关系？

A: CF-Panel 是独立的第三方工具，不包含 IQ-TREE 源码。CF-Panel 解析 IQ-TREE 的输出文件，也可以作为 CLI wrapper 调用 IQ-TREE 运行 concordance 分析。
