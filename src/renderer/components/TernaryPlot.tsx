// src/renderer/components/TernaryPlot.tsx
// Linear styled ternary plot with theme-aware tokens
// Supports convex hull and KDE density contour overlays
// 聚焦模式三档（emphasize / dim-less / hide-others），非选中点保留可辨度
// Ψ 单位统一 — 所有 Ψ 值（含 quartet）一律以 % 呈现（format.ts 单一真相源）
// 增加 Ψ₁ 占比色标图例

import React, { useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, GraphicComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useProjectStore } from '../stores/project'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import { useTernarySettingsStore, type TernaryFocusMode } from '../stores/ternarySettings'
import { getPsiValues } from '../lib/parse'
import { formatPsi, formatBranchIdLabel, SCHEME_GRADIENTS, cssVar } from '../lib/format'
import { loadExample, openDirectory } from '../lib/loaders'
import { Icon } from './Icon'

echarts.use([ScatterChart, TooltipComponent, GridComponent, LegendComponent, GraphicComponent, CanvasRenderer])

// ─── KDE (Kernel Density Estimation) helpers ───

interface Point2D { x: number; y: number }

/**
 * Compute 2D KDE density at a given point using a Gaussian kernel.
 */
function kdeDensity(px: number, py: number, points: Point2D[], bandwidth: number): number {
  let sum = 0
  const h2 = bandwidth * bandwidth
  for (const p of points) {
    const dx = px - p.x
    const dy = py - p.y
    const d2 = dx * dx + dy * dy
    sum += Math.exp(-d2 / (2 * h2))
  }
  return sum / (points.length * 2 * Math.PI * h2)
}

/**
 * Generate density contour levels using a grid-based approach.
 * Returns an array of contour line segments.
 */
function generateDensityContours(
  points: Point2D[],
  levels: number[],
  gridResolution: number = 60
): Array<{ level: number; segments: Array<[number, number][]> }> {
  if (points.length === 0) return []

  // Compute bandwidth using Silverman's rule
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length
  const stdX = Math.sqrt(xs.reduce((s, x) => s + (x - meanX) ** 2, 0) / xs.length) || 0.1
  const stdY = Math.sqrt(ys.reduce((s, y) => s + (y - meanY) ** 2, 0) / ys.length) || 0.1
  const bandwidth = 1.06 * Math.min(stdX, stdY) * Math.pow(points.length, -0.2)
  const h = Math.max(bandwidth, 0.02)

  // Build density grid
  const minX = -0.1, maxX = 1.1
  const minY = -0.15, maxY = Math.sqrt(3) / 2 + 0.15
  const stepX = (maxX - minX) / gridResolution
  const stepY = (maxY - minY) / gridResolution
  const grid: number[][] = []
  for (let i = 0; i <= gridResolution; i++) {
    grid[i] = []
    for (let j = 0; j <= gridResolution; j++) {
      grid[i][j] = kdeDensity(minX + i * stepX, minY + j * stepY, points, h)
    }
  }

  // Marching squares for each level
  const contours: Array<{ level: number; segments: Array<[number, number][]> }> = []
  for (const level of levels) {
    const segments: Array<[number, number][]> = []
    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const tl = grid[i][j + 1]
        const tr = grid[i + 1][j + 1]
        const bl = grid[i][j]
        const br = grid[i + 1][j]

        const x0 = minX + i * stepX
        const x1 = minX + (i + 1) * stepX
        const y0 = minY + j * stepY
        const y1 = minY + (j + 1) * stepY

        const caseIndex =
          (tl >= level ? 8 : 0) |
          (tr >= level ? 4 : 0) |
          (br >= level ? 2 : 0) |
          (bl >= level ? 1 : 0)

        if (caseIndex === 0 || caseIndex === 15) continue

        // Linear interpolation for edge crossings
        const interp = (v1: number, v2: number, p1: number, p2: number) =>
          p1 + (level - v1) / (v2 - v1) * (p2 - p1)

        // Simplified marching squares - handle common cases
        if (caseIndex === 1 || caseIndex === 14) {
          segments.push([[x0, interp(bl, tl, y0, y1)], [interp(bl, br, x0, x1), y0]])
        } else if (caseIndex === 2 || caseIndex === 13) {
          segments.push([[interp(bl, br, x0, x1), y0], [x1, interp(tr, br, y1, y0)]])
        } else if (caseIndex === 4 || caseIndex === 11) {
          segments.push([[x1, interp(tr, br, y1, y0)], [interp(tl, tr, x0, x1), y1]])
        } else if (caseIndex === 8 || caseIndex === 7) {
          segments.push([[interp(tl, tr, x0, x1), y1], [x0, interp(bl, tl, y0, y1)]])
        } else if (caseIndex === 6 || caseIndex === 9) {
          // Saddle point - two segments
          segments.push([[x0, interp(bl, tl, y0, y1)], [x1, interp(tr, br, y1, y0)]])
          segments.push([[interp(bl, br, x0, x1), y0], [interp(tl, tr, x0, x1), y1]])
        }
      }
    }
    contours.push({ level, segments })
  }

  return contours
}

