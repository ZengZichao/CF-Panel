// src/renderer/components/TreeCanvas.tsx
// 树画布组件 — 支持多布局、配色方案、字体调整、枝长开关、正则搜索
// 自动选择 SVG（<1000 分支）或 Canvas 2D（>1000 分支）渲染以优化性能
// Circular 布局渲染为圆弧（母半径弧段 + 子角度径向段），Canvas 路径同步
// Tooltip 贴边自动翻转 + aria-describedby 关联
// 点击热区随 zoom 反向缩放（屏幕恒定 ~12px）
// 设置面板 Escape 关闭 / 外部点击关闭 / 焦点归还
// 树设置通过 Zustand 管理（treeSettings store，persist 中间件）
// 配色方案色标图例
// 滚轮约定：拖拽平移 / Ctrl+滚轮缩放 / 裸滚轮滚动

import React, { useMemo, useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react'
import type { TreeNode, ColorSchemeType } from '../types/cf'
import { useProjectStore } from '../stores/project'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import { useTreeSettingsStore } from '../stores/treeSettings'
import { layoutTree, getPsiValues, getColorByScheme } from '../lib/parse'
import { shouldUseCanvas, renderTreeCanvas, hitTest } from '../lib/canvas-tree-renderer'
import { SCHEME_GRADIENTS, cssVar } from '../lib/format'
import { loadExample, openDirectory } from '../lib/loaders'
import { useRovingRadio } from '../hooks/useRovingRadio'
import { Icon } from './Icon'

interface TreeCanvasProps {
  width?: number
  height?: number
}

const LAYOUTS = ['rectangular', 'unrooted', 'circular'] as const

const TreeCanvas: React.FC<TreeCanvasProps> = ({ width = 800, height = 700 }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [actualWidth, setActualWidth] = useState(width)
  const [actualHeight, setActualHeight] = useState(height)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragMoved = useRef(false)
  const [showSettings, setShowSettings] = useState(false)
  const gearRef = useRef<HTMLButtonElement>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const { rootNode, branchIdMap, project } = useProjectStore()
  const { selectedBranchId, hoveredBranchId, selectBranch, hoverBranch, activeCFType } = useSelectionStore()
  const { t, theme } = useSettingsStore()
  const settings = useTreeSettingsStore()
  const updateSettings = settings.update
  const layoutRadio = useRovingRadio(LAYOUTS, settings.layoutType, (lt) => {
    updateSettings({ layoutType: lt })
    setZoom(1); setPanX(0); setPanY(0)
  })

  // ─── Determine whether to use Canvas 2D rendering ───
  const useCanvas2D = useMemo(() => {
    if (!rootNode) return false
    return shouldUseCanvas(rootNode, 1000)
  }, [rootNode])

  // ─── CSS 变量读取 ───
  const cssVars = useMemo(() => {
    return {
      treeRootFill: cssVar('--tree-root-fill', '#595959'),
      treeBranchDefault: cssVar('--tree-branch-default', '#595959'),
      colorPrimary: cssVar('--color-primary', '#1677ff'),
      highlightHover: cssVar('--highlight-hover', '#faad14'),
      textMuted: cssVar('--text-muted', 'rgba(0,0,0,0.45)'),
      textSecondary: cssVar('--text-secondary', 'rgba(0,0,0,0.65)'),
      colorPrimaryBg: cssVar('--color-primary-bg', '#e6f4ff'),
      bgElevated: cssVar('--bg-elevated', '#ffffff'),
      borderColor: cssVar('--border-color', '#d9d9d9'),
      textPrimary: cssVar('--text-primary', 'rgba(0,0,0,0.88)'),
    }
  }, [theme])

  // ─── 容器尺寸（ResizeObserver 响应面板拖拽） ───
  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setActualWidth(rect.width)
      setActualHeight(rect.height)
    }
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [rootNode])

  // ─── 布局计算 — Clone rootNode before layout to avoid mutating Zustand store nodes
  const layoutVersion = useMemo(() => {
    if (!rootNode || !branchIdMap || !project) return null
    function cloneNode(node: TreeNode, parent: TreeNode | null): TreeNode {
      const clone: TreeNode = {
        ...node,
        parent,
        children: node.children.map(c => cloneNode(c, null)),
      }
      clone.children.forEach(c => { c.parent = clone })
      return clone
    }
    const clonedRoot = cloneNode(rootNode, null)
    const clonedMap = new Map<number, TreeNode>()
    function collectCloned(node: TreeNode) {
      if (node.branchId !== null) clonedMap.set(node.branchId, node)
      for (const child of node.children) collectCloned(child)
    }
    collectCloned(clonedRoot)

    layoutTree(
      clonedRoot, actualWidth, actualHeight,
      clonedMap, project.vectors,
      settings.layoutType, settings.useBranchLength
    )
    return { root: clonedRoot, map: clonedMap }
  }, [rootNode, branchIdMap, project, actualWidth, actualHeight, settings.layoutType, settings.useBranchLength])

  // ─── Canvas 2D 渲染（高性能路径） ───
  useEffect(() => {
    if (!useCanvas2D || !layoutVersion || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = actualWidth * dpr
    canvas.height = actualHeight * dpr
    canvas.style.width = `${actualWidth}px`
    canvas.style.height = `${actualHeight}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    renderTreeCanvas({
      ctx,
      rootNode: layoutVersion.root,
      width: actualWidth,
      height: actualHeight,
      zoom,
      panX,
      panY,
      layoutType: settings.layoutType,
      branchWidth: settings.branchWidth,
      colorScheme: settings.colorScheme,
      activeCFType,
      selectedBranchId,
      hoveredBranchId,
      showLabels: settings.showLabels,
      showBranchIds: settings.showBranchIds,
      labelFontSize: settings.labelFontSize,
      labelFontColor: settings.labelFontColor || cssVars.textSecondary,
      cssVars,
    })
  }, [useCanvas2D, layoutVersion, actualWidth, actualHeight, zoom, panX, panY,
      settings, activeCFType, selectedBranchId, hoveredBranchId, cssVars, theme])

  // ─── Hover tooltip 状态 ───
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)

  // 贴边自动翻转（useLayoutEffect 在绘制前完成测量与位置修正）
  useLayoutEffect(() => {
    if (!tooltip) { setTooltipPos(null); return }
    const el = tooltipRef.current
    const cont = containerRef.current
    if (!el || !cont) return
    const tw = el.offsetWidth
    const th = el.offsetHeight
    let left = tooltip.x
    let top = tooltip.y
    if (left + tw > cont.clientWidth - 8) left = Math.max(8, tooltip.x - tw - 24) // 翻转到指针左侧
    if (top + th > cont.clientHeight - 8) top = Math.max(8, tooltip.y - th - 24)  // 翻转到指针上方
    setTooltipPos({ left, top })
  }, [tooltip])

  // ─── 点击和悬停处理 ───
  const handleBranchClick = useCallback((branchId: number | null) => {
    selectBranch(branchId)
  }, [selectBranch])

  const handleBranchHover = useCallback((branchId: number | null) => {
    hoverBranch(branchId)
  }, [hoverBranch])

  // ─── Canvas click handler (hit testing) — 命中半径按 zoom 反向缩放 ───
  const screenHitRadius = useMemo(
    () => Math.min(40, Math.max(4, 10 / zoom)),
    [zoom]
  )

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (dragMoved.current) { dragMoved.current = false; return } // 拖拽结束不触发选择
    if (!layoutVersion || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const branchId = hitTest(layoutVersion.root, clickX, clickY, zoom, panX, panY, settings.layoutType, screenHitRadius)
    if (branchId !== null) {
      selectBranch(branchId)
    }
  }, [layoutVersion, zoom, panX, panY, settings.layoutType, screenHitRadius, selectBranch])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.current.x)
      setPanY(e.clientY - dragStart.current.y)
      return
    }
    if (!layoutVersion || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const branchId = hitTest(layoutVersion.root, mouseX, mouseY, zoom, panX, panY, settings.layoutType, screenHitRadius)
    hoverBranch(branchId)
  }, [isDragging, layoutVersion, zoom, panX, panY, settings.layoutType, screenHitRadius, hoverBranch])

  // ─── 平移和缩放 — 左键直接拖拽平移；Ctrl/⌘+滚轮缩放；裸滚轮滚动 ───
  const dragStartClient = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      e.preventDefault()
      setIsDragging(true)
      dragMoved.current = false
      dragStartClient.current = { x: e.clientX, y: e.clientY }
      dragStart.current = { x: e.clientX - panX, y: e.clientY - panY }
    }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      if (
        Math.abs(e.clientX - dragStartClient.current.x) > 3 ||
        Math.abs(e.clientY - dragStartClient.current.y) > 3
      ) {
        dragMoved.current = true
      }
      setPanX(e.clientX - dragStart.current.x)
      setPanY(e.clientY - dragStart.current.y)
    }
  }
  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    if (e.ctrlKey || e.metaKey) {
      // 缩放（触控板捏合与 Ctrl+滚轮同路）
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(z => Math.max(0.2, Math.min(5, z * delta)))
    } else {
      // 平移：裸滚轮 = 垂直滚动，Shift+滚轮 = 水平滚动
      const dx = e.shiftKey ? e.deltaY : e.deltaX
      const dy = e.shiftKey ? 0 : e.deltaY
      setPanX(x => x - dx)
      setPanY(y => y - dy)
    }
  }

  // ─── 设置面板: Escape 关闭 / 外部点击关闭 / 焦点归还 ───
  useEffect(() => {
    if (!showSettings) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setShowSettings(false)
        gearRef.current?.focus()
      }
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (settingsPanelRef.current?.contains(target)) return
      if (gearRef.current?.contains(target)) return
      setShowSettings(false)
    }
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [showSettings])

  const toggleSettings = useCallback(() => {
    setShowSettings((open) => {
      if (!open) {
        // 打开时聚焦面板第一个可聚焦控件
        requestAnimationFrame(() => {
          settingsPanelRef.current?.querySelector<HTMLElement>('button, select, input')?.focus()
        })
      } else {
        gearRef.current?.focus()
      }
      return !open
    })
  }, [])

  // ─── 搜索匹配 ───
  const matchedNodes = useMemo(() => {
    if (!settings.searchQuery || !layoutVersion) return new Set<string>()
    const results = new Set<string>()
    let regex: RegExp | null = null
    if (settings.useRegex) {
      try {
        regex = new RegExp(settings.searchQuery, 'i')
      } catch {
        regex = null
      }
    }
    function traverse(node: TreeNode) {
      const name = node.name.replace(/_/g, ' ')
      const branchIdStr = node.branchId !== null ? String(node.branchId) : ''
      let matched = false
      if (settings.useRegex && regex) {
        matched = regex.test(name) || (branchIdStr.length > 0 && regex.test(branchIdStr))
      } else {
        const q = settings.searchQuery.toLowerCase()
        matched = name.toLowerCase().includes(q) || (branchIdStr.length > 0 && branchIdStr.includes(q))
      }
      if (matched) {
        results.add(node.name + '|' + branchIdStr)
      }
      for (const child of node.children) traverse(child)
    }
    traverse(layoutVersion.root)
    return results
  }, [settings.searchQuery, settings.useRegex, layoutVersion])

  const matchCount = matchedNodes.size

  // ─── P0: Label density LOD — 贪心逐行抽样（行高约束，zoom 无关），
  //         搜索命中项强制显示 ───
  const labelVisibleNodes = useMemo(() => {
    if (!layoutVersion) return new Set<string>()
    const leaves: TreeNode[] = []
    function collectLeaves(node: TreeNode) {
      if (node.isLeaf) leaves.push(node)
      else for (const child of node.children) collectLeaves(child)
    }
    collectLeaves(layoutVersion.root)

    const rowHeight = settings.labelFontSize * 1.6 // 树空间内的最小行距（字号随 zoom 同缩放）

    // 贪心抽样：按 y 排序，相邻可见标签间距 ≥ rowHeight
    const sorted = [...leaves].sort((a, b) => a.y - b.y)
    const visible = new Set<string>()
    let lastY = -Infinity
    for (const leaf of sorted) {
      if (leaf.y - lastY >= rowHeight) {
        visible.add(leaf.name)
        lastY = leaf.y
      }
    }
    // 搜索命中强制显示（命中但被 LOD 隐藏 = 搜索失效）
    if (settings.searchQuery) {
      for (const leaf of leaves) {
        if (matchedNodes.has(leaf.name + '|' + (leaf.branchId !== null ? String(leaf.branchId) : ''))) {
          visible.add(leaf.name)
        }
      }
    }
    return visible
  }, [layoutVersion, settings.labelFontSize, settings.searchQuery, matchedNodes])

  const edges = useMemo(() => {
    if (!layoutVersion) return []
    const result: { node: TreeNode; parent: TreeNode | null; key: string }[] = []
    function traverse(node: TreeNode, parent: TreeNode | null) {
      const key = `${parent ? (parent.name || 'r') + '-' : ''}${node.name || node.branchId || ''}-${result.length}`
      result.push({ node, parent, key })
      for (const child of node.children) {
        traverse(child, node)
      }
    }
    traverse(layoutVersion.root, null)
    return result
  }, [layoutVersion])

  // ─── 判断节点是否匹配搜索 ───
  const isNodeMatched = useCallback((node: TreeNode): boolean => {
    if (settings.searchQuery === '') return false
    return matchedNodes.has(node.name + '|' + (node.branchId !== null ? String(node.branchId) : ''))
  }, [settings.searchQuery, matchedNodes])

  // ─── 边路径几何 — circular 用「母半径弧 + 径向段」 ───
  const buildEdgePath = useCallback((parent: TreeNode, node: TreeNode): string => {
    if (settings.layoutType === 'rectangular') {
      return `M ${parent.x} ${parent.y} L ${parent.x} ${node.y} L ${node.x} ${node.y}`
    }
    if (settings.layoutType === 'circular') {
      const cx = layoutVersion?.root.cx
      const cy = layoutVersion?.root.cy
      if (cx != null && cy != null) {
        const r = Math.hypot(parent.x - cx, parent.y - cy)
        if (r > 1e-6) {
          const a0 = Math.atan2(parent.y - cy, parent.x - cx)
          const a1 = Math.atan2(node.y - cy, node.x - cx)
          let d = a1 - a0
          while (d > Math.PI) d -= 2 * Math.PI
          while (d < -Math.PI) d += 2 * Math.PI
          const endX = cx + r * Math.cos(a0 + d)
          const endY = cy + r * Math.sin(a0 + d)
          const sweep = d > 0 ? 1 : 0
          return `M ${parent.x} ${parent.y} A ${r} ${r} 0 0 ${sweep} ${endX} ${endY} L ${node.x} ${node.y}`
        }
      }
      return `M ${parent.x} ${parent.y} L ${node.x} ${node.y}`
    }
    return `M ${parent.x} ${parent.y} L ${node.x} ${node.y}`
  }, [settings.layoutType, layoutVersion])

  if (!rootNode) {
    return (
      <div className="tree-canvas-empty" ref={containerRef} role="region" aria-label={t.ariaTreeCanvas}>
        <div className="empty-icon" aria-hidden="true"><Icon name="tree" size={36} /></div>
        <div className="empty-text">{t.emptyTree}</div>
        {/* 空状态 next action */}
        <div className="empty-actions">
          <button className="btn-mini btn-mini--primary" onClick={loadExample}>
            <Icon name="chart" size={14} /> {t.welcomeExampleData}
          </button>
          <button className="btn-mini" onClick={openDirectory}>
            <Icon name="folder" size={14} /> {t.openDirectory}
          </button>
        </div>
      </div>
    )
  }

  // ─── 默认标签颜色 ───
  const labelColor = settings.labelFontColor || cssVars.textSecondary

  // ─── 渲染分支路径 (SVG) ───
  const renderEdge = (node: TreeNode, parent: TreeNode | null, idx: string) => {
    if (!parent) {
      return (
        <g key={`node-${idx}`}>
          {node.children.length > 0 && (
            <circle
              cx={node.x}
              cy={node.y}
              r={3}
              fill={cssVars.treeRootFill}
            />
          )}
        </g>
      )
    }

    // 分支颜色
    let strokeColor = cssVars.treeBranchDefault
    let strokeWidth = settings.branchWidth
    const vector = node.vector

    if (vector) {
      const psi = getPsiValues(vector, activeCFType)
      strokeColor = getColorByScheme(psi.psi1, psi.psi2, psi.psi3, psi.psi4, settings.colorScheme)
      strokeWidth = settings.branchWidth * 1.3
    }

    // 高亮状态
    const isSelected = selectedBranchId !== null && node.branchId === selectedBranchId
    const isHovered = hoveredBranchId !== null && node.branchId === hoveredBranchId
    const isMatched = isNodeMatched(node)

    if (isSelected) {
      strokeWidth = Math.max(settings.branchWidth * 3, 3)
      strokeColor = cssVars.colorPrimary
    } else if (isHovered) {
      strokeWidth = Math.max(settings.branchWidth * 2.5, 2.5)
      strokeColor = cssVars.highlightHover
    } else if (isMatched) {
      strokeWidth = Math.max(settings.branchWidth * 2, 2)
    }

    const path = buildEdgePath(parent, node)

    return (
      <g key={`edge-${idx}`}>
        {/* 不可见的更宽路径用于点击 — 热区随 zoom 反向缩放，屏幕恒定 */}
        <path
          d={path}
          stroke="transparent"
          strokeWidth={Math.min(28, Math.max(6, 12 / zoom))}
          fill="none"
          style={{ cursor: 'pointer' }}
          onClick={() => handleBranchClick(node.branchId)}
          onMouseEnter={(e) => {
            handleBranchHover(node.branchId)
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
              setTooltip({
                x: e.clientX - rect.left + 12,
                y: e.clientY - rect.top + 12,
                text: node.name ? `${node.name.replace(/_/g, ' ')}${node.branchId !== null ? ' (#' + node.branchId + ')' : ''}` : `Branch #${node.branchId}`,
              })
            }
          }}
          onMouseLeave={() => {
            handleBranchHover(null)
            setTooltip(null)
          }}
        />
        {/* 可见路径 */}
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            pointerEvents: 'none',
            transition: 'stroke-width 0.1s ease, stroke 0.1s ease',
            opacity: isMatched && !isSelected && !isHovered ? 1 : undefined,
          }}
        />
        {/* 分支 ID 标签（内节点）— P0: 默认隐藏，zoom 高时才显示 */}
        {settings.showBranchIds && node.branchId !== null && !node.isLeaf && (zoom > 0.8) && (
          <text
            x={settings.layoutType === 'rectangular' ? (parent.x + node.x) / 2 : node.x + 8}
            y={settings.layoutType === 'rectangular' ? node.y - 4 : node.y}
            fontSize={Math.max(settings.labelFontSize - 1, 8)}
            fill={isSelected ? cssVars.colorPrimary : isHovered ? cssVars.highlightHover : cssVars.textMuted}
            textAnchor={settings.layoutType === 'rectangular' ? 'middle' : 'start'}
            style={{
              pointerEvents: 'none',
              fontFamily: "'JetBrains Mono', 'SF Mono', 'SFMono-Regular', Consolas, monospace",
              transition: 'fill 0.1s ease'
            }}
          >
            {node.branchId}
          </text>
        )}
        {/* 叶子标签 — P0: LOD 抽样 + 搜索命中强制显示 */}
        {settings.showLabels && node.isLeaf && node.name && (zoom > 0.3) && labelVisibleNodes.has(node.name) && (
          <text
            x={settings.layoutType === 'rectangular' ? node.x + 4 : node.x + 6}
            y={settings.layoutType === 'rectangular' ? node.y + 3 : node.y + 3}
            fontSize={settings.labelFontSize}
            fill={isMatched ? cssVars.colorPrimary : labelColor}
            fontWeight={isMatched ? 700 : 400}
            textAnchor="start"
            style={{
              pointerEvents: 'none',
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
              transition: 'fill 0.1s ease, font-weight 0.1s ease'
            }}
          >
            {node.name.replace(/_/g, ' ')}
          </text>
        )}
      </g>
    )
  }

  const treeAriaLabel = project
    ? `${project.vectors.length} ${t.branches} · ${t.ariaTreeCanvas}`
    : t.ariaTreeCanvas

  return (
    <div
      className="tree-canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      data-testid="tree-canvas"
      role="region"
      aria-label={t.ariaTreeCanvas}
      tabIndex={0}
      aria-describedby={tooltip ? 'tree-tooltip' : 'tree-sr-status'}
    >
      {/* Screen reader live region */}
      <div id="tree-sr-status" role="status" aria-live="polite" className="sr-only">
        {selectedBranchId !== null ? t.srBranchSelected.replace('{id}', String(selectedBranchId)) : ''}
      </div>

      {/* ─── Hover tooltip ─── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          id="tree-tooltip"
          className="tree-tooltip"
          style={{ left: tooltipPos?.left ?? tooltip.x, top: tooltipPos?.top ?? tooltip.y }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}

      {/* ─── 浮动控制按钮 ─── */}
      <div className="tree-controls" role="toolbar" aria-label={t.treeSettings}>
        <button className="ctrl-btn" onClick={() => setZoom(z => Math.min(5, z * 1.2))} title={t.zoomIn} aria-label={t.zoomIn}><Icon name="plus" size={14} /></button>
        <button className="ctrl-btn" onClick={() => setZoom(z => Math.max(0.2, z * 0.83))} title={t.zoomOut} aria-label={t.zoomOut}><Icon name="minus" size={14} /></button>
        <button className="ctrl-btn" onClick={() => { setZoom(1); setPanX(0); setPanY(0) }} title={t.resetView} aria-label={t.resetView}><Icon name="reset" size={14} /></button>
        <span className="zoom-label" aria-label={`${t.ariaZoomLevel}: ${Math.round(zoom * 100)}%`}>{Math.round(zoom * 100)}%</span>
        <div className="tree-controls-divider" />
        <button
          ref={gearRef}
          className={`ctrl-btn ${showSettings ? 'active' : ''}`}
          onClick={toggleSettings}
          title={t.treeSettings}
          aria-label={t.treeSettings}
          aria-expanded={showSettings}
        ><Icon name="gear" size={14} /></button>
      </div>

      {/* ─── 搜索框 ─── */}
      <div className="tree-search-box">
        <input
          type="text"
          className="tree-search-input"
          placeholder={t.searchPlaceholder}
          value={settings.searchQuery}
          onChange={e => updateSettings({ searchQuery: e.target.value })}
          aria-label={t.searchBranch}
        />
        <button
          className={`tree-regex-btn ${settings.useRegex ? 'active' : ''}`}
          onClick={() => updateSettings({ useRegex: !settings.useRegex })}
          title={t.searchRegex}
          aria-pressed={settings.useRegex}
          aria-label={t.searchRegex}
        >.*</button>
        {matchCount > 0 && (
          <span className="tree-search-count" aria-live="polite">{matchCount} {t.matchCount}</span>
        )}
      </div>

      {/* ─── 设置面板 ─── */}
      {showSettings && (
        <div
          ref={settingsPanelRef}
          className="tree-settings-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t.treeSettings}
        >
          {/* 布局选择 — roving tabindex */}
          <div className="tree-setting-row">
            <label className="tree-setting-label" id="layout-label">{t.treeLayout}</label>
            <div
              className="tree-setting-options"
              role="radiogroup"
              aria-labelledby="layout-label"
              onKeyDown={layoutRadio.onKeyDown}
            >
              {LAYOUTS.map(lt => (
                <button
                  key={lt}
                  className={`tree-setting-btn ${settings.layoutType === lt ? 'active' : ''}`}
                  onClick={() => {
                    updateSettings({ layoutType: lt })
                    setZoom(1); setPanX(0); setPanY(0)
                  }}
                  {...layoutRadio.getProps(lt)}
                >
                  {lt === 'rectangular' ? t.layoutRectangular : lt === 'unrooted' ? t.layoutUnrooted : t.layoutCircular}
                </button>
              ))}
            </div>
          </div>

          {/* 枝长开关 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.useBranchLength}</label>
            <button
              className={`tree-toggle-btn ${settings.useBranchLength ? 'active' : ''}`}
              onClick={() => {
                updateSettings({ useBranchLength: !settings.useBranchLength })
                setZoom(1); setPanX(0); setPanY(0)
              }}
              role="switch"
              aria-checked={settings.useBranchLength}
            >
              {settings.useBranchLength ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 配色方案 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.branchColorScheme}</label>
            <select
              className="tree-setting-select"
              value={settings.colorScheme}
              onChange={e => updateSettings({ colorScheme: e.target.value as ColorSchemeType })}
              aria-label={t.branchColorScheme}
            >
              <option value="heat">{t.colorSchemeHeat}</option>
              <option value="rainbow">{t.colorSchemeRainbow}</option>
              <option value="blueRed">{t.colorSchemeBlue}</option>
              <option value="monochrome">{t.colorSchemeMono}</option>
            </select>
          </div>

          {/* 分支粗细 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.branchWidth}</label>
            <div className="tree-slider-group">
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={settings.branchWidth}
                onChange={e => updateSettings({ branchWidth: parseFloat(e.target.value) })}
                className="tree-slider"
                aria-label={t.branchWidth}
              />
              <span className="tree-slider-value">{settings.branchWidth.toFixed(1)}</span>
            </div>
          </div>

          {/* 字体大小 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.labelFontSize}</label>
            <div className="tree-slider-group">
              <input
                type="range"
                min="6"
                max="24"
                step="1"
                value={settings.labelFontSize}
                onChange={e => updateSettings({ labelFontSize: parseInt(e.target.value) })}
                className="tree-slider"
                aria-label={t.labelFontSize}
              />
              <span className="tree-slider-value">{settings.labelFontSize}px</span>
            </div>
          </div>

          {/* 标签颜色 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.labelFontColor}</label>
            <div className="tree-color-group">
              <input
                type="color"
                value={settings.labelFontColor || '#666666'}
                onChange={e => updateSettings({ labelFontColor: e.target.value })}
                className="tree-color-picker"
                aria-label={t.labelFontColor}
              />
              <button
                className="tree-color-reset"
                onClick={() => updateSettings({ labelFontColor: '' })}
                aria-label="Reset color"
              >↺</button>
            </div>
          </div>

          {/* 显示标签 */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.showLabels}</label>
            <button
              className={`tree-toggle-btn ${settings.showLabels ? 'active' : ''}`}
              onClick={() => updateSettings({ showLabels: !settings.showLabels })}
              role="switch"
              aria-checked={settings.showLabels}
            >
              {settings.showLabels ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 显示分支 ID */}
          <div className="tree-setting-row">
            <label className="tree-setting-label">{t.showBranchIds}</label>
            <button
              className={`tree-toggle-btn ${settings.showBranchIds ? 'active' : ''}`}
              onClick={() => updateSettings({ showBranchIds: !settings.showBranchIds })}
              role="switch"
              aria-checked={settings.showBranchIds}
            >
              {settings.showBranchIds ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* ─── 配色图例 ─── */}
      {project && project.vectors.length > 0 && (
        <div className="plot-legend" aria-hidden="true">
          <span className="plot-legend__title">{t.legendConcordance}</span>
          <span>{t.legendLow}</span>
          <span className="plot-legend__bar" style={{ background: SCHEME_GRADIENTS[settings.colorScheme] }} />
          <span>{t.legendHigh}</span>
        </div>
      )}

      {/* ─── Tree rendering: Canvas 2D or SVG ─── */}
      {useCanvas2D ? (
        <canvas
          ref={canvasRef}
          style={{
            width: actualWidth,
            height: actualHeight,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); hoverBranch(null); setTooltip(null) }}
          onWheel={handleWheel}
          role="img"
          aria-label={treeAriaLabel}
        />
      ) : (
        <svg
          width={actualWidth}
          height={actualHeight}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          role="img"
          aria-label={treeAriaLabel}
        >
          <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
            {edges.map(({ node, parent, key }, idx) => renderEdge(node, parent, key))}
          </g>
        </svg>
      )}
    </div>
  )
}

export default TreeCanvas
