// src/main/index.ts
import { app, BrowserWindow, ipcMain, dialog, Menu, shell, screen } from 'electron'
import { join } from 'path'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs'
import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import {
  readFileSchema,
  readCfDirectorySchema,
  saveFileSchema,
  saveDialogSchema,
  openFilesSchema,
  iqtreeRunSchema,
  exportVectorsSchema,
  validateArgs,
  validateFilePath,
  validateDirPath,
} from './ipc-schemas'
import {
  getAdapter,
  detectVersionNumber,
  type IQTreeVersion,
  type IQTreeRunParams,
} from './iqtree-adapter'

const execFileAsync = promisify(execFile)

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // 窗口尺寸适配工作区
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const width = Math.min(1600, Math.max(1024, sw - 80))
  const height = Math.min(1000, Math.max(680, sh - 80))
  const isDark = currentTheme === 'dark'

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 640,
    title: 'CF-Panel',
    backgroundColor: isDark ? '#010102' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // In dev mode, load the vite dev server URL
  // In production, load the built HTML
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Support file drag-and-drop to load data
  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })
}

// ─── Build application menu with i18n support ───
// The menu labels are sent from the renderer process via IPC,
// but the default menu uses English which gets overridden
// when the renderer sends the language preference.
let currentLanguage: 'en' | 'zh' = 'zh'
let currentTheme: 'light' | 'dark' = 'light'

function buildMenu(): Electron.MenuItemConstructorOptions[] {
  const isZh = currentLanguage === 'zh'
  return [
    {
      label: isZh ? '文件' : 'File',
      submenu: [
        {
          label: isZh ? '打开目录…' : 'Open Directory…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:openDirectory')
        },
        {
          label: isZh ? '打开文件…' : 'Open Files…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('menu:openFiles')
        },
        { type: 'separator' },
        {
          label: isZh ? '加载示例数据' : 'Load Example Data',
          click: () => mainWindow?.webContents.send('menu:loadExample')
        },
        { type: 'separator' },
        {
          label: isZh ? '导出 CSV…' : 'Export CSV…',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:exportCSV')
        },
        {
          label: isZh ? '导出为 PNG…' : 'Export as PNG…',
          click: () => mainWindow?.webContents.send('menu:exportPNG')
        },
        {
          label: isZh ? '导出为 SVG…' : 'Export as SVG…',
          click: () => mainWindow?.webContents.send('menu:exportSVG')
        },
        { type: 'separator' },
        {
          label: isZh ? '检查更新…' : 'Check for Updates…',
          click: () => checkForUpdates()
        },
        { type: 'separator' },
        {
          label: isZh ? '退出' : 'Quit',
          role: 'quit'
        }
      ]
    },
    {
      label: isZh ? '编辑' : 'Edit',
      submenu: [
        { role: 'undo', label: isZh ? '撤销' : 'Undo' },
        { role: 'redo', label: isZh ? '重做' : 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: isZh ? '剪切' : 'Cut' },
        { role: 'copy', label: isZh ? '复制' : 'Copy' },
        { role: 'paste', label: isZh ? '粘贴' : 'Paste' },
        { role: 'selectAll', label: isZh ? '全选' : 'Select All' }
      ]
    },
    {
      label: isZh ? '视图' : 'View',
      submenu: [
        { role: 'reload', label: isZh ? '重新加载' : 'Reload' },
        { role: 'forceReload', label: isZh ? '强制重新加载' : 'Force Reload' },
        { role: 'toggleDevTools', label: isZh ? '切换开发者工具' : 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: isZh ? '实际大小' : 'Actual Size' },
        { role: 'zoomIn', label: isZh ? '放大' : 'Zoom In' },
        { role: 'zoomOut', label: isZh ? '缩小' : 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: isZh ? '切换全屏' : 'Toggle Full Screen' }
      ]
    },
    {
      label: isZh ? '窗口' : 'Window',
      submenu: [
        { role: 'minimize', label: isZh ? '最小化' : 'Minimize' },
        { role: 'close', label: isZh ? '关闭' : 'Close' }
      ]
    },
    {
      label: isZh ? '帮助' : 'Help',
      submenu: [
        {
          label: isZh ? 'CF-Panel 文档' : 'CF-Panel Documentation',
          click: () => shell.openExternal('https://github.com/cf-panel/cf-panel')
        },
        {
          label: isZh ? 'IQ-TREE 文档' : 'IQ-TREE Documentation',
          click: () => shell.openExternal('http://www.iqtree.org/doc/Concordance-Factor')
        },
        { type: 'separator' },
        { role: 'about', label: isZh ? '关于 CF-Panel' : 'About CF-Panel' }
      ]
    }
  ]
}

