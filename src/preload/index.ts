// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

export interface CFDirectoryFiles {
  gcfStat?: string
  scflStat?: string
  cblStat?: string
  gcfTree?: string
  gcfBranch?: string
}

export interface IQTreeRunOptions {
  iqtreeCommand: string
  speciesTree: string
  modelFile: string
  geneTrees: string
  outputDir: string
  scflQuartets: number
  threads: string
  iqtreeVersion?: '2' | '3'
}

export interface IQTreeRunResult {
  success: boolean
  step?: number
  description?: string
  output?: string
  error?: string
  step1Output?: string
  step2Output?: string
}

const api = {
  // File dialog operations
  openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),
  openFiles: (filters?: { name: string; extensions: string[] }[]): Promise<string[]> => ipcRenderer.invoke('dialog:openFiles', filters),
  saveFile: (defaultName: string): Promise<string | null> => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // File operations
  readFile: (filePath: string): Promise<string | null> => ipcRenderer.invoke('file:read', filePath),
  readCfDirectory: (dirPath: string): Promise<CFDirectoryFiles | null> => ipcRenderer.invoke('file:readCfDirectory', dirPath),
  saveFileContent: (filePath: string, content: string): Promise<boolean> => ipcRenderer.invoke('file:save', filePath, content),

  // Image export operations
  saveImage: (filePath: string, dataUrl: string): Promise<boolean> => ipcRenderer.invoke('file:saveImage', filePath, dataUrl),
  saveSVG: (filePath: string, svgContent: string): Promise<boolean> => ipcRenderer.invoke('file:saveSVG', filePath, svgContent),

  // IQ-TREE operations
  detectIQTreeVersion: (): Promise<{ command: string; version: string; majorVersion: '2' | '3' | null } | null> => ipcRenderer.invoke('iqtree:detectVersion'),
  runIQTree: (opts: IQTreeRunOptions): Promise<IQTreeRunResult> => ipcRenderer.invoke('iqtree:run', opts),

  // Export
  exportVectorsCSV: (vectors: Record<string, number>[]): Promise<boolean> => ipcRenderer.invoke('export:vectorsCSV', vectors),

  // Menu events — P1: Return cleanup functions to prevent duplicate listeners
  onMenuOpenDirectory: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:openDirectory', listener)
    return () => ipcRenderer.removeListener('menu:openDirectory', listener)
  },
  onMenuOpenFiles: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:openFiles', listener)
    return () => ipcRenderer.removeListener('menu:openFiles', listener)
  },
  onMenuLoadExample: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:loadExample', listener)
    return () => ipcRenderer.removeListener('menu:loadExample', listener)
  },
  onMenuExportCSV: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:exportCSV', listener)
    return () => ipcRenderer.removeListener('menu:exportCSV', listener)
  },
  onMenuExportPNG: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:exportPNG', listener)
    return () => ipcRenderer.removeListener('menu:exportPNG', listener)
  },
  onMenuExportSVG: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('menu:exportSVG', listener)
    return () => ipcRenderer.removeListener('menu:exportSVG', listener)
  },

  // Language setting (for menu i18n)
  setLanguage: (lang: string): Promise<boolean> => ipcRenderer.invoke('app:setLanguage', lang),

  // Theme setting (for native window background color)
  setTheme: (theme: string): Promise<boolean> => ipcRenderer.invoke('app:setTheme', theme),

  // Auto-update
  checkForUpdates: (): Promise<boolean> => ipcRenderer.invoke('app:checkForUpdates'),
}

try {
  contextBridge.exposeInMainWorld('cfpanel', api)
} catch (error) {
  console.error('Failed to expose API:', error)
}

export type CFPanelAPI = typeof api
