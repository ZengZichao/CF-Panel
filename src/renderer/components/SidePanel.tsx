// src/renderer/components/SidePanel.tsx
// Linear Descriptions/Card style — section titles, statistic cards, description lists
// 能力缺失提示合并为单一 live region
// Ψ/N/枝长数值统一走 format.ts；类型名 i18n
// heatmap 底色改用语义 token + color-mix

import React, { useMemo } from 'react'
import { useProjectStore } from '../stores/project'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import type { CFVector, CFType } from '../types/cf'
import { formatPsi, formatN, formatLength, formatPp } from '../lib/format'
import { Icon } from './Icon'

interface PsiData {
  psi1: number; psi2: number; psi3: number; psi4: number
  psi1N: number; psi2N: number; psi3N: number; psi4N: number
  n: number
  labels: string[]
}

const SidePanel: React.FC = () => {
  const { project } = useProjectStore()
  const { selectedBranchId, activeCFType } = useSelectionStore()
  const { t } = useSettingsStore()

  const selectedVector = useMemo(() => {
    if (!project || selectedBranchId === null) return null
    return project.vectors.find(v => v.id === selectedBranchId) ?? null
  }, [project, selectedBranchId])

  const getPsiData = (v: CFVector, type: CFType): PsiData => {
    if (type === 'gene') {
      return {
        psi1: v.genePsi1, psi2: v.genePsi2, psi3: v.genePsi3, psi4: v.genePsi4,
        psi1N: v.genePsi1N, psi2N: v.genePsi2N, psi3N: v.genePsi3N, psi4N: v.genePsi4N,
        n: v.geneN,
        labels: ['gΨ₁ (gCF)', 'gΨ₂ (gDF1)', 'gΨ₃ (gDF2)', 'gΨ₄ (gDFP)']
      }
    } else if (type === 'site') {
      return {
        psi1: v.sitePsi1, psi2: v.sitePsi2, psi3: v.sitePsi3, psi4: v.sitePsi4,
        psi1N: v.sitePsi1N, psi2N: v.sitePsi2N, psi3N: v.sitePsi3N, psi4N: v.sitePsi4N,
        n: v.siteN,
        labels: ['sΨ₁ (sCF)', 'sΨ₂ (sDF1)', 'sΨ₃ (sDF2)', 'sΨ₄']
      }
    } else {
      return {
        psi1: v.quartetPsi1, psi2: v.quartetPsi2, psi3: v.quartetPsi3, psi4: v.quartetPsi4,
        psi1N: v.quartetPsi1N, psi2N: v.quartetPsi2N, psi3N: v.quartetPsi3N, psi4N: v.quartetPsi4N,
        n: v.quartetN,
        labels: ['qΨ₁ (qCF)', 'qΨ₂', 'qΨ₃', 'qΨ₄']
      }
    }
  }

  const typeLabels: Record<CFType, string> = {
    gene: t.cfTypeGene,
    site: t.cfTypeSite,
    quartet: t.cfTypeQuartet,
  }

  const missingCapabilities: string[] = []
  if (project && !project.hasGcfStat) missingCapabilities.push(t.capabilityGcfMissing)
  if (project && !project.hasScflStat) missingCapabilities.push(t.capabilityScflMissing)
  if (project && !project.hasCblStat) missingCapabilities.push(t.capabilityCblMissing)

  const CapabilityNotices = () => (
    // 单一 live region — 播报一次汇总语句
    missingCapabilities.length > 0 && (
      <div className="capability-notice" role="status" aria-live="polite">
        {missingCapabilities.map((msg, i) => (
          <div key={i} className="capability-notice__item">
            <Icon name="warning" size={11} /> {msg}
          </div>
        ))}
      </div>
    )
  )

  if (!selectedVector) {
    return (
      <div className="side-panel-empty" role="region" aria-label={t.ariaSidePanel}>
        <CapabilityNotices />
        <div className="empty-icon" aria-hidden="true"><Icon name="search" size={36} /></div>
        <div className="empty-text">{t.emptyBranchDetail}</div>
      </div>
    )
  }

  const activeData = getPsiData(selectedVector, activeCFType)
  const allTypes: CFType[] = ['gene', 'site', 'quartet']

  // heatmap 底色由语义 accent token + color-mix 生成，文字色走主题 token
  const heatFamilyVar = (index: number): string => {
    if (index === 0) return '--accent-gene'      // Concordance — green
    if (index === 3) return '--accent-quartet'   // DFP — orange
    return '--color-primary'                     // Discordance — blue
  }

  return (
    <div className="side-panel-container" role="region" aria-label={t.ariaSidePanel}>
      <CapabilityNotices />
      {/* ─── Branch Header ─── */}
      <div className="side-panel-header">
        <h3>
          <span className="branch-id-badge">#{selectedVector.id}</span>
          {t.branchId}
        </h3>
      </div>

      {/* ─── Active CF Type Statistic Cards ─── */}
      <div className="heatmap-section">
        <h4 className="section-title">{typeLabels[activeCFType]} {t.concordanceFactors}</h4>
        <div className="heatmap-grid">
          {[0, 1, 2, 3].map(i => {
            const val = [activeData.psi1, activeData.psi2, activeData.psi3, activeData.psi4][i]
            const valN = [activeData.psi1N, activeData.psi2N, activeData.psi3N, activeData.psi4N][i]
            const intensity = Math.max(0, Math.min(1, val / 100))
            const pct = Math.round((0.15 + intensity * 0.75) * 100)
            return (
              <div
                key={i}
                className="heatmap-cell"
                style={{ backgroundColor: `color-mix(in srgb, var(${heatFamilyVar(i)}) ${pct}%, transparent)` }}
              >
                <div className="heatmap-label">{activeData.labels[i]}</div>
                <div className="heatmap-value">{formatPsi(val)}</div>
                <div className="heatmap-count">N={formatN(valN)}</div>
              </div>
            )
          })}
        </div>
        <div className="heatmap-total">{t.totalN} = {formatN(activeData.n)}</div>
      </div>

      {/* ─── All CF Types Comparison ─── */}
      <div className="comparison-section">
        <h4 className="section-title">{t.allConcordanceTypes}</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>{t.typeLabel}</th>
              <th>Ψ₁</th>
              <th>Ψ₂</th>
              <th>Ψ₃</th>
              <th>Ψ₄</th>
              <th>N</th>
            </tr>
          </thead>
          <tbody>
            {allTypes.map(type => {
              const d = getPsiData(selectedVector, type)
              return (
                <tr key={type} className={type === activeCFType ? 'active-row' : ''}>
                  <td className="type-label">{typeLabels[type]}</td>
                  <td>{formatPsi(d.psi1, { withUnit: false })}</td>
                  <td>{formatPsi(d.psi2, { withUnit: false })}</td>
                  <td>{formatPsi(d.psi3, { withUnit: false })}</td>
                  <td>{formatPsi(d.psi4, { withUnit: false })}</td>
                  <td>{formatN(d.n)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Branch Lengths (Descriptions) ─── */}
      <div className="lengths-section">
        <h4 className="section-title">{t.branchLengths}</h4>
        <div className="length-row">
          <span className="length-label">{t.subsPerSite}</span>
          <span className="length-value">{formatLength(selectedVector.lengthSubsPerSite)}</span>
        </div>
        <div className="length-row">
          <span className="length-label">{t.coalescent}</span>
          <span className="length-value">{formatLength(selectedVector.lengthCoalescent)}</span>
        </div>
      </div>

      {/* ─── Quartet Posterior Probabilities ─── */}
      {(selectedVector.quartetPsi1Pp > 0 || selectedVector.quartetPsi2Pp > 0 || selectedVector.quartetPsi3Pp > 0) && (
        <div className="pp-section">
          <h4 className="section-title">{t.quartetPosteriorProb}</h4>
          <div className="pp-row">
            <span>pp₁</span><span>{formatPp(selectedVector.quartetPsi1Pp)}</span>
          </div>
          <div className="pp-row">
            <span>pp₂</span><span>{formatPp(selectedVector.quartetPsi2Pp)}</span>
          </div>
          <div className="pp-row">
            <span>pp₃</span><span>{formatPp(selectedVector.quartetPsi3Pp)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SidePanel
