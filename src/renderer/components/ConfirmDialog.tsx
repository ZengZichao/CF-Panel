// src/renderer/components/ConfirmDialog.tsx
// 自定义确认对话框 — 替换原生 window.confirm
// 原生 confirm 的问题：破坏桌面观感、按钮文案无法本地化、无键盘定制、
// 无法提供「撤销」替代路径。本组件遵循 alertdialog 模式：
//   role="alertdialog" + aria-modal + 焦点陷阱 + Escape 取消 + 焦点归还

import React, { useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { useSettingsStore } from '../stores/settings'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const { t } = useSettingsStore()

  // 打开时聚焦确认按钮，关闭时归还焦点
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement
      confirmBtnRef.current?.focus()
      return () => {
        previouslyFocused.current?.focus?.()
      }
    }
  }, [open])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
        return
      }
      if (e.key === 'Tab') {
        // 简单焦点陷阱：在对话框内循环
        const focusables = e.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onCancel]
  )

  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="dialog-icon" aria-hidden="true">
          <Icon name="warning" size={22} />
        </div>
        <h2 id="confirm-dialog-title" className="dialog-title">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="dialog-message">
          {message}
        </p>
        <div className="dialog-actions">
          <button type="button" className="dialog-btn dialog-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            className={`dialog-btn dialog-btn--confirm ${destructive ? 'dialog-btn--destructive' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        <span className="sr-only">{t.ariaConfirmDialog}</span>
      </div>
    </div>,
    document.body
  )
}
