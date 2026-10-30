// src/renderer/i18n/translations.ts
// 中英文翻译表

export type Language = 'en' | 'zh'

export interface TranslationKey {
  // App
  appTitle: string
  // Header buttons
  openDirectory: string
  openFiles: string
  exportCSV: string
  exportImage: string
  clear: string
  loadExampleData: string
  // View modes
  viewAll: string
  viewTree: string
  viewTernary: string
  viewTable: string
  // CF Type
  cfTypeGene: string
  cfTypeSite: string
  cfTypeQuartet: string
  cfTypeGeneDesc: string
  cfTypeSiteDesc: string
  cfTypeQuartetDesc: string
  // Panel titles
  treeCanvas: string
  ternaryPlot: string
  vectorTable: string
  branchDetails: string
  // Panel hints
  treeHint: string
  ternaryHint: string
  tableHint: string
  // Welcome screen
  welcomeTitle: string
  welcomeDesc: string
  featureTree: string
  featureTernary: string
  featureTable: string
  featureLinked: string
  welcomeOpenDir: string
  welcomeOpenFiles: string
  welcomeExampleData: string
  welcomeExampleDesc: string
  welcomeNote: string
  // Loading
  loadingCFData: string
  // Error
  errorElectronApi: string
  errorReadDir: string
  errorNoData: string
  errorParse: string
  errorExport: string
  errorExportImage: string
  // Empty states
  emptyTree: string
  emptyTernary: string
  emptyTable: string
  emptyBranchDetail: string
  // Side panel
  branchId: string
  concordanceFactors: string
  allConcordanceTypes: string
  branchLengths: string
  subsPerSite: string
  coalescent: string
  quartetPosteriorProb: string
  totalN: string
  typeLabel: string
  // Table
  search: string
  branches: string
  page: string
  of: string
  // Tree controls
  zoomIn: string
  zoomOut: string
  resetView: string
  // Settings
  settings: string
  language: string
  theme: string
  themeLight: string
  themeDark: string
  themeAuto: string
  // IQ-TREE
  iqtreeNotDetected: string
  iqtreeDetected: string
  // Example data
  exampleDataLoaded: string
  exampleDataTitle: string
  // ─── Tree Canvas Settings (新增) ───
  treeSettings: string
  labelColor: string
  labelFontSize: string
  labelFontColor: string
  useBranchLength: string
  branchColorScheme: string
  branchWidth: string
  treeLayout: string
  layoutRectangular: string
  layoutUnrooted: string
  layoutCircular: string
  searchBranch: string
  searchPlaceholder: string
  searchRegex: string
  noResults: string
  colorSchemeRainbow: string
  colorSchemeHeat: string
  colorSchemeBlue: string
  colorSchemeMono: string
  showLabels: string
  showBranchIds: string
  matchCount: string
  // ─── Menu items (新增 i18n) ───
  menuFile: string
  menuEdit: string
  menuView: string
  menuWindow: string
  menuHelp: string
  menuOpenDirectory: string
  menuOpenFiles: string
  menuLoadExample: string
  menuExportCSV: string
  menuExportImagePNG: string
  menuExportImageSVG: string
  menuExportImagePDF: string
  menuUndo: string
  menuRedo: string
  menuCut: string
  menuCopy: string
  menuPaste: string
  menuSelectAll: string
  menuReload: string
  menuForceReload: string
  menuToggleDevTools: string
  menuResetZoom: string
  menuZoomIn: string
  menuZoomOut: string
  menuToggleFullscreen: string
  menuMinimize: string
  menuClose: string
  menuDocumentation: string
  menuIQTreeDoc: string
  menuAbout: string
  menuCheckForUpdates: string
  menuQuit: string
  // ─── Export image ───
  exportPNG: string
  exportSVG: string
  exportPDF: string
  exportSuccess: string
  exportSuccessCSV: string
  exportSuccessImage: string
  exportSuccessSVG: string
  // ─── Recent projects ───
  recentProjects: string
  noRecentProjects: string
  // ─── Ternary plot enhancements ───
  showConvexHull: string
  showDensityContour: string
  densityLevel: string
  // ─── Accessibility ───
  ariaTreeCanvas: string
  ariaTernaryPlot: string
  ariaVectorTable: string
  ariaSidePanel: string
  ariaCFTypeSelector: string
  ariaBranchSelected: string
  ariaBranchHovered: string
  ariaZoomLevel: string
  srBranchSelected: string
  srBranchHovered: string
  srLoadingData: string
  srNoData: string
  // ─── Auto update ───
  updateAvailable: string
  updateDownloading: string
  updateDownloaded: string
  updateInstalling: string
  updateNotAvailable: string
  updateError: string
  updateInstallNow: string
  updateLater: string
  updateCheckFailed: string
  // ─── Additional UI strings ───
  psi4Warning: string
  capabilityGcfMissing: string
  capabilityScflMissing: string
  capabilityCblMissing: string
  clearConfirm: string
  // ─── Design system strings ───
  dismiss: string
  undo: string
  undoSuccess: string
  clearedWithUndo: string
  exportCancelledOrFailed: string
  openMenu: string
  exportMenu: string
  branchIdLabel: string
  tablePsiHint: string
  ternaryFocusMode: string
  focusEmphasize: string
  focusDimLess: string
  focusHideOthers: string
  legendConcordance: string
  legendLow: string
  legendHigh: string
  subsPerSiteHeader: string
  coalescentHeader: string
  ariaConfirmDialog: string
  closeSettings: string
  viewModeGroup: string
  sortLabel: string
  previousPage: string
  nextPage: string
  resizeDivider: string
  skipToContent: string
  cancel: string
}

