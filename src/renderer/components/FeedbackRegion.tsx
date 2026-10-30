// src/renderer/components/FeedbackRegion.tsx
// 统一反馈渲染 — 替代单一 error-banner 槽位
// success/info → role="status"（礼貌播报）；warning/error → role="alert"（打断播报）
// 支持可选动作按钮（如「撤销」）

import React from 'react'
import { useFeedbackStore, type FeedbackKind } from '../stores/feedback'
import { Icon, type IconName } from './Icon'
import { useSettingsStore } from '../stores/settings'

const KIND_ICON: Record<FeedbackKind, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  error: 'warning',
}

export function FeedbackRegion() {
  const { items, dismiss } = useFeedbackStore()
  const { t } = useSettingsStore()

  return (
    <div className="feedback-region">
      {items.map((f) => (
        <div
          key={f.id}
          className={`feedback feedback--${f.kind}`}
          role={f.kind === 'success' || f.kind === 'info' ? 'status' : 'alert'}
          aria-live={f.kind === 'success' || f.kind === 'info' ? 'polite' : 'assertive'}
        >
          <span className="feedback__icon" aria-hidden="true">
            <Icon name={KIND_ICON[f.kind]} size={15} />
          </span>
          <span className="feedback__text">{f.message}</span>
          {f.action && (
            <button
              className="feedback__action"
              onClick={() => {
                f.action!.handler()
              }}
            >
              {f.action.label}
            </button>
          )}
          <button
            className="feedback__close"
            onClick={() => dismiss(f.id)}
            aria-label={t.dismiss}
          >
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
