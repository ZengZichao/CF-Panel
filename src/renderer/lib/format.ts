// src/renderer/lib/format.ts
// 数值格式化单一真相源 — 消除三视图（表格 / 三元图 / 侧栏）单位与精度不一致
// 语义约定（依据 parse.ts buildVectors）：
//   - 所有 Ψ 值（gene/site/quartet）均为百分比（0–100），统一以 % 呈现
//   - 所有 N 值为计数（基因数 / 位点数 / 四分组数），整数呈现；非整数（如 quartet 的
//     有效四分组数 EN）保留至多 2 位小数
//   - 枝长（替换/位点、溯祖）统一 6 位小数

import type { CFType } from '../types/cf'

/** Ψ 值：统一 toFixed(2)，默认带 % 单位（withUnit: false 用于表头已标注单位的紧凑场景） */
export function formatPsi(v: number | null | undefined, opts: { withUnit?: boolean } = {}): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const s = v.toFixed(2)
  return opts.withUnit === false ? s : `${s}%`
}

/** N 值：计数语义 — 整数直接呈现，非整数保留至多 2 位小数 */
export function formatN(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  if (Number.isInteger(v)) return String(v)
  const s = v.toFixed(2)
  return s.replace(/\.?0+$/, '')
}

/** 枝长：统一 6 位小数 */
export function formatLength(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toFixed(6)
}

/** 后验概率 pp：1 位小数 */
export function formatPp(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toFixed(1)
}

/** 分支标签：i18n 安全的「分支 #12 / Branch #12」（替代硬编码 `${t.branchId} ID: ${id}`） */
export function formatBranchIdLabel(template: string, id: number | string): string {
  return template.replace('{id}', String(id))
}

// ──────────────────────────────────────────────
// 配色图例 — 与 parse.ts getColorByScheme 保持一致的低→高一致性渐变
// ──────────────────────────────────────────────

import type { ColorSchemeType } from '../types/cf'

/** 各配色方案的 CSS 线性渐变（低一致性 → 高一致性），用于图例 */
export const SCHEME_GRADIENTS: Record<ColorSchemeType, string> = {
  // heat: 暗红(低) → 橙 → 黄绿 → 深绿(高) — 与 getColorByScheme('heat') 端点一致
  heat: 'linear-gradient(90deg, rgb(255, 80, 50), rgb(200, 110, 30), rgb(140, 150, 20), rgb(80, 220, 30))',
  // rainbow: 红(0) → 黄 → 绿 → 蓝(240)
  rainbow: 'linear-gradient(90deg, hsl(0, 85%, 50%), hsl(60, 85%, 50%), hsl(120, 85%, 50%), hsl(180, 85%, 50%), hsl(240, 85%, 50%))',
  // blueRed: 红(低) → 蓝(高)
  blueRed: 'linear-gradient(90deg, rgb(220, 80, 100), rgb(180, 105, 130), rgb(140, 115, 165), rgb(100, 120, 200), rgb(180, 130, 230))',
  // monochrome: 深灰(低) → 浅灰(高)
  monochrome: 'linear-gradient(90deg, rgb(80, 80, 80), rgb(160, 160, 160), rgb(240, 240, 240))',
}

/** 读取 CSS 自定义属性（组件无法直接用 var() 的场景：Canvas / ECharts） */
export function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
