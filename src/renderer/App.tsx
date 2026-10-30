// src/renderer/App.tsx
// Main layout & three-view linking for CF-Panel

import React, { useState, useEffect } from 'react'
import TreeCanvas from './components/TreeCanvas'
import TernaryPlot from './components/TernaryPlot'
import VectorTable from './components/VectorTable'
import SidePanel from './components/SidePanel'
import CFTypeSelector from './components/CFTypeSelector'
import ResizablePanels from './components/ResizablePanels'
import { FeedbackRegion } from './components/FeedbackRegion'
import { ConfirmDialog } from './components/ConfirmDialog'
import { OverflowMenu, type MenuItemDef } from './components/OverflowMenu'
import { Icon, type IconName } from './components/Icon'
import { useProjectStore } from './stores/project'
import { useSelectionStore, flushPersist } from './stores/selection'
import { useSettingsStore } from './stores/settings'
import { useUIStore, type ViewMode } from './stores/ui'
import { useRovingRadio } from './hooks/useRovingRadio'
import {
  loadExample, openDirectory, openFiles,
  exportCSV, exportPNG, exportSVG, clearProject,
} from './lib/loaders'
import { parseNewick } from './lib/parse'
import type { CFPanelAPI } from '../preload/index'

declare global {
  interface Window {
    cfpanel: CFPanelAPI
  }
}

const VIEW_MODES = ['all', 'tree', 'ternary', 'table'] as const
const VIEW_ICONS: Record<ViewMode, IconName> = {
  all: 'grid',
  tree: 'tree',
  ternary: 'triangle',
  table: 'table',
}