/**
 * Compute convex hull using Andrew's monotone chain algorithm.
 */
function convexHull(points: Point2D[]): Point2D[] {
  if (points.length < 3) return points
  const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x)
  const cross = (O: Point2D, A: Point2D, B: Point2D) =>
    (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)

  const lower: Point2D[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Point2D[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

const TernaryPlot: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const { project } = useProjectStore()
  const { selectedBranchId, hoveredBranchId, selectBranch, hoverBranch, activeCFType } = useSelectionStore()
  const { t } = useSettingsStore()
  const {
    focusMode, showConvexHull, showDensityContour,
    setFocusMode, setShowConvexHull, setShowDensityContour,
  } = useTernarySettingsStore()

  // Compute scatter data — P0: Track points with non-zero Ψ₄ for notification
  const scatterData = useMemo(() => {
    if (!project) return []
    return project.vectors.map((v) => {
      const psi = getPsiValues(v, activeCFType)
      const total = psi.psi1 + psi.psi2 + psi.psi3
      if (total === 0) return null

      const a = psi.psi1 / total
      const b = psi.psi2 / total
      const c = psi.psi3 / total

      const x = b + c * 0.5
      const y = c * (Math.sqrt(3) / 2)

      return {
        id: v.id,
        value: [x, y],
        psi1: psi.psi1,
        psi2: psi.psi2,
        psi3: psi.psi3,
        psi4: psi.psi4,
        cfType: activeCFType,
        branchId: v.id
      }
    }).filter(d => d !== null) as any[]
  }, [project, activeCFType])

  // P0: Count points with non-zero Ψ₄ that are projected onto the ternary
  const psi4Count = useMemo(() => {
    return scatterData.filter(d => d.psi4 > 0).length
  }, [scatterData])

  // Compute convex hull
  const hullPoints = useMemo(() => {
    if (!showConvexHull || scatterData.length < 3) return null
    const pts: Point2D[] = scatterData.map(d => ({ x: d.value[0], y: d.value[1] }))
    return convexHull(pts)
  }, [showConvexHull, scatterData])

  // Compute density contours — use Silverman's rule of thumb for KDE bandwidth
  const densityContours = useMemo(() => {
    if (!showDensityContour || scatterData.length < 5) return []
    const pts: Point2D[] = scatterData.map(d => ({ x: d.value[0], y: d.value[1] }))
    // Silverman's rule: h = 0.9 * min(std, IQR/1.34) * n^(-1/5)
    const n = pts.length
    const xs = pts.map(p => p.x)
    const ys = pts.map(p => p.y)
    const meanX = xs.reduce((a, b) => a + b, 0) / n
    const meanY = ys.reduce((a, b) => a + b, 0) / n
    const stdX = Math.sqrt(xs.reduce((a, b) => a + (b - meanX) ** 2, 0) / n)
    const stdY = Math.sqrt(ys.reduce((a, b) => a + (b - meanY) ** 2, 0) / n)
    const std = Math.sqrt((stdX ** 2 + stdY ** 2) / 2)
    const bandwidth = 0.9 * std * Math.pow(n, -1 / 5)
    const maxDensity = Math.max(...pts.map(p => kdeDensity(p.x, p.y, pts, bandwidth)))
    const levels = [0.1, 0.3, 0.5, 0.7, 0.9].map(l => l * maxDensity)
    return generateDensityContours(pts, levels)
  }, [showDensityContour, scatterData])

  // Render/update chart
  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    const chart = chartInstance.current

    // Read theme-aware colors from CSS variables
    const gridColor = cssVar('--ternary-grid-color', '#424242')
    const triangleColor = cssVar('--ternary-triangle-color', '#595959')
    const colorPrimary = cssVar('--color-primary', '#1677ff')
    const highlightHover = cssVar('--highlight-hover', '#faad14')
    const labelColor1 = cssVar('--accent-site', '#1677ff')
    const labelColor2 = cssVar('--accent-gene', '#52c41a')
    const labelColor3 = cssVar('--accent-quartet', '#fa8c16')
    const bgContainer = cssVar('--bg-elevated', '#ffffff')
    const textPrimary = cssVar('--text-primary', 'rgba(0,0,0,0.88)')
    const textSecondary = cssVar('--text-secondary', 'rgba(0,0,0,0.65)')
    const borderColor = cssVar('--border-color', '#d9d9d9')

    const h = Math.sqrt(3) / 2

    const A = [0, 0]
    const B = [1, 0]
    const C = [0.5, h]

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: bgContainer,
        borderColor: borderColor,
        borderWidth: 1,
        textStyle: {
          color: textPrimary,
          fontSize: 13
        },
        padding: [8, 12],
        borderRadius: 6,
        extraCssText: 'box-shadow: 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);',
        formatter: (params: any) => {
          const d = params.data
          if (!d) return ''
          // Ψ 单位统一 — 所有类型（含 quartet）一律为百分数
          return `<div style="font-size:13px;line-height:1.5714">
            <b style="color:${colorPrimary}">${formatBranchIdLabel(t.branchIdLabel, d.branchId)}</b><br/>
            <span style="color:${textSecondary}">Ψ₁:</span> ${formatPsi(d.psi1)}<br/>
            <span style="color:${textSecondary}">Ψ₂:</span> ${formatPsi(d.psi2)}<br/>
            <span style="color:${textSecondary}">Ψ₃:</span> ${formatPsi(d.psi3)}<br/>
            <span style="color:${textSecondary}">Ψ₄:</span> ${formatPsi(d.psi4)}
          </div>`
        }
      },
      // Lock 1:1 aspect ratio so the triangle is always equilateral
      grid: { left: 60, right: 60, top: 60, bottom: 60 },
      xAxis: {
        type: 'value',
        min: -0.1,
        max: 1.1,
        show: false,
        // Lock scale to prevent stretching
        scale: true,
      },
      yAxis: {
        type: 'value',
        min: -0.15,
        max: h + 0.15,
        show: false,
        scale: true,
      },
      series: [
        {
          type: 'scatter',
          data: scatterData.map(d => ({
            ...d,
            itemStyle: {
              color: getColorForPoint(d),
              opacity: getOpacityForPoint(d, selectedBranchId, hoveredBranchId, focusMode),
              borderColor: d.branchId === selectedBranchId ? colorPrimary : d.branchId === hoveredBranchId ? highlightHover : 'transparent',
              borderWidth: d.branchId === selectedBranchId || d.branchId === hoveredBranchId ? 2 : 0
            },
            symbolSize: d.branchId === selectedBranchId ? 14 : d.branchId === hoveredBranchId ? 12 : (selectedBranchId !== null || hoveredBranchId !== null) && focusMode === 'emphasize' ? 6 : 7
          })),
          emphasis: {
            focus: 'self',
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(22, 119, 255, 0.4)'
            }
          },
          zlevel: 2
        }
      ],
      graphic: []
    }

    chart.setOption(option, true)

    // Convert data coordinates to pixel coordinates
    const toPx = (dataPoint: number[]): number[] => {
      try {
        return chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, dataPoint) as number[]
      } catch {
        return [0, 0]
      }
    }

    const Apix = toPx(A)
    const Bpix = toPx(B)
    const Cpix = toPx(C)

    // Grid lines at 25%, 50%, 75%
    const gridLines: any[] = []
    for (let pct = 0.25; pct < 1; pct += 0.25) {
      const a1 = toPx([A[0] + pct * (C[0] - A[0]), A[1] + pct * (C[1] - A[1])])
      const a2 = toPx([A[0] + pct * (B[0] - A[0]), A[1] + pct * (B[1] - A[1])])
      gridLines.push({
        type: 'line',
        shape: { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1] },
        style: { stroke: gridColor, lineWidth: 0.5, opacity: 0.6 },
        silent: true
      })
      const b1 = toPx([B[0] + pct * (C[0] - B[0]), B[1] + pct * (C[1] - B[1])])
      const b2 = toPx([B[0] + pct * (A[0] - B[0]), B[1] + pct * (A[1] - B[1])])
      gridLines.push({
        type: 'line',
        shape: { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1] },
        style: { stroke: gridColor, lineWidth: 0.5, opacity: 0.6 },
        silent: true
      })
      const c1 = toPx([C[0] + pct * (A[0] - C[0]), C[1] + pct * (A[1] - C[1])])
      const c2 = toPx([C[0] + pct * (B[0] - C[0]), C[1] + pct * (B[1] - C[1])])
      gridLines.push({
        type: 'line',
        shape: { x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1] },
        style: { stroke: gridColor, lineWidth: 0.5, opacity: 0.6 },
        silent: true
      })
    }

    // Vertex label positions
    const labelA = toPx([-0.03, -0.03])
    const labelB = toPx([1.03, -0.03])
    const labelC = toPx([0.5, h + 0.03])

    const graphicElements: any[] = [
      // Triangle outline
      {
        type: 'polygon',
        shape: {
          points: [Apix, Bpix, Cpix]
        },
        style: {
          fill: 'transparent',
          stroke: triangleColor,
          lineWidth: 2
        },
        silent: true
      },
      // Grid lines
      ...gridLines,
      // Vertex labels
      {
        type: 'text',
        left: labelA[0],
        top: labelA[1],
        style: {
          text: 'Ψ₁',
          fontSize: 14,
          fontWeight: 600,
          fill: labelColor1,
          textAlign: 'center',
          textVerticalAlign: 'middle'
        },
        silent: true
      },
      {
        type: 'text',
        left: labelB[0],
        top: labelB[1],
        style: {
          text: 'Ψ₂',
          fontSize: 14,
          fontWeight: 600,
          fill: labelColor2,
          textAlign: 'center',
          textVerticalAlign: 'middle'
        },
        silent: true
      },
      {
        type: 'text',
        left: labelC[0],
        top: labelC[1],
        style: {
          text: 'Ψ₃',
          fontSize: 14,
          fontWeight: 600,
          fill: labelColor3,
          textAlign: 'center',
          textVerticalAlign: 'middle'
        },
        silent: true
      }
    ]

    // Add convex hull polygon
    if (hullPoints && hullPoints.length >= 3) {
      const hullPix = hullPoints.map(p => toPx([p.x, p.y]))
      graphicElements.push({
        type: 'polygon',
        shape: { points: hullPix },
        style: {
          fill: colorPrimary,
          opacity: 0.08,
          stroke: colorPrimary,
          lineWidth: 1.5,
          lineDash: [4, 4],
        },
        silent: true,
        zlevel: 0,
      })
    }

    // Add density contour lines
    if (densityContours.length > 0) {
      const contourColor = colorPrimary
      for (const contour of densityContours) {
        for (const segment of contour.segments) {
          if (segment.length < 2) continue
          const pix1 = toPx(segment[0])
          const pix2 = toPx(segment[1])
          graphicElements.push({
            type: 'line',
            shape: { x1: pix1[0], y1: pix1[1], x2: pix2[0], y2: pix2[1] },
            style: {
              stroke: contourColor,
              lineWidth: 1,
              opacity: 0.4,
            },
            silent: true,
            zlevel: 0,
          })
        }
      }
    }

    chart.setOption({ graphic: graphicElements } as any)
  }, [scatterData, selectedBranchId, hoveredBranchId, activeCFType, t, focusMode, showConvexHull, showDensityContour, hullPoints, densityContours])

  // Handle clicks
  useEffect(() => {
    if (!chartInstance.current) return
    const chart = chartInstance.current
    chart.off('click')
    chart.on('click', (params: any) => {
      if (params.data && params.data.branchId !== undefined) {
        selectBranch(params.data.branchId)
      }
    })
    chart.off('mouseover')
    chart.on('mouseover', (params: any) => {
      if (params.data && params.data.branchId !== undefined) {
        hoverBranch(params.data.branchId)
      }
    })
    chart.off('mouseout')
    chart.on('mouseout', () => {
      hoverBranch(null)
    })
  }, [selectBranch, hoverBranch])

  // Resize handler — P1: Use ResizeObserver on container instead of window resize
  useEffect(() => {
    if (!chartRef.current) return
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize()
    })
    resizeObserver.observe(chartRef.current)
    return () => {
      resizeObserver.disconnect()
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  if (!project || project.vectors.length === 0) {
    return (
      <div className="ternary-plot-empty" role="region" aria-label={t.ariaTernaryPlot}>
        <div className="empty-icon" aria-hidden="true"><Icon name="triangle" size={36} /></div>
        <div className="empty-text">{t.emptyTernary}</div>
        {/* 空状态提供 next action */}
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

  return (
    <div className="ternary-plot-container" data-testid="ternary-plot" role="region" aria-label={t.ariaTernaryPlot}>
      {/* ─── P0: Ψ₄ notification badge ─── */}
      {psi4Count > 0 && (
        <div className="ternary-psi4-notice" role="status" aria-live="polite">
          ⚠ {t.psi4Warning.replace('{count}', String(psi4Count))}
        </div>
      )}
      {/* Overlay controls for convex hull and density contour */}
      <div className="ternary-overlay-controls">
        <button
          className={`ternary-toggle-btn ${showConvexHull ? 'active' : ''}`}
          onClick={() => setShowConvexHull(!showConvexHull)}
          title={t.showConvexHull}
          aria-pressed={showConvexHull}
          aria-label={t.showConvexHull}
        >
          {t.showConvexHull}
        </button>
        <button
          className={`ternary-toggle-btn ${showDensityContour ? 'active' : ''}`}
          onClick={() => setShowDensityContour(!showDensityContour)}
          title={t.showDensityContour}
          aria-pressed={showDensityContour}
          aria-label={t.showDensityContour}
        >
          {t.showDensityContour}
        </button>
        {/* 聚焦模式三档 */}
        <label className="ternary-focus-label">
          {t.ternaryFocusMode}
          <select
            className="ternary-focus-select"
            value={focusMode}
            onChange={(e) => setFocusMode(e.target.value as TernaryFocusMode)}
            aria-label={t.ternaryFocusMode}
          >
            <option value="emphasize">{t.focusEmphasize}</option>
            <option value="dim-less">{t.focusDimLess}</option>
            <option value="hide-others">{t.focusHideOthers}</option>
          </select>
        </label>
      </div>
      {/* Ψ₁ 占比色标图例 */}
      <div className="plot-legend" aria-hidden="true">
        <span className="plot-legend__title">{t.legendConcordance}</span>
        <span>{t.legendLow}</span>
        <span className="plot-legend__bar" style={{ background: SCHEME_GRADIENTS.heat }} />
        <span>{t.legendHigh}</span>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function getColorForPoint(data: any): string {
  const total = data.psi1 + data.psi2 + data.psi3
  if (total === 0) return '#5a5a5a'
  const concordance = data.psi1 / total
  // Unified color scheme matching tree heat scheme (deeper green for light-bg contrast)
  const r = Math.round(200 + 55 * (1 - concordance))
  const g = Math.round(80 + 140 * concordance)
  const b = Math.round(30 + 20 * (1 - concordance))
  return `rgb(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${b})`
}

/**
 * 聚焦模式 — 非选中点保留可辨度（emphasize 下限 0.4，不再隐身至 0.15）
 */
function getOpacityForPoint(
  data: any,
  selectedId: number | null,
  hoveredId: number | null,
  mode: TernaryFocusMode
): number {
  const isTarget = data.branchId === selectedId || data.branchId === hoveredId
  if (isTarget) return 1
  if (selectedId === null && hoveredId === null) return 0.85
  switch (mode) {
    case 'emphasize': return 0.4
    case 'dim-less': return 0.85
    case 'hide-others': return 0.03
    default: return 0.4
  }
}

export default TernaryPlot
