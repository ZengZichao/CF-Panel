// src/renderer/lib/canvas-tree-renderer.ts
// Canvas 2D tree renderer — for high-performance rendering with >1000 branches
// Replaces SVG DOM nodes with a single Canvas element for better performance

import type { TreeNode, TreeLayoutType, ColorSchemeType } from '../types/cf'
import { getPsiValues, getColorByScheme } from './parse'

export interface CanvasRenderOptions {
  ctx: CanvasRenderingContext2D
  rootNode: TreeNode
  width: number
  height: number
  zoom: number
  panX: number
  panY: number
  layoutType: TreeLayoutType
  branchWidth: number
  colorScheme: ColorSchemeType
  activeCFType: 'gene' | 'site' | 'quartet'
  selectedBranchId: number | null
  hoveredBranchId: number | null
  showLabels: boolean
  showBranchIds: boolean
  labelFontSize: number
  labelFontColor: string
  cssVars: Record<string, string>
}

/**
 * Count total edges in tree
 */
function countEdges(node: TreeNode): number {
  let count = node.children.length
  for (const child of node.children) {
    count += countEdges(child)
  }
  return count
}

/**
 * Determine whether to use Canvas 2D rendering based on tree size
 */
export function shouldUseCanvas(rootNode: TreeNode, threshold = 1000): boolean {
  return countEdges(rootNode) > threshold
}

/**
 * Collect all edges as flat array
 */
function collectEdges(node: TreeNode, parent: TreeNode | null): Array<{ node: TreeNode; parent: TreeNode | null }> {
  const edges: Array<{ node: TreeNode; parent: TreeNode | null }> = [{ node, parent }]
  for (const child of node.children) {
    edges.push(...collectEdges(child, node))
  }
  return edges
}

/**
 * Trace an edge path onto ctx.
 * Circular 布局渲染为「母半径上的圆弧 + 子角度上的径向直线」，
 * 与 FigTree/ggtree 的 fan 布局约定一致；rectangular 保持 L 形；
 * unrooted 保持直线。
 * cx/cy 来自根节点（layoutCircular 写入 rootNode.cx/cy）。
 */
function traceEdge(
  ctx: CanvasRenderingContext2D,
  parent: TreeNode,
  node: TreeNode,
  layoutType: TreeLayoutType,
  cx: number | null,
  cy: number | null
): void {
  if (layoutType === 'rectangular') {
    ctx.moveTo(parent.x, parent.y)
    ctx.lineTo(parent.x, node.y)
    ctx.lineTo(node.x, node.y)
    return
  }

  if (layoutType === 'circular' && cx != null && cy != null) {
    const r = Math.hypot(parent.x - cx, parent.y - cy)
    if (r > 1e-6) {
      // 母半径圆弧：从 parent 角度扫到 child 角度（取劣角方向）
      const a0 = Math.atan2(parent.y - cy, parent.x - cx)
      const a1 = Math.atan2(node.y - cy, node.x - cx)
      let d = a1 - a0
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      ctx.moveTo(parent.x, parent.y)
      ctx.arc(cx, cy, r, a0, a0 + d, d < 0)
      // 子角度径向直线：弧终点 → child
      const endX = cx + r * Math.cos(a0 + d)
      const endY = cy + r * Math.sin(a0 + d)
      ctx.lineTo(endX, endY)
      ctx.lineTo(node.x, node.y)
      return
    }
    // 根的分支：半径≈0，退化为径向直线
    ctx.moveTo(parent.x, parent.y)
    ctx.lineTo(node.x, node.y)
    return
  }

  // unrooted / fallback: straight line
  ctx.moveTo(parent.x, parent.y)
  ctx.lineTo(node.x, node.y)
}

/**
 * Render the entire tree on a Canvas 2D context
 */
