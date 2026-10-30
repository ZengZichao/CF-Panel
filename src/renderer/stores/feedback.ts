// src/renderer/stores/feedback.ts
// 反馈系统 — 分离 severity 与上下文
// 成功是成功，错误是错误；多条消息可共存；读屏语义正确：
//   success/info → role="status"（polite 播报）
//   warning/error → role="alert"（打断播报）
// 支持可选动作按钮（如破坏性操作的「撤销」）

import { create } from 'zustand'

export type FeedbackKind = 'success' | 'info' | 'warning' | 'error'

export interface FeedbackAction {
  label: string
  handler: () => void
}

export interface Feedback {
  id: string
  kind: FeedbackKind
  message: string
  /** 0 表示需手动关闭 */
  ttl: number
  action?: FeedbackAction
}

interface FeedbackState {
  items: Feedback[]
  push: (kind: FeedbackKind, message: string, opts?: { ttl?: number; action?: FeedbackAction }) => void
  dismiss: (id: string) => void
}

const DEFAULT_TTL: Record<FeedbackKind, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 0, // error 必须手动关闭
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `fb-${Date.now()}-${idCounter}`
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  items: [],
  push: (kind, message, opts) => {
    const ttl = opts?.ttl ?? DEFAULT_TTL[kind]
    const id = nextId()
    // 同文案去重：重复触发时重置为单条
    set((s) => ({
      items: [...s.items.filter((i) => i.message !== message), { id, kind, message, ttl, action: opts?.action }],
    }))
    if (ttl > 0) {
      setTimeout(() => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      }, ttl)
    }
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))

/** 便捷入口：非组件上下文（loader 等）也可推送反馈 */
export const feedback = {
  success: (message: string) => useFeedbackStore.getState().push('success', message),
  info: (message: string) => useFeedbackStore.getState().push('info', message),
  warning: (message: string) => useFeedbackStore.getState().push('warning', message),
  error: (message: string) => useFeedbackStore.getState().push('error', message),
}
