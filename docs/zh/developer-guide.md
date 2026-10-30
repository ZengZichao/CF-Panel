# 开发者指南

> **版本：0.1.0**

## 1. 开发环境搭建

### 1.1 前置要求

- [Node.js](https://nodejs.org/) 18+（推荐 LTS）
- npm 9+ 或 pnpm 8+
- [Git](https://git-scm.com/)
- 推荐使用 VS Code

### 1.2 克隆与安装

```bash
git clone https://github.com/cf-panel/cf-panel.git
cd cf-panel
npm install
```

### 1.3 开发运行

```bash
npm run dev    # 启动 electron-vite 开发服务器
```

开发模式支持热重载，修改代码后自动刷新。

## 2. 项目结构

```
cf-panel/
├── package.json                # 项目配置与依赖
├── electron.vite.config.ts     # electron-vite 构建配置
├── electron-builder.yml        # electron-builder 打包配置
├── tsconfig.json               # TypeScript 配置
├── LICENSE                     # MIT 许可证
├── README.md                   # 项目说明（英文）
├── CONTRIBUTING.md             # 贡献指南
├── .gitignore
├── .editorconfig
├── docs/                       # 文档目录
│   ├── zh/                     # 中文文档
│   └── en/                     # 英文文档
├── .github/                    # GitHub 配置
│   ├── ISSUE_TEMPLATE/         # Issue 模板
│   └── workflows/              # CI/CD 工作流
├── src/
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts            # IPC 处理器、文件对话框、IQ-TREE 子进程
│   │   ├── ipc-schemas.ts      # Zod IPC 参数校验
│   │   ├── iqtree-adapter.ts   # IQ-TREE 版本适配器
│   │   └── iqtree-adapter.test.ts # 适配器单元测试
│   ├── preload/
│   │   └── index.ts            # contextBridge API 暴露
│   ├── renderer/               # 渲染进程（React）
│   │   ├── App.tsx             # 主布局与三视图联动
│   │   ├── main.tsx            # React 入口
│   │   ├── index.html          # HTML 模板
│   │   ├── styles.css          # 全局样式（暗色/亮色主题）
│   │   ├── components/         # UI 组件
│   │   │   ├── TreeCanvas.tsx    # SVG/Canvas 树渲染
│   │   │   ├── TernaryPlot.tsx   # ECharts 三元散点图
│   │   │   ├── VectorTable.tsx   # TanStack Table
│   │   │   ├── SidePanel.tsx     # 分支详情面板
│   │   │   ├── CFTypeSelector.tsx # gene/site/quartet 切换
│   │   │   ├── ResizablePanels.tsx # 可拖拽面板
│   │   │   ├── OverflowMenu.tsx  # 溢出菜单
│   │   │   ├── ConfirmDialog.tsx # 确认对话框
│   │   │   ├── FeedbackRegion.tsx # Toast 反馈区
│   │   │   └── Icon.tsx          # 内联 SVG 图标集
│   │   ├── stores/             # Zustand 状态管理
│   │   │   ├── selection.ts      # 全局选中状态
│   │   │   ├── project.ts        # 项目数据状态
│   │   │   ├── settings.ts       # 设置（主题/语言/i18n）
│   │   │   ├── ui.ts             # UI 状态（视图模式）
│   │   │   ├── feedback.ts       # Toast 反馈
│   │   │   ├── persistence.ts    # IndexedDB 持久化
│   │   │   ├── treeSettings.ts   # 树渲染设置
│   │   │   └── ternarySettings.ts # 三元图设置
│   │   ├── lib/                # 工具库
│   │   │   ├── parse.ts          # 纯 TS 解析器
│   │   │   ├── parse.test.ts     # 解析器测试
│   │   │   ├── loaders.ts        # 数据加载/导出动作
│   │   │   ├── format.ts        # 数值格式化
│   │   │   ├── example-data.ts   # 示例数据加载
│   │   │   └── canvas-tree-renderer.ts # Canvas 树渲染器
│   │   ├── hooks/
│   │   │   └── useRovingRadio.ts # roving tabindex
│   │   ├── i18n/
│   │   │   └── translations.ts   # 中英文翻译
│   │   ├── types/
│   │   │   ├── cf.ts             # CF 类型定义
│   │   │   └── raw.d.ts          # Vite ?raw 导入声明
│   │   ├── assets/
│   │   │   └── logo.svg          # 应用 Logo
│   │   └── example-data/         # 内置示例数据文件
│   └── types/
│       └── cf.ts                 # 共享类型定义
├── out/                        # 构建输出（gitignored）
└── dist/                       # 打包输出（gitignored）
```

## 3. 构建命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（热重载） |
| `npm run build` | 构建生产版本（不打包） |
| `npm run preview` | 预览构建版本 |
| `npm run pack` | 打包（不生成安装程序） |
| `npm run dist` | 打包并生成安装程序（当前平台） |
| `npm run dist:win` | 打包 Windows（exe） |
| `npm run dist:mac` | 打包 macOS（dmg） |
| `npm run dist:linux` | 打包 Linux（AppImage / deb） |

## 4. 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 外壳 | Electron | 30+ |
| 构建 | electron-vite | 2.x |
| 打包 | electron-builder | 24.x |
| UI | React | 18.x |
| 语言 | TypeScript | 5.x |
| 状态管理 | Zustand | 4.x |
| 图表 | ECharts | 5.x |
| 表格 | TanStack Table | 8.x |

## 5. 添加新功能

### 5.1 添加新的翻译条目

1. 在 `src/renderer/i18n/translations.ts` 的 `TranslationKey` 接口中添加新字段
2. 在 `en` 和 `zh` 对象中分别添加对应翻译
3. 在组件中通过 `const { t } = useSettingsStore()` 使用

### 5.2 添加新的 IPC 处理器

1. 在 `src/main/index.ts` 中添加 `ipcMain.handle(...)`
2. 在 `src/preload/index.ts` 的 `api` 对象中添加对应方法
3. 在渲染进程中通过 `window.cfpanel.xxx()` 调用

### 5.3 添加新的 CF 类型

1. 在 `src/renderer/types/cf.ts` 的 `CFType` 中添加新类型
2. 在 `src/renderer/lib/parse.ts` 的 `getPsiValues` 和 `getNValues` 中添加分支
3. 在 `src/renderer/components/CFTypeSelector.tsx` 中添加按钮
4. 在 `src/renderer/components/VectorTable.tsx` 中添加对应列

## 6. 编码规范

- TypeScript 严格模式（`strict: true`）
- 使用函数组件 + Hooks
- 使用 Zustand 进行状态管理（避免 prop drilling）
- CSS 使用变量系统（支持主题切换）
- 不使用 `any` 类型（除非解析外部数据时无法避免）

## 7. 调试

### 7.1 主进程调试

在开发模式下，主进程的 `console.log` 输出到启动 electron 的终端。

### 7.2 渲染进程调试

在开发模式下，按 `F12` 或 `Ctrl+Shift+I` 打开 DevTools。

### 7.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| `npm install` 失败 | 删除 `node_modules` 和 `package-lock.json`，重新安装 |
| electron 下载失败 | 设置 `ELECTRON_MIRROR` 环境变量 |
| 构建失败 | 检查 Node.js 版本是否 >= 18 |