const en: TranslationKey = {
  appTitle: 'CF-Panel',
  openDirectory: 'Open Directory',
  openFiles: 'Open Files',
  exportCSV: 'Export CSV',
  exportImage: 'Export Image',
  clear: 'Clear',
  loadExampleData: 'Example Data',
  viewAll: 'All views',
  viewTree: 'Tree only',
  viewTernary: 'Ternary only',
  viewTable: 'Table only',
  cfTypeGene: 'Gene',
  cfTypeSite: 'Site',
  cfTypeQuartet: 'Quartet',
  cfTypeGeneDesc: 'gCF (gene concordance)',
  cfTypeSiteDesc: 'sCF (site concordance)',
  cfTypeQuartetDesc: 'qCF (quartet concordance)',
  treeCanvas: 'Tree Canvas',
  ternaryPlot: 'Ternary Plot',
  vectorTable: 'Vector Table',
  branchDetails: 'Branch Details',
  treeHint: 'Click to select • Drag to pan • Ctrl+Scroll to zoom • Wheel to scroll',
  ternaryHint: 'Ψ₁ / Ψ₂ / Ψ₃ projection',
  tableHint: 'Click or Enter to select • ↑↓ to navigate • Click headers to sort',
  welcomeTitle: 'CF-Panel',
  welcomeDesc: 'Desktop tool for exploring IQ-TREE concordance factors with three linked views: Tree Canvas, Ternary Plot, and Vector Table.',
  featureTree: 'Tree rendering with branch-level CF coloring',
  featureTernary: 'Ternary plot for Ψ₁/Ψ₂/Ψ₃ visualization',
  featureTable: 'Sortable, searchable vector table (32 columns)',
  featureLinked: 'Three-view linked exploration — click anywhere, see everywhere',
  welcomeOpenDir: 'Open IQ-TREE Output Directory',
  welcomeOpenFiles: 'Select Individual Files',
  welcomeExampleData: 'Load Example Data',
  welcomeExampleDesc: 'Bird_400 dataset (363 branches) — explore without any external software',
  welcomeNote: 'Expected files:',
  loadingCFData: 'Loading CF data...',
  errorElectronApi: 'Electron API not available. Running in browser mode?',
  errorReadDir: 'Failed to read directory',
  errorNoData: 'No valid CF data found in the selected directory. Expected files: gcf.cf.stat, scfl.cf.stat, etc.',
  errorParse: 'Failed to parse',
  errorExport: 'Failed to export CSV',
  errorExportImage: 'Failed to export image',
  emptyTree: 'Load a project to view the phylogenetic tree',
  emptyTernary: 'Load data to view ternary plot',
  emptyTable: 'No vector data loaded',
  emptyBranchDetail: 'Select a branch to view details',
  branchId: 'Branch',
  concordanceFactors: 'concordance factors',
  allConcordanceTypes: 'All concordance types',
  branchLengths: 'Branch lengths',
  subsPerSite: 'Subs/site:',
  coalescent: 'Coalescent:',
  quartetPosteriorProb: 'Quartet posterior probabilities',
  totalN: 'Total N',
  typeLabel: 'Type',
  search: 'Search...',
  branches: 'branches',
  page: 'Page',
  of: 'of',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Reset view',
  settings: 'Settings',
  language: 'Language',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeAuto: 'Auto',
  iqtreeNotDetected: 'IQ-TREE not detected — file viewing mode only',
  iqtreeDetected: 'IQ-TREE detected',
  exampleDataLoaded: 'Example data loaded',
  exampleDataTitle: 'Bird_400 Example Dataset',
  // ─── Tree Canvas Settings ───
  treeSettings: 'Tree Settings',
  labelColor: 'Label Color',
  labelFontSize: 'Font Size',
  labelFontColor: 'Label Font Color',
  useBranchLength: 'Use Branch Lengths',
  branchColorScheme: 'Color Scheme',
  branchWidth: 'Branch Width',
  treeLayout: 'Layout',
  layoutRectangular: 'Rectangular',
  layoutUnrooted: 'Unrooted',
  layoutCircular: 'Circular',
  searchBranch: 'Search Branch',
  searchPlaceholder: 'Search branch name or ID (supports regex)...',
  searchRegex: 'Regex',
  noResults: 'No matching branches',
  colorSchemeRainbow: 'Rainbow',
  colorSchemeHeat: 'Heatmap',
  colorSchemeBlue: 'Blue-Red',
  colorSchemeMono: 'Monochrome',
  showLabels: 'Show Labels',
  showBranchIds: 'Show Branch IDs',
  matchCount: 'matches',
  // ─── Menu items ───
  menuFile: 'File',
  menuEdit: 'Edit',
  menuView: 'View',
  menuWindow: 'Window',
  menuHelp: 'Help',
  menuOpenDirectory: 'Open Directory…',
  menuOpenFiles: 'Open Files…',
  menuLoadExample: 'Load Example Data',
  menuExportCSV: 'Export CSV…',
  menuExportImagePNG: 'Export as PNG…',
  menuExportImageSVG: 'Export as SVG…',
  menuExportImagePDF: 'Export as PDF…',
  menuUndo: 'Undo',
  menuRedo: 'Redo',
  menuCut: 'Cut',
  menuCopy: 'Copy',
  menuPaste: 'Paste',
  menuSelectAll: 'Select All',
  menuReload: 'Reload',
  menuForceReload: 'Force Reload',
  menuToggleDevTools: 'Toggle Developer Tools',
  menuResetZoom: 'Actual Size',
  menuZoomIn: 'Zoom In',
  menuZoomOut: 'Zoom Out',
  menuToggleFullscreen: 'Toggle Full Screen',
  menuMinimize: 'Minimize',
  menuClose: 'Close',
  menuDocumentation: 'CF-Panel Documentation',
  menuIQTreeDoc: 'IQ-TREE Documentation',
  menuAbout: 'About CF-Panel',
  menuCheckForUpdates: 'Check for Updates…',
  menuQuit: 'Quit',
  // ─── Export image ───
  exportPNG: 'Export as PNG',
  exportSVG: 'Export as SVG',
  exportPDF: 'Export as PDF',
  exportSuccess: 'CSV exported successfully',
  exportSuccessCSV: 'CSV exported successfully',
  exportSuccessImage: 'Image exported successfully',
  exportSuccessSVG: 'SVG exported successfully',
  // ─── Recent projects ───
  recentProjects: 'Recent Projects',
  noRecentProjects: 'No recent projects',
  // ─── Ternary plot enhancements ───
  showConvexHull: 'Show Convex Hull',
  showDensityContour: 'Show Density Contour',
  densityLevel: 'Density Level',
  // ─── Accessibility ───
  ariaTreeCanvas: 'Phylogenetic tree canvas. Use arrow keys to navigate between branches.',
  ariaTernaryPlot: 'Ternary plot showing concordance factor distribution. Click points to select branches.',
  ariaVectorTable: 'Concordance vector table. Use arrow keys to navigate rows.',
  ariaSidePanel: 'Branch details panel. Shows concordance factors for the selected branch.',
  ariaCFTypeSelector: 'Concordance factor type selector. Choose between gene, site, or quartet.',
  ariaBranchSelected: 'Branch selected',
  ariaBranchHovered: 'Branch hovered',
  ariaZoomLevel: 'Zoom level',
  srBranchSelected: 'Branch {id} selected',
  srBranchHovered: 'Branch {id} hovered',
  srLoadingData: 'Loading concordance factor data',
  srNoData: 'No data loaded',
  // ─── Auto update ───
  updateAvailable: 'A new version is available. Would you like to download it?',
  updateDownloading: 'Downloading update... {percent}%',
  updateDownloaded: 'Update downloaded. Install now?',
  updateInstalling: 'Installing update...',
  updateNotAvailable: 'You are using the latest version.',
  updateError: 'Update check failed: {error}',
  updateInstallNow: 'Install Now',
  updateLater: 'Later',
  updateCheckFailed: 'Failed to check for updates',
  // ─── Additional UI strings ───
  psi4Warning: '{count} branches have non-zero Ψ₄ (not shown in ternary projection)',
  capabilityGcfMissing: 'Gene data not available (gcf.cf.stat missing)',
  capabilityScflMissing: 'Site data not available (scfl.cf.stat missing)',
  capabilityCblMissing: 'Coalescent branch lengths not available (coalescent_bl.cf.stat missing)',
  clearConfirm: 'This will clear the current dataset and all view states. Continue?',
  // ─── Design system upgrade (UI/UX review remediation) ───
  dismiss: 'Dismiss',
  undo: 'Undo',
  undoSuccess: 'Restore succeeded',
  clearedWithUndo: 'Dataset cleared',
  exportCancelledOrFailed: 'Export was cancelled or failed',
  openMenu: 'Open',
  exportMenu: 'Export',
  branchIdLabel: 'Branch #{id}',
  tablePsiHint: 'Ψ values are percentages',
  ternaryFocusMode: 'Focus mode',
  focusEmphasize: 'Emphasize',
  focusDimLess: 'Keep context',
  focusHideOthers: 'Hide others',
  legendConcordance: 'Ψ₁ share',
  legendLow: 'Low',
  legendHigh: 'High',
  subsPerSiteHeader: 'Subs/site',
  coalescentHeader: 'Coalescent',
  ariaConfirmDialog: 'Confirmation dialog',
  closeSettings: 'Close settings',
  viewModeGroup: 'View mode',
  sortLabel: 'Sort',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  resizeDivider: 'Resize panels. Use arrow keys',
  skipToContent: 'Skip to main content',
  cancel: 'Cancel',
}

