# 设计系统契约

> **版本：0.1.0**
> **适用范围**：`src/renderer/**` 全部 UI 代码
> **维护约定**：改动 token / 组件 API 时必须同步更新本文档中英两份

## 1. Token 三层治理

所有设计 token 定义于 `src/renderer/styles.css` 顶部，按职责分三层，**禁止跨层消费**：

| 层 | 职责 | token 前缀 / 例子 | 消费方 |
|----|------|-------------------|--------|
| L1 结构层 | 界面骨架：表面、边框、文字 | `--bg-*` `--border-*` `--text-*` | 全部 UI |
| L2 品牌语义层 | 交互与反馈：primary / success / warning / error | `--color-*` `--accent-*` | 按钮、反馈、徽章 |
| L3 数据图元层 | 图表专用：树 / 三元图 / 配色方案 | `--tree-*` `--ternary-*` | TreeCanvas、TernaryPlot |

### 1.1 对比度硬性指标（WCAG 2.2）

| 用途 | 最低比率 | 依据 |
|------|----------|------|
| 正文文字 | 4.5:1 | 1.4.3 AA |
| 大号文字（≥18.66px bold） | 3:1 | 1.4.3 AA |
| 图形元素（树枝、三元框、网格、图标描边） | 3:1 | 1.4.11 |

**作文字使用的语义色必须用 `--color-primary-text`（而非 `--color-primary`）**：
暗色主题下 `#5e6ad2` 在 `#0f1011` 上约 4.4:1 不达标；`--color-primary-text` 双主题均 ≥5:1。

**双主题取值经演算校准**：
- light `--color-success: #197a33`（5.4:1）/ dark `#4ec46a`（8.7:1）
- light `--tree-branch-default: #707070`（4.5:1）/ dark `#62666d`
- light `--ternary-grid-color: #949494`（3.0:1）

## 2. 反馈系统

单一入口 `stores/feedback.ts`，单一渲染位 `components/FeedbackRegion.tsx`（右上角堆叠 toast）。

| kind | 语义 | 读屏角色 | 自动消失 |
|------|------|----------|----------|
| success | 操作成功 | `role="status"` polite | 3s |
| info | 中性提示（含撤销动作） | `role="status"` polite | 4s（含动作时 10s） |
| warning | 能力缺失等 | `role="alert"` | 6s |
| error | 失败，需用户处置 | `role="alert"` assertive | 不自动消失 |

规则：
1. **禁止**用 error 通道报成功。
2. 同文案推送自动去重。
3. 破坏性操作必须提供 `action`（如「撤销」），撤销窗口 ≥10s。

## 3. 组件清单

| 组件 | 文件 | 要点 |
|------|------|------|
| Icon | `components/Icon.tsx` | 26 枚内联 SVG，24×24，`currentColor` 描边，`aria-hidden`；**禁止新增 emoji** |
| FeedbackRegion | `components/FeedbackRegion.tsx` | 见 §2 |
| ConfirmDialog | `components/ConfirmDialog.tsx` | `role="alertdialog"` + 焦点陷阱 + Escape 取消 + 焦点归还；替代 `window.confirm` |
| OverflowMenu | `components/OverflowMenu.tsx` | APG Menu Button 模式：`aria-haspopup/expanded`、↑↓/Home/End/Escape/Tab 全键盘 |
| useRovingRadio | `hooks/useRovingRadio.ts` | radiogroup roving tabindex（Tab 单落点 + 方向键循环 + 焦点跟随）；用于 CFTypeSelector、视图切换、树布局选择 |

### 3.1 Header 信息架构

```
[Logo] ｜ [打开目录 (primary)] [打开▾] [导出▾] [清除(danger)]   …   [CF类型] [视图] [🌐] [主题]
```

- 主 CTA 唯一实心按钮；低频动作（打开文件 / 示例数据）收进「打开▾」；三种导出收进「导出▾」（仅载入数据后出现）。
- 「清除」为危险操作：红色描边 + ConfirmDialog + 10s 撤销 toast。
- 新增头部动作前先问：能否进菜单？超过 5 个平级按钮即为信息架构回退。

## 4. 键盘模型

