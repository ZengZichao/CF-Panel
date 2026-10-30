// src/renderer/lib/loaders.ts
// 数据加载动作 — 从 App.tsx 抽出为自由函数（复用方：App 头部按钮 / 各面板空状态 CTA）
// 全部通过 zustand getState 操作 store，不依赖 React 上下文。

import { useProjectStore } from '../stores/project'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import { feedback, useFeedbackStore } from '../stores/feedback'
import { parseNewick, parseProject } from './parse'
import { loadExampleData } from './example-data'

function tr() {
  return useSettingsStore.getState().t
}

export async function loadExample(): Promise<void> {
  const { setProject, setTree, setLoading } = useProjectStore.getState()
  const { selectBranch } = useSelectionStore.getState()
  setLoading(true)
  try {
    const result = loadExampleData()
    setProject(result.project)
    if (result.branchIdTree) {
      const { rootNode: root, branchIdMap: map } = parseNewick(result.branchIdTree)
      setTree(root, map)
    }
    selectBranch(null)
    feedback.success(tr().exampleDataLoaded)
  } catch (err) {
    feedback.error(`${tr().errorParse}: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    setLoading(false)
  }
}

export async function openDirectory(): Promise<void> {
  const { setProject, setTree, saveCurrentAsRecent, setLoading } = useProjectStore.getState()
  const { selectBranch } = useSelectionStore.getState()
  const t = tr()

  if (!window.cfpanel) {
    feedback.error(t.errorElectronApi)
    return
  }
  const dir = await window.cfpanel.openDirectory()
  if (!dir) return

  setLoading(true)
  try {
    const files = await window.cfpanel.readCfDirectory(dir)
    if (!files) {
      feedback.error(t.errorReadDir)
      return
    }

    const parsed = parseProject({
      gcfStat: files.gcfStat,
      scflStat: files.scflStat,
      cblStat: files.cblStat,
      gcfTree: files.gcfTree,
      gcfBranch: files.gcfBranch,
    })

    if (parsed.vectors.length === 0) {
      feedback.error(t.errorNoData)
      return
    }

    setProject(parsed)
    if (parsed.branchIdTree) {
      const { rootNode: root, branchIdMap: map } = parseNewick(parsed.branchIdTree)
      setTree(root, map)
    } else if (parsed.treeNewick) {
      const { rootNode: root, branchIdMap: map } = parseNewick(parsed.treeNewick)
      setTree(root, map)
    }
    selectBranch(null)

    const dirName = dir.split(/[/\\]/).pop() || dir
    await saveCurrentAsRecent(dir, dirName)
  } catch (err) {
    feedback.error(`${t.errorParse}: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    setLoading(false)
  }
}

export async function openFiles(): Promise<void> {
  const { setProject, setTree, setLoading } = useProjectStore.getState()
  const { selectBranch } = useSelectionStore.getState()
  const t = tr()

  if (!window.cfpanel) return
  const filePaths = await window.cfpanel.openFiles()
  if (filePaths.length === 0) return

  setLoading(true)
  try {
    const fileContents: Record<string, string> = {}
    for (const fp of filePaths) {
      const content = await window.cfpanel.readFile(fp)
      if (content) {
        const filename = fp.split(/[/\\]/).pop() || fp
        fileContents[filename] = content
      }
    }

    const gcfStat = fileContents['gcf.cf.stat'] || findFile(fileContents, 'gcf', '.cf.stat')
    const scflStat =
      fileContents['scfl.cf.stat'] || fileContents['scf.cf.stat'] || findFile(fileContents, 'scf', '.cf.stat')
    const cblStat =
      fileContents['coalescent_bl.cf.stat'] || findFile(fileContents, 'coalescent', '.cf.stat')
    const gcfTree = fileContents['gcf.cf.tree'] || findFile(fileContents, 'gcf', '.cf.tree')
    const gcfBranch = fileContents['gcf.cf.branch'] || findFile(fileContents, 'gcf', '.cf.branch')

    const parsed = parseProject({ gcfStat, scflStat, cblStat, gcfTree, gcfBranch })

    if (parsed.vectors.length === 0) {
      feedback.error(t.errorNoData)
      return
    }

    setProject(parsed)
    if (parsed.branchIdTree) {
      const { rootNode: root, branchIdMap: map } = parseNewick(parsed.branchIdTree)
      setTree(root, map)
    } else if (parsed.treeNewick) {
      const { rootNode: root, branchIdMap: map } = parseNewick(parsed.treeNewick)
      setTree(root, map)
    }
    selectBranch(null)
  } catch (err) {
    feedback.error(`${t.errorParse}: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    setLoading(false)
  }
}

function findFile(files: Record<string, string>, prefix: string, suffix: string): string | undefined {
  for (const [name, content] of Object.entries(files)) {
    if (
      name.toLowerCase().includes(prefix.toLowerCase()) &&
      name.toLowerCase().endsWith(suffix.toLowerCase())
    ) {
      return content
    }
  }
  return undefined
}

// ─── 导出动作 ───

function downloadSvgAsPng(svg: SVGSVGElement, theme: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const scale = 2 // High-res export
        canvas.width = (svg.clientWidth || 1400) * scale
        canvas.height = (svg.clientHeight || 900) * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)
        ctx.fillStyle = theme === 'dark' ? '#0f1011' : '#ffffff'
        ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(svgUrl)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        URL.revokeObjectURL(svgUrl)
        reject(err)
      }
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(svgUrl)
      reject(e)
    }
    img.src = svgUrl
  })
}

export async function exportCSV(): Promise<void> {
  const { project } = useProjectStore.getState()
  const t = tr()
  if (!window.cfpanel || !project) return
  const ok = await window.cfpanel.exportVectorsCSV(project.vectors as never)
  if (ok) {
    feedback.success(t.exportSuccessCSV)
  } else {
    // 取消保存对话框不算失败；主进程对取消与失败均返回 false，
    // 无法区分时仅在明确失败路径提示（保持静默取消）。
    feedback.info(t.exportCancelledOrFailed)
  }
}

export async function exportPNG(): Promise<void> {
  const { project } = useProjectStore.getState()
  const { theme } = useSettingsStore.getState()
  const t = tr()
  if (!window.cfpanel || !project) return
  try {
    const treeSvg = document.querySelector('.tree-canvas-container svg')
    const ternaryCanvas = document.querySelector('.ternary-plot-container canvas')
    let dataUrl: string | null = null
    let kind = 'tree'

    if (treeSvg instanceof SVGSVGElement) {
      dataUrl = await downloadSvgAsPng(treeSvg, theme)
    } else if (ternaryCanvas instanceof HTMLCanvasElement) {
      dataUrl = ternaryCanvas.toDataURL('image/png')
      kind = 'ternary'
    }
    if (!dataUrl) return

    const savePath = await window.cfpanel.saveFile(`cf-panel-${kind}-${Date.now()}.png`)
    if (savePath) {
      const ok = await window.cfpanel.saveImage(savePath, dataUrl)
      if (ok) feedback.success(t.exportSuccessImage)
    }
  } catch (err) {
    feedback.error(`${t.errorExportImage}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export async function exportSVG(): Promise<void> {
  const { project } = useProjectStore.getState()
  const t = tr()
  if (!window.cfpanel || !project) return
  try {
    const treeSvg = document.querySelector('.tree-canvas-container svg')
    const ternarySvg = document.querySelector('.ternary-plot-container svg')
    const svg = treeSvg || ternarySvg
    if (!(svg instanceof SVGSVGElement)) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const savePath = await window.cfpanel.saveFile(
      `cf-panel-${treeSvg ? 'tree' : 'ternary'}-${Date.now()}.svg`
    )
    if (savePath) {
      const ok = await window.cfpanel.saveSVG(savePath, svgData)
      if (ok) feedback.success(t.exportSuccessSVG)
    }
  } catch (err) {
    feedback.error(`${t.errorExportImage}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// ─── 清除数据（含 10 秒撤销） ───

export function clearProject(): void {
  const { project, rootNode, branchIdMap, clear } = useProjectStore.getState()
  const { selectBranch, setActiveCFType } = useSelectionStore.getState()
  const t = tr()
  if (!project) return

  // 快照用于撤销
  const snapshot = { project, rootNode, branchIdMap }
  clear()
  selectBranch(null)
  setActiveCFType('gene')

  // 10 秒撤销 toast（破坏性操作提供撤销替代路径）
  useFeedbackStore.getState().push('info', t.clearedWithUndo, {
    ttl: 10000,
    action: {
      label: t.undo,
      handler: () => {
        useProjectStore.setState(snapshot)
        useSelectionStore.getState().selectBranch(null)
        feedback.success(t.undoSuccess)
      },
    },
  })
}