const zh: TranslationKey = {
  appTitle: 'CF-Panel',
  openDirectory: '打开目录',
  openFiles: '打开文件',
  exportCSV: '导出 CSV',
  exportImage: '导出图片',
  clear: '清除',
  loadExampleData: '示例数据',
  viewAll: '全部视图',
  viewTree: '仅树视图',
  viewTernary: '仅三元图',
  viewTable: '仅表格',
  cfTypeGene: '基因',
  cfTypeSite: '位点',
  cfTypeQuartet: '四分组',
  cfTypeGeneDesc: 'gCF（基因一致性因子）',
  cfTypeSiteDesc: 'sCF（位点一致性因子）',
  cfTypeQuartetDesc: 'qCF（四分组一致性因子）',
  treeCanvas: '树画布',
  ternaryPlot: '三元图',
  vectorTable: '向量表',
  branchDetails: '分支详情',
  treeHint: '点击选中分支 • 拖拽平移 • Ctrl+滚轮缩放',
  ternaryHint: 'Ψ₁ / Ψ₂ / Ψ₃ 投影',
  tableHint: '点击或回车选中 • ↑↓ 导航 • 表头按钮可排序',
  welcomeTitle: 'CF-Panel',
  welcomeDesc: '用于探索 IQ-TREE 一致性因子的桌面工具，提供三视图联动：树画布、三元图和向量表。',
  featureTree: '树渲染与分支级 CF 着色',
  featureTernary: 'Ψ₁/Ψ₂/Ψ₃ 三元图可视化',
  featureTable: '可排序、可搜索的向量表（32 列）',
  featureLinked: '三视图联动探索 — 点击任意视图，同步联动',
  welcomeOpenDir: '打开 IQ-TREE 输出目录',
  welcomeOpenFiles: '选择单个文件',
  welcomeExampleData: '加载示例数据',
  welcomeExampleDesc: 'Bird_400 数据集（363 个分支）— 无需任何外部软件即可探索',
  welcomeNote: '预期文件：',
  loadingCFData: '正在加载 CF 数据...',
  errorElectronApi: 'Electron API 不可用，浏览器模式运行中？',
  errorReadDir: '读取目录失败',
  errorNoData: '所选目录中未找到有效的 CF 数据。预期文件：gcf.cf.stat, scfl.cf.stat 等。',
  errorParse: '解析失败',
  errorExport: '导出 CSV 失败',
  errorExportImage: '导出图片失败',
  emptyTree: '加载项目以查看系统发育树',
  emptyTernary: '加载数据以查看三元图',
  emptyTable: '未加载向量数据',
  emptyBranchDetail: '选择分支以查看详情',
  branchId: '分支',
  concordanceFactors: '一致性因子',
  allConcordanceTypes: '所有一致性类型',
  branchLengths: '分支长度',
  subsPerSite: '替换/位点：',
  coalescent: '溯祖：',
  quartetPosteriorProb: '四分组后验概率',
  totalN: '总 N',
  typeLabel: '类型',
  search: '搜索...',
  branches: '个分支',
  page: '第',
  of: '页 / 共',
  zoomIn: '放大',
  zoomOut: '缩小',
  resetView: '重置视图',
  settings: '设置',
  language: '语言',
  theme: '主题',
  themeLight: '明亮',
  themeDark: '暗黑',
  themeAuto: '自动',
  iqtreeNotDetected: '未检测到 IQ-TREE — 仅文件查看模式',
  iqtreeDetected: '已检测到 IQ-TREE',
  exampleDataLoaded: '示例数据已加载',
  exampleDataTitle: 'Bird_400 示例数据集',
  // ─── 树画布设置 ───
  treeSettings: '树设置',
  labelColor: '标签颜色',
  labelFontSize: '字体大小',
  labelFontColor: '标签字体颜色',
  useBranchLength: '使用枝长',
  branchColorScheme: '配色方案',
  branchWidth: '分支粗细',
  treeLayout: '布局',
  layoutRectangular: '矩形树',
  layoutUnrooted: '无根树',
  layoutCircular: '环形树',
  searchBranch: '搜索分支',
  searchPlaceholder: '搜索分支名或 ID（支持正则表达式）...',
  searchRegex: '正则',
  noResults: '无匹配分支',
  colorSchemeRainbow: '彩虹',
  colorSchemeHeat: '热力图',
  colorSchemeBlue: '蓝-红',
  colorSchemeMono: '单色',
  showLabels: '显示标签',
  showBranchIds: '显示分支 ID',
  matchCount: '个匹配',
  // ─── 菜单项 ───
  menuFile: '文件',
  menuEdit: '编辑',
  menuView: '视图',
  menuWindow: '窗口',
  menuHelp: '帮助',
  menuOpenDirectory: '打开目录…',
  menuOpenFiles: '打开文件…',
  menuLoadExample: '加载示例数据',
  menuExportCSV: '导出 CSV…',
  menuExportImagePNG: '导出为 PNG…',
  menuExportImageSVG: '导出为 SVG…',
  menuExportImagePDF: '导出为 PDF…',
  menuUndo: '撤销',
  menuRedo: '重做',
  menuCut: '剪切',
  menuCopy: '复制',
  menuPaste: '粘贴',
  menuSelectAll: '全选',
  menuReload: '重新加载',
  menuForceReload: '强制重新加载',
  menuToggleDevTools: '切换开发者工具',
  menuResetZoom: '实际大小',
  menuZoomIn: '放大',
  menuZoomOut: '缩小',
  menuToggleFullscreen: '切换全屏',
  menuMinimize: '最小化',
  menuClose: '关闭',
  menuDocumentation: 'CF-Panel 文档',
  menuIQTreeDoc: 'IQ-TREE 文档',
  menuAbout: '关于 CF-Panel',
  menuCheckForUpdates: '检查更新…',
  menuQuit: '退出',
  // ─── 导出图片 ───
  exportPNG: '导出为 PNG',
  exportSVG: '导出为 SVG',
  exportPDF: '导出为 PDF',
  exportSuccess: '导出成功',
  exportSuccessCSV: 'CSV 导出成功',
  exportSuccessImage: '图片导出成功',
  exportSuccessSVG: 'SVG 导出成功',
  // ─── 最近项目 ───
  recentProjects: '最近项目',
  noRecentProjects: '暂无最近项目',
  // ─── 三元图增强 ───
  showConvexHull: '显示凸包',
  showDensityContour: '显示密度等高线',
  densityLevel: '密度级别',
  // ─── 无障碍 ───
  ariaTreeCanvas: '系统发育树画布。使用方向键在分支之间导航。',
  ariaTernaryPlot: '一致性因子分布三元图。点击数据点选择分支。',
  ariaVectorTable: '一致性向量表。使用方向键导航行。',
  ariaSidePanel: '分支详情面板。显示选中分支的一致性因子。',
  ariaCFTypeSelector: '一致性因子类型选择器。在基因、位点或四分组之间选择。',
  ariaBranchSelected: '已选中分支',
  ariaBranchHovered: '已悬停分支',
  ariaZoomLevel: '缩放级别',
  srBranchSelected: '已选中分支 {id}',
  srBranchHovered: '已悬停分支 {id}',
  srLoadingData: '正在加载一致性因子数据',
  srNoData: '未加载数据',
  // ─── 自动更新 ───
  updateAvailable: '发现新版本。是否下载更新？',
  updateDownloading: '正在下载更新... {percent}%',
  updateDownloaded: '更新已下载。立即安装？',
  updateInstalling: '正在安装更新...',
  updateNotAvailable: '您使用的是最新版本。',
  updateError: '更新检查失败：{error}',
  updateInstallNow: '立即安装',
  updateLater: '稍后',
  updateCheckFailed: '检查更新失败',
  // ─── Additional UI strings ───
  psi4Warning: '{count} 个分支有非零 Ψ₄ 值（未在三元图中显示）',
  capabilityGcfMissing: '基因数据不可用（缺少 gcf.cf.stat）',
  capabilityScflMissing: '位点数据不可用（缺少 scfl.cf.stat）',
  capabilityCblMissing: '溯祖分支长度不可用（缺少 coalescent_bl.cf.stat）',
  clearConfirm: '将清除当前数据集与所有视图状态。确定继续吗？',
  // ─── Design system strings ───
  dismiss: '关闭',
  undo: '撤销',
  undoSuccess: '已恢复数据',
  clearedWithUndo: '数据集已清除',
  exportCancelledOrFailed: '导出已取消或失败',
  openMenu: '打开',
  exportMenu: '导出',
  branchIdLabel: '分支 #{id}',
  tablePsiHint: 'Ψ 值为百分数',
  ternaryFocusMode: '聚焦模式',
  focusEmphasize: '强调选中',
  focusDimLess: '保留语境',
  focusHideOthers: '隐藏其余',
  legendConcordance: 'Ψ₁ 占比',
  legendLow: '低',
  legendHigh: '高',
  subsPerSiteHeader: '每位点替换数',
  coalescentHeader: '溯祖枝长',
  ariaConfirmDialog: '确认对话框',
  closeSettings: '关闭设置',
  viewModeGroup: '视图模式',
  sortLabel: '排序',
  previousPage: '上一页',
  nextPage: '下一页',
  resizeDivider: '调整面板大小，使用方向键',
  skipToContent: '跳到主内容',
  cancel: '取消',
}

export const translations: Record<Language, TranslationKey> = { en, zh }