function applyMenu(): void {
  const template = buildMenu()
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── Auto-update (electron-updater) ───
async function checkForUpdates(): Promise<void> {
  try {
    // Dynamic import — electron-updater is only available in production
    const { autoUpdater } = await import('electron-updater')

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('update-available', (info) => {
      if (!mainWindow) return
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: currentLanguage === 'zh' ? '发现新版本' : 'Update Available',
        message: currentLanguage === 'zh'
          ? `发现新版本 ${info.version}。是否下载更新？`
          : `A new version ${info.version} is available. Would you like to download it?`,
        buttons: [
          currentLanguage === 'zh' ? '立即下载' : 'Download',
          currentLanguage === 'zh' ? '稍后' : 'Later'
        ],
        defaultId: 0,
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
    })

    autoUpdater.on('update-not-available', () => {
      if (!mainWindow) return
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: currentLanguage === 'zh' ? '无可用更新' : 'No Updates Available',
        message: currentLanguage === 'zh'
          ? '您使用的是最新版本。'
          : 'You are using the latest version.',
        buttons: ['OK'],
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      if (mainWindow) {
        mainWindow.setTitle(`CF-Panel — ${currentLanguage === 'zh' ? '下载更新' : 'Downloading'} ${Math.round(progress.percent)}%`)
      }
    })

    autoUpdater.on('update-downloaded', () => {
      if (!mainWindow) return
      mainWindow.setTitle('CF-Panel')
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: currentLanguage === 'zh' ? '更新已下载' : 'Update Downloaded',
        message: currentLanguage === 'zh'
          ? '更新已下载完成。是否立即安装并重启？'
          : 'Update downloaded. Install and restart now?',
        buttons: [
          currentLanguage === 'zh' ? '立即安装' : 'Install Now',
          currentLanguage === 'zh' ? '稍后' : 'Later'
        ],
        defaultId: 0,
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
    })

    autoUpdater.on('error', (err) => {
      if (!mainWindow) return
      dialog.showErrorBox(
        currentLanguage === 'zh' ? '更新错误' : 'Update Error',
        err.message || String(err)
      )
    })

    await autoUpdater.checkForUpdates()
  } catch (err) {
    // electron-updater not available in dev mode — silently ignore
    if (!app.isPackaged && mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: currentLanguage === 'zh' ? '开发模式' : 'Development Mode',
        message: currentLanguage === 'zh'
          ? '自动更新在开发模式下不可用。'
          : 'Auto-update is not available in development mode.',
        buttons: ['OK'],
      })
    }
  }
}