export function renderTreeCanvas(opts: CanvasRenderOptions): void {
  const {
    ctx, rootNode, width, height, zoom, panX, panY,
    layoutType, branchWidth, colorScheme, activeCFType,
    selectedBranchId, hoveredBranchId,
    showLabels, showBranchIds, labelFontSize, labelFontColor,
    cssVars,
  } = opts

  const centerX = layoutType === 'circular' ? rootNode.cx ?? null : null
  const centerY = layoutType === 'circular' ? rootNode.cy ?? null : null

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  const edges = collectEdges(rootNode, null)

  // First pass: draw all branches
  for (const { node, parent } of edges) {
    if (!parent) {
      // Root node dot
      if (node.children.length > 0) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = cssVars.treeRootFill || '#595959'
        ctx.fill()
      }
      continue
    }

    // Determine branch color and width
    let strokeColor = cssVars.treeBranchDefault || '#595959'
    let strokeWidth = branchWidth

    const vector = node.vector
    if (vector) {
      const psi = getPsiValues(vector, activeCFType)
      strokeColor = getColorByScheme(psi.psi1, psi.psi2, psi.psi3, psi.psi4, colorScheme)
      strokeWidth = branchWidth * 1.3
    }

    const isSelected = selectedBranchId !== null && node.branchId === selectedBranchId
    const isHovered = hoveredBranchId !== null && node.branchId === hoveredBranchId

    if (isSelected) {
      strokeWidth = Math.max(branchWidth * 3, 3)
      strokeColor = cssVars.colorPrimary || '#1677ff'
    } else if (isHovered) {
      strokeWidth = Math.max(branchWidth * 2.5, 2.5)
      strokeColor = cssVars.highlightHover || '#faad14'
    }

    // Draw path
    ctx.beginPath()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    traceEdge(ctx, parent, node, layoutType, centerX, centerY)
    ctx.stroke()
  }

  // Second pass: draw labels and branch IDs (only if zoom is sufficient)
  if (zoom > 0.3) {
    ctx.textBaseline = 'alphabetic'

    for (const { node, parent } of edges) {
      const isSelected = selectedBranchId !== null && node.branchId === selectedBranchId
      const isHovered = hoveredBranchId !== null && node.branchId === hoveredBranchId

      // Branch ID labels
      if (showBranchIds && node.branchId !== null && !node.isLeaf && zoom > 0.5 && parent) {
        ctx.font = `${Math.max(labelFontSize - 1, 8)}px 'JetBrains Mono', 'SF Mono', 'SFMono-Regular', Consolas, monospace`
        const fillColor = isSelected
          ? (cssVars.colorPrimary || '#1677ff')
          : isHovered
            ? (cssVars.highlightHover || '#faad14')
            : (cssVars.textMuted || 'rgba(0,0,0,0.45)')
        ctx.fillStyle = fillColor
        ctx.textAlign = layoutType === 'rectangular' ? 'center' : 'left'
        const x = layoutType === 'rectangular' ? (parent.x + node.x) / 2 : node.x + 8
        const y = layoutType === 'rectangular' ? node.y - 4 : node.y
        ctx.fillText(String(node.branchId), x, y)
      }

      // Leaf labels
      if (showLabels && node.isLeaf && node.name && zoom > 0.3) {
        ctx.font = `${labelFontSize}px 'Inter', 'SF Pro Display', system-ui, sans-serif`
        ctx.fillStyle = labelFontColor || cssVars.textSecondary || 'rgba(0,0,0,0.65)'
        ctx.textAlign = 'left'
        const x = layoutType === 'rectangular' ? node.x + 4 : node.x + 6
        const y = layoutType === 'rectangular' ? node.y + 3 : node.y + 3
        ctx.fillText(node.name.replace(/_/g, ' '), x, y)
      }
    }
  }

  ctx.restore()
}

/**
 * Hit test: find which branch was clicked
 * For rectangular layout, use L-shaped polyline distance
 * matching the visible branch geometry (parent.x→parent.x/node.y→node.x/node.y)
 * For circular layout, distance to arc + radial segment (matching
 * the visible fan geometry), not the straight chord.
 */
export function hitTest(
  rootNode: TreeNode,
  clickX: number,
  clickY: number,
  zoom: number,
  panX: number,
  panY: number,
  layoutType: TreeLayoutType,
  hitRadius = 8
): number | null {
  const transformedX = (clickX - panX) / zoom
  const transformedY = (clickY - panY) / zoom

  const centerX = layoutType === 'circular' ? rootNode.cx ?? null : null
  const centerY = layoutType === 'circular' ? rootNode.cy ?? null : null

  let closest: { id: number | null; dist: number } = { id: null, dist: Infinity }

  function traverse(node: TreeNode, parent: TreeNode | null) {
    if (parent) {
      let dist: number
      if (layoutType === 'rectangular') {
        // L-shaped path: parent(x,y) → parent.x,node.y → node.x,node.y
        // Distance to two segments: vertical then horizontal
        const distV = distanceToSegment(transformedX, transformedY, parent.x, parent.y, parent.x, node.y)
        const distH = distanceToSegment(transformedX, transformedY, parent.x, node.y, node.x, node.y)
        dist = Math.min(distV, distH)
      } else if (layoutType === 'circular' && centerX != null && centerY != null) {
        // 弧 + 径向段几何：取三者最小距离（弦距离作为兜底）
        const rParent = Math.hypot(parent.x - centerX, parent.y - centerY)
        const a0 = Math.atan2(parent.y - centerY, parent.x - centerX)
        const a1 = Math.atan2(node.y - centerY, node.x - centerX)
        let d = a1 - a0
        while (d > Math.PI) d -= 2 * Math.PI
        while (d < -Math.PI) d += 2 * Math.PI

        // 1) 弧段距离：点击点极角落在 [a0, a0+d] 内时 = |点击点半径 - 母半径|
        const pr = Math.hypot(transformedX - centerX, transformedY - centerY)
        const pa = Math.atan2(transformedY - centerY, transformedX - centerX)
        let da = pa - a0
        while (da > Math.PI) da -= 2 * Math.PI
        while (da < -Math.PI) da += 2 * Math.PI
        const onArc = (d >= 0 ? da >= 0 && da <= d : da <= 0 && da >= d) && rParent > 1e-6
        const distArc = onArc ? Math.abs(pr - rParent) : Infinity

        // 2) 径向段距离：母半径→child，沿 child 角度
        const endX = centerX + rParent * Math.cos(a1)
        const endY = centerY + rParent * Math.sin(a1)
        const distRadial = distanceToSegment(transformedX, transformedY, endX, endY, node.x, node.y)

        // 3) 弦距离兜底
        const distChord = distanceToSegment(transformedX, transformedY, parent.x, parent.y, node.x, node.y)

        dist = Math.min(distArc, distRadial, distChord)
      } else {
        // Straight line for unrooted
        dist = distanceToSegment(
          transformedX, transformedY,
          parent.x, parent.y,
          node.x, node.y
        )
      }
      if (dist < hitRadius && dist < closest.dist) {
        closest = { id: node.branchId, dist }
      }
    }
    for (const child of node.children) {
      traverse(child, node)
    }
  }

  traverse(rootNode, null)
  return closest.id
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}