| 区域 | 按键 | 行为 |
|------|------|------|
| 表格（role=grid） | ↑ ↓ Home End | 移动行游标（roving tabindex，翻页边界停止） |
| 表格 | Enter / Space | 选中游标行，三视图联动 |
| 表头 | Tab + Enter | 排序切换（真实 `<button class="th-sort">`） |
| 树画布 / 全局 | ↑ ↓ | 顺序选中分支；**未选中时 ↓ 选中第一个**（无死锁） |
| 树画布 | 拖拽 / Ctrl+滚轮 / 裸滚轮 | 平移 / 缩放 / 垂直滚动（Shift 水平） |
| radiogroup | ↑↓←→ | 循环切换，焦点跟随 |
| 分隔器 | ←→（横）/ ↑↓（纵）/ Home End | 步长 8%，Home/End 极值；aria-valuenow 实时 |
| 对话框 | Escape / Tab | 取消 / 焦点陷阱 |
| 设置面板 | Escape / 外部点击 | 关闭并归还焦点 |

互斥约定：表格 grid、对话框、菜单、设置面板内的按键**不触发**全局分支导航（App 全局 handler 通过 `closest('[role="grid"]…')` 排除 + 组件内 `stopPropagation`）。

## 5. 数值格式化单一真相源

全部经 `lib/format.ts`，**禁止**在组件内直接 `toFixed`：

| 函数 | 语义 | 输出 |
|------|------|------|
| `formatPsi(v)` | 一致性因子（百分比） | `62.34%`（表头已注明单位时可 `{withUnit:false}`） |
| `formatN(v)` | 计数（基因/位点/四分组数） | 整数；非整数至多 2 位小数 |
| `formatLength(v)` | 枝长 | 6 位小数 |
| `formatPp(v)` | 后验概率 | 1 位小数 |
| `formatBranchIdLabel(tpl, id)` | 分支标签 | `分支 #12`（i18n 模板） |

依据：`parse.ts buildVectors` 将 quartet q1×100 归一到 0–100，与 gene/site 同为百分数——**任何视图都不得对 quartet Ψ 省略 %**。

## 6. 布局与响应

- 断点：`1366px`（降密：隐藏 panel-hint / logo 文案、收窄控件）与 `1200px`（紧凑头部）。
- 主进程窗口默认尺寸 = `min(1600, 工作区-80)`，`minWidth 1024`——不再有固定 1600×1000 溢出小屏的问题。
- 字体：`@fontsource/inter` + `@fontsource/jetbrains-mono` 本地打包（`main.tsx` 引入）；**禁止**引入任何 CDN 字体（CSP 已收紧为 `font-src 'self'`）。

## 7. 动效规格

| 变量 | 值 | 用途 |
|------|----|------|
| `--motion-duration-fast` | 100ms | 悬停、按压、色彩过渡 |
| `--motion-duration-mid` | 200ms | 面板、弹层出入场 |
| `--motion-duration-slow` | 300ms | 主题切换 |
| `--motion-ease` | cubic-bezier(0.4,0,0.2,1) | 标准缓动 |

规则：
1. **禁止 `transition: all`**——必须列举属性（background-color / border-color / color / box-shadow / transform）。
2. 提拉动效（`translateY(-1px)`）仅限按钮类；**表格行禁止 transform**（防 subpixel 抖动）。
3. `prefers-reduced-motion: reduce` 下全部动画时长归零（已有全局规则）。

## 8. 空状态与图例

- 每个面板空状态 = 图标 + 一句话 + **next action**（加载示例 / 打开目录，复用 `lib/loaders.ts`）。
- 树画布与三元图常驻 Ψ₁ 占比色标图例（`SCHEME_GRADIENTS` 与 `getColorByScheme` 端点一致）。
- 树画布 `role="img"` 的 aria-label 携带分支数量摘要。

## 9. 持久化键位注册表

| localStorage key | 归属 store | 内容 |
|------------------|-----------|------|
| `cfpanel-language` / `cfpanel-theme` | settings | 语言、主题 |
| `cfpanel-ui` | ui | viewMode + 面板尺寸（`main-horizontal` / `main-vertical`） |
| `cfpanel-tree-settings` | treeSettings（zustand persist，沿用旧 key 兼容） | 布局、配色、字号等（searchQuery 不持久化） |
| `cfpanel-ternary-settings` | ternarySettings | 聚焦模式、凸包、密度等高线 |
| IndexedDB（persistence.ts） | selection / project | 选中分支、CF 类型、最近项目 |

新增持久化一律走 zustand `persist` 中间件并登记于此。