app.whenReady().then(() => {
  applyMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ──────────────────────────────────────────────
// IPC Handlers — with Zod schema validation
// ──────────────────────────────────────────────

// Set language for menu i18n
ipcMain.handle('app:setLanguage', async (_e, lang: string) => {
  if (lang === 'en' || lang === 'zh') {
    currentLanguage = lang
    applyMenu()
  }
  return true
})

// Set theme for native window background (prevents flash on resize/maximize)
ipcMain.handle('app:setTheme', async (_e, theme: string) => {
  if (theme === 'light' || theme === 'dark') {
    currentTheme = theme
    if (mainWindow) {
      mainWindow.setBackgroundColor(theme === 'dark' ? '#010102' : '#ffffff')
    }
  }
  return true
})

// Open directory dialog to select IQ-TREE output folder
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select IQ-TREE Output Directory',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// Open file dialog to select individual files — with validation
ipcMain.handle('dialog:openFiles', validateArgs(openFilesSchema, async () => {
  if (!mainWindow) return []
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select CF Files',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'CF Files', extensions: ['stat', 'tree', 'branch', 'nexus', 'nex', 'newick', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled) return []
  return result.filePaths
}))

// Read a file — with path validation
ipcMain.handle('file:read', validateArgs(readFileSchema, async (_e, data) => {
  try {
    const safePath = validateFilePath(data.filePath)
    const content = readFileSync(safePath, 'utf-8')
    return content
  } catch (err) {
    console.error('Failed to read file:', data.filePath, err)
    return null
  }
}))

// Read files from a directory (auto-detect CF files) — with path validation
ipcMain.handle('file:readCfDirectory', validateArgs(readCfDirectorySchema, async (_e, data) => {
  try {
    const safeDir = validateDirPath(data.dirPath)
    const files = readdirSync(safeDir)
    const result: Record<string, string> = {}

    // Auto-detect standard CF output files
    const fileMap: Record<string, string[]> = {
      gcfStat: ['gcf.cf.stat'],
      scflStat: ['scfl.cf.stat', 'scf.cf.stat'],
      cblStat: ['coalescent_bl.cf.stat'],
      gcfTree: ['gcf.cf.tree'],
      gcfBranch: ['gcf.cf.branch']
    }

    for (const [key, candidates] of Object.entries(fileMap)) {
      for (const candidate of candidates) {
        const fullPath = join(safeDir, candidate)
        if (existsSync(fullPath)) {
          result[key] = readFileSync(fullPath, 'utf-8')
          break
        }
      }
    }

    // If gcf.cf.tree doesn't exist, try any .cf.tree file
    if (!result['gcfTree']) {
      const treeFile = files.find(f => f.endsWith('.cf.tree'))
      if (treeFile) {
        result['gcfTree'] = readFileSync(join(safeDir, treeFile), 'utf-8')
      }
    }

    // If gcf.cf.branch doesn't exist, try any .cf.branch file
    if (!result['gcfBranch']) {
      const branchFile = files.find(f => f.endsWith('.cf.branch'))
      if (branchFile) {
        result['gcfBranch'] = readFileSync(join(safeDir, branchFile), 'utf-8')
      }
    }

    return result
  } catch (err) {
    console.error('Failed to read CF directory:', data.dirPath, err)
    return null
  }
}))

// Save file — with validation
ipcMain.handle('file:save', validateArgs(saveFileSchema, async (_e, data) => {
  try {
    const safePath = validateFilePath(data.filePath)
    writeFileSync(safePath, data.content, 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save file:', data.filePath, err)
    return false
  }
}))

// Save dialog — with validation
ipcMain.handle('dialog:saveFile', validateArgs(saveDialogSchema, async (_e, data) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save File',
    defaultPath: data.defaultName,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'PNG Images', extensions: ['png'] },
      { name: 'SVG Images', extensions: ['svg'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled) return null
  return result.filePath
}))

// Save image (PNG/SVG) — with validation
ipcMain.handle('file:saveImage', async (_e, filePath: string, dataUrl: string) => {
  try {
    const safePath = validateFilePath(filePath)
    // dataUrl format: "data:image/png;base64,xxxx"
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    writeFileSync(safePath, buffer)
    return true
  } catch (err) {
    console.error('Failed to save image:', filePath, err)
    return false
  }
})

// Save SVG — with validation
ipcMain.handle('file:saveSVG', async (_e, filePath: string, svgContent: string) => {
  try {
    const safePath = validateFilePath(filePath)
    writeFileSync(safePath, svgContent, 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save SVG:', filePath, err)
    return false
  }
})

// Detect IQ-TREE version
ipcMain.handle('iqtree:detectVersion', async () => {
  const commands = ['iqtree2', 'iqtree3', 'iqtree']
  for (const cmd of commands) {
    try {
      const { stdout } = await execFileAsync(cmd, ['--version'], { timeout: 5000 })
      const version = stdout.trim()
      const versionNum = detectVersionNumber(version)
      return { command: cmd, version, majorVersion: versionNum }
    } catch {
      // Try next command
    }
  }
  return null
})

// Run IQ-TREE concordance analysis — with adapter pattern + validation
ipcMain.handle('iqtree:run', validateArgs(iqtreeRunSchema, async (_e, data) => {
  const { iqtreeCommand, speciesTree, modelFile, geneTrees, outputDir, scflQuartets, threads: threadsRaw, iqtreeVersion } = data
  const threads = threadsRaw || 'AUTO'

  // Use the adapter for the detected/specified IQ-TREE version
  const adapter = getAdapter(iqtreeVersion as IQTreeVersion)
  const params: IQTreeRunParams = { speciesTree, modelFile, geneTrees, outputDir, scflQuartets, threads }

  const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

  function runStep(args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      let output = ''
      const child = spawn(iqtreeCommand, args, { cwd: outputDir })
      const timer = setTimeout(() => {
        child.kill('SIGTERM')
        resolve({ success: false, output, error: 'IQ-TREE process timed out (30 min)' })
      }, TIMEOUT_MS)

      child.stdout.on('data', (data) => { output += data.toString() })
      child.stderr.on('data', (data) => { output += data.toString() })

      child.on('error', (err) => {
        clearTimeout(timer)
        resolve({ success: false, output, error: `Failed to launch IQ-TREE: ${err.message}` })
      })

      child.on('close', (code) => {
        clearTimeout(timer)
        if (code !== 0) {
          resolve({ success: false, output, error: `IQ-TREE exited with code ${code}` })
        } else {
          resolve({ success: true, output })
        }
      })
    })
  }

  // Step 1: Run sCF analysis (using adapter)
  const scflStep = adapter.buildScflStep(params)
  const step1Result = await runStep(scflStep.args)

  if (!step1Result.success) {
    return { success: false, step: 1, description: scflStep.description, output: step1Result.output, error: step1Result.error }
  }

  // Step 2: Run gCF analysis (using adapter)
  const gcfStep = adapter.buildGcfStep(params)
  const step2Result = await runStep(gcfStep.args)

  if (!step2Result.success) {
    return { success: false, step: 2, description: gcfStep.description, output: step2Result.output, error: step2Result.error }
  }

  return { success: true, step1Output: step1Result.output, step2Output: step2Result.output }
}))

// Export concordance vectors as CSV — with validation
ipcMain.handle('export:vectorsCSV', validateArgs(exportVectorsSchema, async (_e, data) => {
  if (!mainWindow) return false
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Concordance Vectors',
    defaultPath: 'concordance_vectors.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return false

  const vectors = data.vectors
  if (!vectors || vectors.length === 0) return false

  // Use snake_case headers matching the Lanfear golden CSV format
  const headers = [
    'ID',
    'Label',
    'gene_psi1', 'gene_psi2', 'gene_psi3', 'gene_psi4',
    'gene_psi1_N', 'gene_psi2_N', 'gene_psi3_N', 'gene_psi4_N', 'gene_N',
    'site_psi1', 'site_psi2', 'site_psi3', 'site_psi4',
    'site_psi1_N', 'site_psi2_N', 'site_psi3_N', 'site_psi4_N', 'site_N',
    'quartet_psi1', 'quartet_psi2', 'quartet_psi3', 'quartet_psi4',
    'quartet_psi1_N', 'quartet_psi2_N', 'quartet_psi3_N', 'quartet_psi4_N', 'quartet_N',
    'quartet_psi1_pp', 'quartet_psi2_pp', 'quartet_psi3_pp',
    'length_subs_per_site', 'length_coalescent'
  ]
  const keyMap: Record<string, string> = {
    'ID': 'id',
    'Label': 'label',
    'gene_psi1': 'genePsi1', 'gene_psi2': 'genePsi2', 'gene_psi3': 'genePsi3', 'gene_psi4': 'genePsi4',
    'gene_psi1_N': 'genePsi1N', 'gene_psi2_N': 'genePsi2N', 'gene_psi3_N': 'genePsi3N', 'gene_psi4_N': 'genePsi4N',
    'gene_N': 'geneN',
    'site_psi1': 'sitePsi1', 'site_psi2': 'sitePsi2', 'site_psi3': 'sitePsi3', 'site_psi4': 'sitePsi4',
    'site_psi1_N': 'sitePsi1N', 'site_psi2_N': 'sitePsi2N', 'site_psi3_N': 'sitePsi3N', 'site_psi4_N': 'sitePsi4N',
    'site_N': 'siteN',
    'quartet_psi1': 'quartetPsi1', 'quartet_psi2': 'quartetPsi2', 'quartet_psi3': 'quartetPsi3', 'quartet_psi4': 'quartetPsi4',
    'quartet_psi1_N': 'quartetPsi1N', 'quartet_psi2_N': 'quartetPsi2N', 'quartet_psi3_N': 'quartetPsi3N', 'quartet_psi4_N': 'quartetPsi4N',
    'quartet_N': 'quartetN',
    'quartet_psi1_pp': 'quartetPsi1Pp', 'quartet_psi2_pp': 'quartetPsi2Pp', 'quartet_psi3_pp': 'quartetPsi3Pp',
    'length_subs_per_site': 'lengthSubsPerSite', 'length_coalescent': 'lengthCoalescent'
  }
  const csvLines = [
    headers.join(','),
    ...vectors.map(v => headers.map(h => String((v as Record<string, unknown>)[keyMap[h]] ?? '')).join(','))
  ]
  writeFileSync(result.filePath, csvLines.join('\n'), 'utf-8')
  return true
}))

// Check for updates — triggered from renderer
ipcMain.handle('app:checkForUpdates', async () => {
  await checkForUpdates()
  return true
})
