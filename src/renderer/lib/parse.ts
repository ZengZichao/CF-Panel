// src/renderer/lib/parse.ts
// 纯 TS 解析层：cf.stat / Newick / vector builder
// 与 Lanfear 的 concordance_vector.R 脚本语义对齐

import type { CFVector, CFProject, TreeNode, TreeLayoutType, ColorSchemeType } from '../types/cf'

// ──────────────────────────────────────────────
// 1. cf.stat 文件解析
// ──────────────────────────────────────────────

interface StatRow {
  id: number
  // 对于 gcf.cf.stat
  gCF?: number; gCF_N?: number
  gDF1?: number; gDF1_N?: number
  gDF2?: number; gDF2_N?: number
  gDFP?: number; gDFP_N?: number
  gN?: number
  // 对于 scfl.cf.stat / coalescent_bl.cf.stat
  sCF?: number; sCF_N?: number
  sDF1?: number; sDF1_N?: number
  sDF2?: number; sDF2_N?: number
  sN?: number
  // 公共
  label: string
  length: number
}

/**
 * 解析 cf.stat 文件（tab 分隔，含 # 注释行）
 */
export function parseCfStat(content: string): StatRow[] {
  const lines = content.split(/\r?\n/)
  const rows: StatRow[] = []

  let headerCols: string[] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue

    if (!headerCols) {
      headerCols = trimmed.split('\t')
      continue
    }

    const fields = trimmed.split('\t')
    const row: Record<string, string> = {}
    for (let i = 0; i < headerCols.length; i++) {
      row[headerCols[i]] = fields[i] ?? ''
    }

    const id = parseInt(row['ID'], 10)
    if (isNaN(id)) continue

    const statRow: StatRow = {
      id,
      label: row['Label'] ?? '',
      length: parseFloat(row['Length']) || 0
    }

    if ('gCF' in row) {
      statRow.gCF = parseFloat(row['gCF']) || 0
      statRow.gCF_N = parseFloat(row['gCF_N']) || 0
      statRow.gDF1 = parseFloat(row['gDF1']) || 0
      statRow.gDF1_N = parseFloat(row['gDF1_N']) || 0
      statRow.gDF2 = parseFloat(row['gDF2']) || 0
      statRow.gDF2_N = parseFloat(row['gDF2_N']) || 0
      statRow.gDFP = parseFloat(row['gDFP']) || 0
      statRow.gDFP_N = parseFloat(row['gDFP_N']) || 0
      statRow.gN = parseFloat(row['gN']) || 0
    }

    if ('sCF' in row) {
      statRow.sCF = parseFloat(row['sCF']) || 0
      statRow.sCF_N = parseFloat(row['sCF_N']) || 0
      statRow.sDF1 = parseFloat(row['sDF1']) || 0
      statRow.sDF1_N = parseFloat(row['sDF1_N']) || 0
      statRow.sDF2 = parseFloat(row['sDF2']) || 0
      statRow.sDF2_N = parseFloat(row['sDF2_N']) || 0
      statRow.sN = parseFloat(row['sN']) || 0
    }

    rows.push(statRow)
  }

  return rows
}

// ──────────────────────────────────────────────
// 2. Label 列 quartet 注解提取
// ──────────────────────────────────────────────

interface QuartetAnnotation {
  q1: number; q2: number; q3: number
  f1: number; f2: number; f3: number
  pp1: number; pp2: number; pp3: number
  QC: number; EN: number
}

function extractQuartetAnnotation(label: string): QuartetAnnotation | null {
  const bracketMatch = label.match(/\[([^\]]+)\]/)
  if (!bracketMatch) return null

  const content = bracketMatch[1]
  const fields = content.split(';')
  const map: Record<string, string> = {}

  for (const field of fields) {
    const [key, ...valueParts] = field.split('=')
    const value = valueParts.join('=').trim()
    if (key) {
      map[key.trim()] = value
    }
  }

  const q1 = parseFloat(map['q1']) || 0
  const q2 = parseFloat(map['q2']) || 0
  const q3 = parseFloat(map['q3']) || 0
  const f1 = parseFloat(map['f1']) || 0
  const f2 = parseFloat(map['f2']) || 0
  const f3 = parseFloat(map['f3']) || 0
  const pp1 = parseFloat(map['pp1']) || 0
  const pp2 = parseFloat(map['pp2']) || 0
  const pp3 = parseFloat(map['pp3']) || 0
  const QC = parseFloat(map['QC']) || 0
  const EN = parseFloat(map['EN']) || 0

  return { q1, q2, q3, f1, f2, f3, pp1, pp2, pp3, QC, EN }
}

