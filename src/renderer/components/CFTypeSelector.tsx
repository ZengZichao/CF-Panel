// src/renderer/components/CFTypeSelector.tsx
// Linear Segmented-style CF type selector
// radiogroup 实现 roving tabindex — Tab 序列整组单一落点、
// 方向键循环、焦点跟随选中项（APG Radio Group 模式）

import React from 'react'
import { useSelectionStore } from '../stores/selection'
import { useSettingsStore } from '../stores/settings'
import { useRovingRadio } from '../hooks/useRovingRadio'
import { Icon } from './Icon'
import type { CFType } from '../types/cf'

const TYPES = ['gene', 'site', 'quartet'] as const

const CFTypeSelector: React.FC = () => {
  const { activeCFType, setActiveCFType } = useSelectionStore()
  const { t } = useSettingsStore()
  const roving = useRovingRadio(TYPES, activeCFType, setActiveCFType)

  const types: { key: CFType; label: string; icon: 'dna' | 'triangle' | 'grid'; desc: string }[] = [
    { key: 'gene', label: t.cfTypeGene, icon: 'dna', desc: t.cfTypeGeneDesc },
    { key: 'site', label: t.cfTypeSite, icon: 'triangle', desc: t.cfTypeSiteDesc },
    { key: 'quartet', label: t.cfTypeQuartet, icon: 'grid', desc: t.cfTypeQuartetDesc }
  ]

  return (
    <div
      className="cf-type-selector"
      role="radiogroup"
      aria-label={t.ariaCFTypeSelector}
      onKeyDown={roving.onKeyDown}
    >
      {types.map(type => (
        <button
          key={type.key}
          className={`cf-type-btn ${activeCFType === type.key ? 'active' : ''}`}
          onClick={() => setActiveCFType(type.key)}
          title={type.desc}
          {...roving.getProps(type.key)}
          aria-label={type.desc}
        >
          <span className="cf-type-icon" aria-hidden="true">
            <Icon name={type.icon} size={13} />
          </span>
          <span className="cf-type-label">{type.label}</span>
        </button>
      ))}
    </div>
  )
}

export default CFTypeSelector