const App: React.FC = () => {
  const { project, rootNode, branchIdMap, setProject, setTree, recentProjects, loadRecentProjects } = useProjectStore()
  const { restoreFromPersistence, setActiveCFType, selectBranch } = useSelectionStore()
  const { t, theme, language, toggleTheme, toggleLanguage } = useSettingsStore()
  const viewMode = useUIStore(s => s.viewMode)
  const setViewMode = useUIStore(s => s.setViewMode)
  const loading = useProjectStore(s => s.loading)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const viewRadio = useRovingRadio(VIEW_MODES, viewMode, setViewMode)

  // ─── Restore persisted state on mount ───
  useEffect(() => {
    restoreFromPersistence()
    loadRecentProjects()
  }, [restoreFromPersistence, loadRecentProjects])

  // ─── Sync menu language with main process ───
  useEffect(() => {
    if (window.cfpanel?.setLanguage) {
      window.cfpanel.setLanguage(language)
    }
  }, [language])

  // ─── Sync theme with main process (native window background) ───
  useEffect(() => {
    if (window.cfpanel?.setTheme) {
      window.cfpanel.setTheme(theme)
    }
  }, [theme])

  // Flush debounced persistence on unmount
  useEffect(() => {
    return () => {
      flushPersist()
    }
  }, [])

  // ─── Recent project restore ───
  const handleRestoreRecent = (rp: typeof recentProjects[number]) => {
    if (!rp.projectData) return
    // Compute capability flags from actual data
    const vectors = rp.projectData.vectors as any[]
    const hasGcf = vectors.some((v: any) => v.geneN > 0)
    const hasScfl = vectors.some((v: any) => v.siteN > 0)
    const hasCbl = vectors.some((v: any) => v.lengthCoalescent > 0)
    setProject({
      treeNewick: rp.projectData.treeNewick,
      branchIdTree: rp.projectData.branchIdTree,
      vectors,
      hasGcfStat: hasGcf,
      hasScflStat: hasScfl,
      hasCblStat: hasCbl,
    })
    if (rp.projectData.branchIdTree) {
      const { rootNode: root, branchIdMap: map } = parseNewick(rp.projectData.branchIdTree)
      setTree(root, map)
    } else if (rp.projectData.treeNewick) {
      const { rootNode: root, branchIdMap: map } = parseNewick(rp.projectData.treeNewick)
      setTree(root, map)
    }
    selectBranch(null)
  }

  // ─── Menu events from main process ───
  useEffect(() => {
    if (!window.cfpanel) return
    const cleanups: Array<() => void> = []
    cleanups.push(window.cfpanel.onMenuOpenDirectory(() => openDirectory()))
    cleanups.push(window.cfpanel.onMenuOpenFiles(() => openFiles()))
    cleanups.push(window.cfpanel.onMenuLoadExample(() => loadExample()))
    cleanups.push(window.cfpanel.onMenuExportCSV(() => exportCSV()))
    cleanups.push(window.cfpanel.onMenuExportPNG(() => exportPNG()))
    cleanups.push(window.cfpanel.onMenuExportSVG(() => exportSVG()))
    return () => {
      cleanups.forEach(cleanup => cleanup())
    }
  }, [])

      // ─── Global keyboard navigation ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        ) return
        // 表格 grid / 对话框 / 菜单 / 设置面板有自己的键盘模型
        if (target.closest?.('[role="grid"], [role="dialog"], [role="menu"], [role="alertdialog"], .tree-settings-panel')) return
      }

      if (!project) return
      const { selectedBranchId, selectBranch: select } = useSelectionStore.getState()
      const sortedIds = [...project.vectors].sort((a, b) => a.id - b.id).map(v => v.id)

      // Escape deselects
      if (e.key === 'Escape') {
        if (selectedBranchId !== null) {
          select(null)
          e.preventDefault()
        }
        return
      }

      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      // When nothing is selected, ArrowDown selects the first branch
      if (selectedBranchId === null) {
        if (e.key === 'ArrowDown' && sortedIds.length > 0) {
          select(sortedIds[0])
          e.preventDefault()
        }
        return
      }

      const currentIdx = sortedIds.indexOf(selectedBranchId)
      if (currentIdx === -1) return

      if (e.key === 'ArrowDown' && currentIdx < sortedIds.length - 1) {
        select(sortedIds[currentIdx + 1])
        e.preventDefault()
      } else if (e.key === 'ArrowUp' && currentIdx > 0) {
        select(sortedIds[currentIdx - 1])
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project])

  const hasData = project && project.vectors.length > 0

  // ─── Panel title rendering ───
  const renderPanel = (icon: IconName, title: string, hint: string, children: React.ReactNode) => (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title"><Icon name={icon} size={14} /> {title}</span>
        {hint && <span className="panel-hint">{hint}</span>}
      </div>
      {children}
    </div>
  )

  // ─── 打开 / 导出菜单项 ───
  const openMenuItems: MenuItemDef[] = [
    { key: 'files', label: t.openFiles, icon: 'file', onSelect: openFiles },
    { key: 'example', label: t.loadExampleData, icon: 'chart', onSelect: loadExample },
  ]
  const exportMenuItems: MenuItemDef[] = [
    { key: 'csv', label: t.exportCSV, icon: 'download', onSelect: exportCSV },
    { key: 'png', label: t.exportPNG, icon: 'image', onSelect: exportPNG },
    { key: 'svg', label: t.exportSVG, icon: 'ruler', onSelect: exportSVG },
  ]

  return (
    <div className="app">
      {/* ─── Skip link ─── */}
      <a href="#main-content" className="skip-link">{t.skipToContent}</a>

      {/* ─── Top Navigation Bar ─── */}
      <header className="app-header" role="banner">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon" aria-hidden="true"><Icon name="cfLogo" size={20} /></span>
            <span className="logo-text">CF&#8209;Panel</span>
          </div>
          <div className="header-divider" />
          <button
            className="header-btn header-btn--primary"
            onClick={openDirectory}
            disabled={loading}
            aria-label={t.openDirectory}
          >
            <Icon name="folder" size={15} /> {t.openDirectory}
          </button>
          <OverflowMenu label={t.openMenu} items={openMenuItems} />
          {hasData && <OverflowMenu label={t.exportMenu} icon="download" items={exportMenuItems} align="left" />}
          {hasData && (
            <button
              className="header-btn header-btn--danger"
              onClick={() => setConfirmClearOpen(true)}
              aria-label={t.clear}
            >
              <Icon name="trash" size={15} /> {t.clear}
            </button>
          )}
        </div>
        <div className="header-right">
          {hasData && <CFTypeSelector />}
          <div
            className="view-mode-toggle"
            role="radiogroup"
            aria-label={t.viewModeGroup}
            onKeyDown={viewRadio.onKeyDown}
          >
            {VIEW_MODES.map((m) => (
              <button
                key={m}
                className={`view-btn ${viewMode === m ? 'active' : ''}`}
                onClick={() => setViewMode(m)}
                title={VIEW_MODES_LABELS[m](t)}
                aria-label={VIEW_MODES_LABELS[m](t)}
                {...viewRadio.getProps(m)}
              >
                <Icon name={VIEW_ICONS[m]} size={15} />
              </button>
            ))}
          </div>
          <button
            className="header-btn settings-btn"
            onClick={toggleLanguage}
            title={t.language}
            aria-label={t.language}
          >
            <Icon name="globe" size={15} /> {language === 'en' ? 'EN' : '中文'}
          </button>
          <button
            className="header-btn settings-btn"
            onClick={toggleTheme}
            title={t.theme}
            aria-label={t.theme}
            aria-pressed={theme === 'dark'}
          >
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={15} />
          </button>
        </div>
      </header>

      {/* ─── Unified feedback region ─── */}
      <FeedbackRegion />

      {/* ─── Loading Overlay ─── */}
      {loading && (
        <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="spinner" aria-hidden="true" />
          <div className="loading-text">{t.loadingCFData}</div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="app-main" id="main-content" role="main" tabIndex={-1}>
        {!hasData && !loading && (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon" aria-hidden="true"><Icon name="dna" size={40} /></div>
              <h1>{t.welcomeTitle}</h1>
              <p className="welcome-desc">{t.welcomeDesc}</p>
              <div className="welcome-features">
                <div className="feature-item">
                  <span className="feature-icon" aria-hidden="true"><Icon name="tree" size={18} /></span>
                  <span>{t.featureTree}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon" aria-hidden="true"><Icon name="triangle" size={18} /></span>
                  <span>{t.featureTernary}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon" aria-hidden="true"><Icon name="table" size={18} /></span>
                  <span>{t.featureTable}</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon" aria-hidden="true"><Icon name="link" size={18} /></span>
                  <span>{t.featureLinked}</span>
                </div>
              </div>
              <div className="welcome-actions">
                <button className="welcome-btn primary" onClick={loadExample} autoFocus>
                  <Icon name="chart" size={15} /> {t.welcomeExampleData}
                </button>
                <button className="welcome-btn secondary" onClick={openDirectory}>
                  <Icon name="folder" size={15} /> {t.welcomeOpenDir}
                </button>
                <button className="welcome-btn secondary" onClick={openFiles}>
                  <Icon name="file" size={15} /> {t.welcomeOpenFiles}
                </button>
              </div>

              {/* Recent projects */}
              {recentProjects.length > 0 && (
                <div className="recent-projects-section">
                  <h3 className="recent-title">{t.recentProjects}</h3>
                  <div className="recent-list">
                    {recentProjects.map((rp) => (
                      <button
                        key={rp.id}
                        className="recent-item"
                        onClick={() => handleRestoreRecent(rp)}
                      >
                        <span className="recent-name">{rp.name}</span>
                        <span className="recent-meta">{rp.branchCount} {t.branches}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="welcome-example-desc">{t.welcomeExampleDesc}</div>
              <div className="welcome-note">
                {t.welcomeNote} <code>gcf.cf.stat</code>, <code>scfl.cf.stat</code>, <code>coalescent_bl.cf.stat</code>, <code>gcf.cf.tree</code>, <code>gcf.cf.branch</code>
              </div>
            </div>
          </div>
        )}

        {hasData && (
          <div className="app-main-views" style={{ height: '100%' }}>
            {viewMode === 'all' && (
              <ResizablePanels
                direction="horizontal"
                initialSizes={[0.4, 0.4, 0.2]}
                minSizes={[0.15, 0.15, 0.10]}
                persistKey="main-horizontal"
              >
                {renderPanel('tree', t.treeCanvas, t.treeHint, <TreeCanvas />)}

                <ResizablePanels direction="vertical" initialSizes={[0.5, 0.5]} minSizes={[0.10, 0.10]} persistKey="main-vertical">
                  {renderPanel('triangle', t.ternaryPlot, t.ternaryHint, <TernaryPlot />)}
                  {renderPanel('table', t.vectorTable, t.tableHint, <VectorTable />)}
                </ResizablePanels>

                {renderPanel('search', t.branchDetails, '', <SidePanel />)}
              </ResizablePanels>
            )}
            {viewMode === 'tree' && (
              <div className="panel full-panel">
                <div className="panel-header">
                  <span className="panel-title"><Icon name="tree" size={14} /> {t.treeCanvas}</span>
                </div>
                <TreeCanvas />
              </div>
            )}
            {viewMode === 'ternary' && (
              <div className="panel full-panel">
                <div className="panel-header">
                  <span className="panel-title"><Icon name="triangle" size={14} /> {t.ternaryPlot}</span>
                </div>
                <TernaryPlot />
              </div>
            )}
            {viewMode === 'table' && (
              <div className="panel full-panel">
                <div className="panel-header">
                  <span className="panel-title"><Icon name="table" size={14} /> {t.vectorTable}</span>
                </div>
                <VectorTable />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Confirm dialog ─── */}
      <ConfirmDialog
        open={confirmClearOpen}
        title={t.clear}
        message={t.clearConfirm}
        confirmLabel={t.clear}
        cancelLabel={t.cancel}
        destructive
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          setConfirmClearOpen(false)
          clearProject()
        }}
      />
    </div>
  )
}

const VIEW_MODES_LABELS: Record<ViewMode, (t: ReturnType<typeof useSettingsStore.getState>['t']) => string> = {
  all: (t) => t.viewAll,
  tree: (t) => t.viewTree,
  ternary: (t) => t.viewTernary,
  table: (t) => t.viewTable,
}

export default App