// ──────────────────────────────────────────────
// 3. Vector builder — 与 concordance_vector.R 对齐
// ──────────────────────────────────────────────

export function buildVectors(
  gcfRows: StatRow[],
  scflRows: StatRow[],
  cblRows: StatRow[]
): CFVector[] {
  const gcfMap = new Map<number, StatRow>()
  for (const r of gcfRows) gcfMap.set(r.id, r)

  const cblMap = new Map<number, StatRow>()
  for (const r of cblRows) cblMap.set(r.id, r)

  const vectors: CFVector[] = []

  for (const scf of scflRows) {
    const gcf = gcfMap.get(scf.id)
    const cbl = cblMap.get(scf.id)

    // ── Site concordance (from scfl.cf.stat) ──
    const sDF1 = scf.sDF1 ?? 0
    const sDF2 = scf.sDF2 ?? 0
    const sDF1_N = scf.sDF1_N ?? 0
    const sDF2_N = scf.sDF2_N ?? 0

    const sitePsi1 = scf.sCF ?? 0
    const sitePsi2 = Math.max(sDF1, sDF2)
    const sitePsi3 = Math.min(sDF1, sDF2)
    const sitePsi4 = 0
    const sitePsi1N = scf.sCF_N ?? 0
    const sitePsi2N = Math.max(sDF1_N, sDF2_N)
    const sitePsi3N = Math.min(sDF1_N, sDF2_N)
    const sitePsi4N = 0
    const siteN = scf.sN ?? 0

    // ── Quartet concordance (from Label annotation) ──
    const qa = extractQuartetAnnotation(scf.label)

    let quartetPsi1 = 0, quartetPsi2 = 0, quartetPsi3 = 0, quartetPsi4 = 0
    let quartetPsi1N = 0, quartetPsi2N = 0, quartetPsi3N = 0, quartetPsi4N = 0
    let quartetN = 0
    let quartetPsi1Pp = 0, quartetPsi2Pp = 0, quartetPsi3Pp = 0

    if (qa) {
      // q1/q2/q3 are in 0–1 range; convert to percentage (0–100) to align with gene/site
      quartetPsi1 = roundTo(qa.q1 * 100, 2)
      quartetPsi2 = roundTo(Math.max(qa.q2, qa.q3) * 100, 2)
      quartetPsi3 = roundTo(Math.min(qa.q2, qa.q3) * 100, 2)
      quartetPsi4 = 0
      quartetPsi1N = roundTo(qa.f1, 2)
      quartetPsi2N = roundTo(Math.max(qa.f2, qa.f3), 2)
      quartetPsi3N = roundTo(Math.min(qa.f2, qa.f3), 2)
      quartetPsi4N = 0
      quartetN = roundTo(qa.EN, 1)
      quartetPsi1Pp = roundTo(qa.pp1, 1)
      quartetPsi2Pp = roundTo(Math.max(qa.pp2, qa.pp3), 1)
      quartetPsi3Pp = roundTo(Math.min(qa.pp2, qa.pp3), 1)
    }

    // ── Gene concordance (from gcf.cf.stat) ──
    let genePsi1 = 0, genePsi2 = 0, genePsi3 = 0, genePsi4 = 0
    let genePsi1N = 0, genePsi2N = 0, genePsi3N = 0, genePsi4N = 0
    let geneN = 0

    if (gcf) {
      const gDF1 = gcf.gDF1 ?? 0
      const gDF2 = gcf.gDF2 ?? 0
      const gDF1_N = gcf.gDF1_N ?? 0
      const gDF2_N = gcf.gDF2_N ?? 0

      genePsi1 = gcf.gCF ?? 0
      genePsi2 = Math.max(gDF1, gDF2)
      genePsi3 = Math.min(gDF1, gDF2)
      genePsi4 = gcf.gDFP ?? 0
      genePsi1N = gcf.gCF_N ?? 0
      genePsi2N = Math.max(gDF1_N, gDF2_N)
      genePsi3N = Math.min(gDF1_N, gDF2_N)
      genePsi4N = gcf.gDFP_N ?? 0
      geneN = gcf.gN ?? 0
    }

    const lengthSubsPerSite = scf.length
    const lengthCoalescent = cbl ? cbl.length : 0

    vectors.push({
      id: scf.id,
      genePsi1, genePsi2, genePsi3, genePsi4,
      genePsi1N, genePsi2N, genePsi3N, genePsi4N,
      geneN,
      sitePsi1, sitePsi2, sitePsi3, sitePsi4,
      sitePsi1N, sitePsi2N, sitePsi3N, sitePsi4N,
      siteN,
      quartetPsi1, quartetPsi2, quartetPsi3, quartetPsi4,
      quartetPsi1N, quartetPsi2N, quartetPsi3N, quartetPsi4N,
      quartetN,
      quartetPsi1Pp, quartetPsi2Pp, quartetPsi3Pp,
      lengthSubsPerSite,
      lengthCoalescent,
      label: scf.label,
      hasGcfStat: gcfRows.length > 0,
      hasScflStat: scflRows.length > 0,
      hasCblStat: cblRows.length > 0,
    })
  }

  return vectors
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// ──────────────────────────────────────────────
// 4. Newick parser
// ──────────────────────────────────────────────

interface ParsedNewick {
  newick: string
  rootNode: TreeNode
  branchIdMap: Map<number, TreeNode>
}

export function parseNewick(newickStr: string): ParsedNewick {
  const cleaned = newickStr.trim().replace(/;\s*$/, '')
  let pos = 0

  function parseNode(parent: TreeNode | null): TreeNode {
    const node: TreeNode = {
      name: '',
      branchId: null,
      branchLength: 0,
      label: '',
      children: [],
      parent,
      isLeaf: false,
      x: 0, y: 0, angle: 0, radius: 0
    }

    if (cleaned[pos] === '(') {
      pos++
      while (true) {
        const child = parseNode(node)
        node.children.push(child)
        if (cleaned[pos] === ',') {
          pos++
          continue
        }
        if (cleaned[pos] === ')') {
          pos++
          break
        }
        break
      }
    } else {
      node.isLeaf = true
    }

    let name = ''
    let inQuote = false
    while (pos < cleaned.length) {
      const ch = cleaned[pos]
      if (!inQuote) {
        if (ch === ':' || ch === ',' || ch === ')' || ch === ';') break
      }
      if (ch === "'") {
        inQuote = !inQuote
        name += ch
        pos++
        continue
      }
      if (!inQuote && ch === '[') {
        pos++
        let bracketContent = ''
        while (pos < cleaned.length && cleaned[pos] !== ']') {
          bracketContent += cleaned[pos]
          pos++
        }
        if (pos < cleaned.length) pos++
        node.label = `[${bracketContent}]`
        continue
      }
      name += ch
      pos++
    }
    node.name = name

    const branchIdMatch = name.match(/^(\d+)$/)
    if (branchIdMatch) {
      node.branchId = parseInt(branchIdMatch[1], 10)
    } else if (!node.isLeaf) {
      // P1: Only try fallback ID extraction for internal nodes, not leaf names
      // Match ID at end of name if it's an internal node (e.g. "Node123" -> 123)
      const idMatch = name.match(/(\d+)\s*$/)
      if (idMatch) {
        node.branchId = parseInt(idMatch[1], 10)
      }
    }

    if (cleaned[pos] === ':') {
      pos++
      let blStr = ''
      while (pos < cleaned.length) {
        const ch = cleaned[pos]
        if (ch === ',' || ch === ')' || ch === ';') break
        blStr += ch
        pos++
      }
      const blNum = parseFloat(blStr)
      if (!isNaN(blNum)) {
        node.branchLength = blNum
      }
    }

    return node
  }

  const root = parseNode(null)

  const branchIdMap = new Map<number, TreeNode>()
  function collectBranchIds(node: TreeNode) {
    if (node.branchId !== null) {
      branchIdMap.set(node.branchId, node)
    }
    for (const child of node.children) {
      collectBranchIds(child)
    }
  }
  collectBranchIds(root)

  return { newick: newickStr, rootNode: root, branchIdMap }
}

// ──────────────────────────────────────────────
// 5. 树布局算法 — 支持矩形 / 无根 / 环形三种布局
// ──────────────────────────────────────────────

/**
 * 矩形树布局 (Rectangular / Cladogram)
 */
function layoutRectangular(
  root: TreeNode,
  width: number,
  height: number,
  useBranchLength: boolean
): void {
  // Count leaves
  function countLeaves(node: TreeNode): number {
    if (node.children.length === 0) return 1
    let total = 0
    for (const child of node.children) total += countLeaves(child)
    return total
  }
  const leafCount = countLeaves(root)
  if (leafCount === 0) return

  if (useBranchLength) {
    // 使用枝长进行 X 轴定位
    function maxDepth(node: TreeNode): number {
      if (node.children.length === 0) return node.branchLength
      let maxD = 0
      for (const child of node.children) {
        const d = maxDepth(child) + child.branchLength
        if (d > maxD) maxD = d
      }
      return maxD
    }
    const maxDep = maxDepth(root) || 1
    const xScale = (width - 250) / maxDep
    const yStep = (height - 40) / Math.max(leafCount - 1, 1)
    let currentY = 20

    function assignRectCoords(node: TreeNode, parentX: number): void {
      if (node.children.length === 0) {
        node.x = parentX + node.branchLength * xScale
        node.y = currentY
        currentY += yStep
      } else {
        const childX = parentX + node.branchLength * xScale
        for (const child of node.children) {
          assignRectCoords(child, childX)
        }
        const firstChild = node.children[0]
        const lastChild = node.children[node.children.length - 1]
        node.x = childX
        node.y = (firstChild.y + lastChild.y) / 2
      }
    }
    assignRectCoords(root, 0)
  } else {
    // 不使用枝长 — 使用 cladogram 等距模式
    // 计算最大深度（以边数计）
    function maxDepthEdges(node: TreeNode): number {
      if (node.children.length === 0) return 0
      let maxD = 0
      for (const child of node.children) {
        const d = maxDepthEdges(child) + 1
        if (d > maxD) maxD = d
      }
      return maxD
    }
    const maxDep = maxDepthEdges(root) || 1
    const xScale = (width - 250) / maxDep
    const yStep = (height - 40) / Math.max(leafCount - 1, 1)
    let currentY = 20

    function assignRectCoords(node: TreeNode, depth: number): void {
      if (node.children.length === 0) {
        node.x = depth * xScale
        node.y = currentY
        currentY += yStep
      } else {
        for (const child of node.children) {
          assignRectCoords(child, depth + 1)
        }
        const firstChild = node.children[0]
        const lastChild = node.children[node.children.length - 1]
        node.x = depth * xScale
        node.y = (firstChild.y + lastChild.y) / 2
      }
    }
    assignRectCoords(root, 0)
  }
}

/**
 * 无根树布局 (Unrooted / Equal-angle)
 */
function layoutUnrooted(
  root: TreeNode,
  width: number,
  height: number,
  useBranchLength: boolean
): void {
  const cx = width / 2
  const cy = height / 2

  // Count total leaves
  function countLeaves(node: TreeNode): number {
    if (node.children.length === 0) return 1
    let total = 0
    for (const child of node.children) total += countLeaves(child)
    return total
  }
  const totalLeaves = countLeaves(root)
  if (totalLeaves === 0) return

  // 计算最大枝长用于缩放
  function maxBranchLength(node: TreeNode): number {
    let maxBL = node.branchLength
    for (const child of node.children) {
      const bl = maxBranchLength(child)
      if (bl > maxBL) maxBL = bl
    }
    return maxBL
  }

  // 最大深度（枝长或边数）
  function maxDepth(node: TreeNode, useBL: boolean): number {
    if (node.children.length === 0) return useBL ? node.branchLength : 1
    let maxD = 0
    for (const child of node.children) {
      const bl = useBL ? child.branchLength : 1
      const d = maxDepth(child, useBL) + bl
      if (d > maxD) maxD = d
    }
    return maxD
  }

  const maxDep = maxDepth(root, useBranchLength) || 1
  const radius = Math.min(width, height) / 2 - 60
  const scale = radius / maxDep

  // 给根节点的每个子树分配角度范围
  let currentAngle = 0

  function assignUnrootedCoords(node: TreeNode, startAngle: number, endAngle: number, parentX: number, parentY: number): void {
    const midAngle = (startAngle + endAngle) / 2
    const bl = useBranchLength ? node.branchLength : 1
    node.x = parentX + Math.cos(midAngle) * bl * scale
    node.y = parentY + Math.sin(midAngle) * bl * scale
    node.angle = midAngle

    if (node.children.length === 0) return

    // 给每个子树分配角度
    const totalLeaves = countLeaves(node)
    let angleStart = startAngle
    for (const child of node.children) {
      const childLeaves = countLeaves(child)
      const childAngleSpan = (endAngle - startAngle) * (childLeaves / totalLeaves)
      const childAngleEnd = angleStart + childAngleSpan
      assignUnrootedCoords(child, angleStart, childAngleEnd, node.x, node.y)
      angleStart = childAngleEnd
    }
  }

  // 根节点在中心
  root.x = cx
  root.y = cy
  root.angle = 0

  // 给每个子树分配角度范围
  let angleStart = -Math.PI / 2 // 从顶部开始
  for (const child of root.children) {
    const childLeaves = countLeaves(child)
    const childAngleSpan = (2 * Math.PI) * (childLeaves / totalLeaves)
    const childAngleEnd = angleStart + childAngleSpan
    assignUnrootedCoords(child, angleStart, childAngleEnd, root.x, root.y)
    angleStart = childAngleEnd
  }
}

/**
 * 环形树布局 (Circular / Radial)
 */
function layoutCircular(
  root: TreeNode,
  width: number,
  height: number,
  useBranchLength: boolean
): void {
  const cx = width / 2
  const cy = height / 2

  function countLeaves(node: TreeNode): number {
    if (node.children.length === 0) return 1
    let total = 0
    for (const child of node.children) total += countLeaves(child)
    return total
  }
  const totalLeaves = countLeaves(root)
  if (totalLeaves === 0) return

  // 记录圆心到根节点，供 SVG/Canvas 弧线渲染与弧线命中测试使用
  root.cx = cx
  root.cy = cy

  if (useBranchLength) {
    function maxDepth(node: TreeNode): number {
      if (node.children.length === 0) return node.branchLength
      let maxD = 0
      for (const child of node.children) {
        const d = maxDepth(child) + child.branchLength
        if (d > maxD) maxD = d
      }
      return maxD
    }
    const maxDep = maxDepth(root) || 1
    const maxRadius = Math.min(width, height) / 2 - 80
    const radiusScale = maxRadius / maxDep
    const angleStep = (2 * Math.PI) / Math.max(totalLeaves, 1)
    let currentAngle = -Math.PI / 2

    function assignCircularCoords(node: TreeNode, parentRadius: number, parentAngle: number): void {
      if (node.children.length === 0) {
        node.radius = parentRadius + node.branchLength * radiusScale
        node.angle = currentAngle
        node.x = cx + node.radius * Math.cos(node.angle)
        node.y = cy + node.radius * Math.sin(node.angle)
        currentAngle += angleStep
      } else {
        const childRadius = parentRadius + node.branchLength * radiusScale
        for (const child of node.children) {
          assignCircularCoords(child, childRadius, 0)
        }
        const firstChild = node.children[0]
        const lastChild = node.children[node.children.length - 1]
        node.radius = childRadius
        node.angle = (firstChild.angle + lastChild.angle) / 2
        node.x = cx + node.radius * Math.cos(node.angle)
        node.y = cy + node.radius * Math.sin(node.angle)
      }
    }
    assignCircularCoords(root, 0, 0)
  } else {
    function maxDepthEdges(node: TreeNode): number {
      if (node.children.length === 0) return 0
      let maxD = 0
      for (const child of node.children) {
        const d = maxDepthEdges(child) + 1
        if (d > maxD) maxD = d
      }
      return maxD
    }
    const maxDep = maxDepthEdges(root) || 1
    const maxRadius = Math.min(width, height) / 2 - 80
    const radiusScale = maxRadius / maxDep
    const angleStep = (2 * Math.PI) / Math.max(totalLeaves, 1)
    let currentAngle = -Math.PI / 2

    function assignCircularCoords(node: TreeNode, depth: number): void {
      if (node.children.length === 0) {
        node.radius = depth * radiusScale
        node.angle = currentAngle
        node.x = cx + node.radius * Math.cos(node.angle)
        node.y = cy + node.radius * Math.sin(node.angle)
        currentAngle += angleStep
      } else {
        for (const child of node.children) {
          assignCircularCoords(child, depth + 1)
        }
        const firstChild = node.children[0]
        const lastChild = node.children[node.children.length - 1]
        node.radius = depth * radiusScale
        node.angle = (firstChild.angle + lastChild.angle) / 2
        node.x = cx + node.radius * Math.cos(node.angle)
        node.y = cy + node.radius * Math.sin(node.angle)
      }
    }
    assignCircularCoords(root, 0)
  }
}

/**
 * 统一布局入口 — 根据布局类型调用对应算法
 */
export function layoutTree(
  root: TreeNode,
  width: number,
  height: number,
  branchIdMap: Map<number, TreeNode>,
  vectors: CFVector[],
  layoutType: TreeLayoutType = 'rectangular',
  useBranchLength: boolean = true
): void {
  // Associate vectors with nodes
  for (const v of vectors) {
    const node = branchIdMap.get(v.id)
    if (node) {
      node.vector = v
    }
  }

  switch (layoutType) {
    case 'unrooted':
      layoutUnrooted(root, width, height, useBranchLength)
      break
    case 'circular':
      layoutCircular(root, width, height, useBranchLength)
      break
    case 'rectangular':
    default:
      layoutRectangular(root, width, height, useBranchLength)
      break
  }
}

// ──────────────────────────────────────────────
// 6. 完整项目解析入口
// ──────────────────────────────────────────────

export interface ParsedFiles {
  gcfStat?: string
  scflStat?: string
  cblStat?: string
  gcfTree?: string
  gcfBranch?: string
}

export function parseProject(files: ParsedFiles): CFProject {
  const gcfRows = files.gcfStat ? parseCfStat(files.gcfStat) : []
  const scflRows = files.scflStat ? parseCfStat(files.scflStat) : []
  const cblRows = files.cblStat ? parseCfStat(files.cblStat) : []

  const vectors = buildVectors(gcfRows, scflRows, cblRows)

  return {
    treeNewick: files.gcfTree ?? '',
    branchIdTree: files.gcfBranch ?? '',
    vectors,
    hasGcfStat: files.gcfStat !== undefined && files.gcfStat.length > 0,
    hasScflStat: files.scflStat !== undefined && files.scflStat.length > 0,
    hasCblStat: files.cblStat !== undefined && files.cblStat.length > 0,
  }
}

/**
 * 获取 CF 向量在三元图上的坐标
 */
export function getTernaryCoords(psi1: number, psi2: number, psi3: number): { x: number; y: number } {
  const total = psi1 + psi2 + psi3
  if (total === 0) return { x: 0.3333, y: 0.3333 }
  const a = psi1 / total
  const b = psi2 / total
  const c = psi3 / total
  const x = b + c * 0.5
  const y = c * (Math.sqrt(3) / 2)
  return { x, y }
}

/**
 * 获取 CF 向量在指定类型下的 psi 值
 */
export function getPsiValues(vector: CFVector, cfType: 'gene' | 'site' | 'quartet'): {
  psi1: number; psi2: number; psi3: number; psi4: number
} {
  switch (cfType) {
    case 'gene':
      return { psi1: vector.genePsi1, psi2: vector.genePsi2, psi3: vector.genePsi3, psi4: vector.genePsi4 }
    case 'site':
      return { psi1: vector.sitePsi1, psi2: vector.sitePsi2, psi3: vector.sitePsi3, psi4: vector.sitePsi4 }
    case 'quartet':
      return { psi1: vector.quartetPsi1, psi2: vector.quartetPsi2, psi3: vector.quartetPsi3, psi4: vector.quartetPsi4 }
  }
}

/**
 * 获取 CF 向量在指定类型下的 N 值
 */
export function getNValues(vector: CFVector, cfType: 'gene' | 'site' | 'quartet'): {
  psi1N: number; psi2N: number; psi3N: number; psi4N: number; n: number
} {
  switch (cfType) {
    case 'gene':
      return {
        psi1N: vector.genePsi1N, psi2N: vector.genePsi2N,
        psi3N: vector.genePsi3N, psi4N: vector.genePsi4N, n: vector.geneN
      }
    case 'site':
      return {
        psi1N: vector.sitePsi1N, psi2N: vector.sitePsi2N,
        psi3N: vector.sitePsi3N, psi4N: vector.sitePsi4N, n: vector.siteN
      }
    case 'quartet':
      return {
        psi1N: vector.quartetPsi1N, psi2N: vector.quartetPsi2N,
        psi3N: vector.quartetPsi3N, psi4N: vector.quartetPsi4N, n: vector.quartetN
      }
  }
}

// ──────────────────────────────────────────────
// 7. 配色方案
// ──────────────────────────────────────────────

/**
 * HSL 转 RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * 根据配色方案和 psi 值获取颜色
 * P0修复：热力图配色在低一致性端使用更暗的颜色确保暗色主题可见性
 */
export function getColorByScheme(
  psi1: number, psi2: number, psi3: number, psi4: number,
  scheme: ColorSchemeType = 'heat'
): string {
  const total = psi1 + psi2 + psi3 + psi4
  if (total === 0) return '#5a5a5a'

  const concordance = psi1 / total  // 0-1, 1=fully concordant

  switch (scheme) {
    case 'rainbow': {
      // 彩虹配色：红(低一致性) → 橙 → 黄 → 绿 → 蓝(高一致性)
      const hue = concordance * 240  // 0(红) → 240(蓝)
      const [r, g, b] = hslToRgb(hue, 0.85, 0.5)
      return `rgb(${r}, ${g}, ${b})`
    }
    case 'heat': {
      // 热力图配色：暗红(低) → 橙 → 黄 → 绿(高)
      // Ensure high-concordance end is visible on light theme
      // Use deeper green (lower lightness) so white-bg contrast >= 3:1
      const r = Math.round(200 + 55 * (1 - concordance))
      const g = Math.round(80 + 140 * concordance)
      const b = Math.round(30 + 20 * (1 - concordance))
      return `rgb(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${b})`
    }
    case 'blueRed': {
      // 蓝-红配色：红(低一致性) → 蓝(高一致性)
      const r = Math.round(180 + 40 * (1 - concordance))
      const b = Math.round(100 + 130 * concordance)
      return `rgb(${r}, ${Math.round(80 + concordance * 50)}, ${b})`
    }
    case 'monochrome': {
      // 单色灰度
      const v = Math.round(80 + concordance * 160)
      return `rgb(${v}, ${v}, ${v})`
    }
    default:
      return '#5a5a5a'
  }
}

/**
 * 兼容旧接口
 */
export function getColorByPsi(psi1: number, psi2: number, psi3: number, psi4: number): string {
  return getColorByScheme(psi1, psi2, psi3, psi4, 'heat')
}
