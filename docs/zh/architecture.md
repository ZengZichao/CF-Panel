# 架构设计

> **版本：0.1.0**

## 1. 进程模型

CF-Panel 基于 Electron 架构，包含三个进程层：

```
┌─────────────────────────────────────────────────┐
│ Electron Main Process (Node.js)                 │
│  - 应用生命周期、菜单、文件对话框                  │
│  - IPC 处理器：文件读写、IQ-TREE 子进程、导出      │
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

主进程负责：
- 创建 BrowserWindow
- IPC 通道处理：
  - `dialog:openDirectory` / `dialog:openFiles` / `dialog:saveFile`：文件对话框
  - `file:read` / `file:readCfDirectory` / `file:save`：文件读写
  - `iqtree:detectVersion` / `iqtree:run`：IQ-TREE 子进程管理
  - `export:vectorsCSV`：CSV 导出

### 1.2 Preload

通过 `contextBridge` 向渲染进程暴露安全 API：
- 文件操作：`openDirectory`, `openFiles`, `saveFile`, `readFile`, `readCfDirectory`, `saveFileContent`
- IQ-TREE：`detectIQTreeVersion`, `runIQTree`
- 导出：`exportVectorsCSV`

### 1.3 Renderer Process

渲染进程基于 React 18 + TypeScript 5：

- **组件层**：`TreeCanvas`, `TernaryPlot`, `VectorTable`, `SidePanel`, `CFTypeSelector`, `ResizablePanels`, `OverflowMenu`, `ConfirmDialog`, `FeedbackRegion`, `Icon`
- **状态层**：Zustand stores
- **解析层**：纯 TypeScript 解析器（cf.stat / Newick / vector builder）
- **i18n**：中英文双语支持

## 2. 三视图联动机制

### 2.1 全局 Selection Store

单一全局 Zustand store 管理选中状态：

```typescript
interface SelectionState {
  selectedBranchId: number | null   // 主选中
  hoveredBranchId: number | null     // 悬停高亮
  filterPredicate: ((row: CFVector) => boolean) | null
  activeCFType: 'gene' | 'site' | 'quartet'
}
```

三视图订阅同一 store，各自只做"哪些行/点/分支需要高亮"的重渲染。Zustand 的订阅粒度到字段级，避免全树重绘。

### 2.2 联动矩阵

| 用户动作 | 树画布 | 三元图 | 向量表 |
|----------|--------|--------|--------|
| hover 树分支 | 分支加粗 | 对应点放大 + tooltip | 对应行高亮 |
| click 树分支 | 变色 + 侧栏 | 高亮 + 其余变淡 | 滚动到行 |
| click 三元图点 | 选中分支 | 高亮 | 行高亮 |
| 表格 row click | 选中分支 | 选中点 | 行选中 |
| 键盘 ↑↓ | 焦点分支切换 | 焦点点切换 | 表格滚动跟随 |
| 切换 CF 类型 | 重着色 | 重绘散点 | 列切换 |

## 3. 解析层

### 3.1 纯 TypeScript 实现

解析层完全用 TypeScript 实现，无需 Python 依赖：

- `parseCfStat(content: string): StatRow[]` — 解析 cf.stat 文件
- `extractQuartetAnnotation(label: string): QuartetAnnotation | null` — 从 Label 列提取 quartet 注解
- `buildVectors(gcfRows, scflRows, cblRows): CFVector[]` — 构建 33 列 CF 向量（32 + Label）
- `parseNewick(newickStr: string): ParsedNewick` — 解析 Newick 树
- `layoutTree(root, width, height, branchIdMap, vectors): void` — 矩形树布局算法

### 3.2 语义对齐

解析逻辑严格对齐 Lanfear 的 `concordance_vector.R` 脚本：
- Ψ₂ = max(DF1, DF2)，Ψ₃ = min(DF1, DF2)（排序后的大值在前）
- Quartet Ψ 值使用 round 到指定小数位
- 以 scfl 行为主表进行 left join

## 4. 主题系统

- 暗色主题和亮色主题（亮色为默认）
- 通过 CSS 变量实现，切换时无需重新渲染组件
- 主题选择持久化到 localStorage

## 5. 国际化

- 支持英文和中文
- 通过 `translations.ts` 集中管理翻译
- 语言选择持久化到 localStorage
- 默认中文
