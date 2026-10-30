// src/renderer/hooks/useRovingRadio.ts
// radiogroup 的 roving tabindex
// APG Radio Group 模式：Tab 序列中整组只占 1 个落点（激活项 tabIndex=0，其余 -1），
// 方向键循环切换，焦点跟随选中项。

import { useRef, useCallback } from 'react'

export function useRovingRadio<T extends string>(
  options: readonly T[],
  active: T,
  onChange: (v: T) => void
) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const delta =
        e.key === 'ArrowRight' || e.key === 'ArrowDown'
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
            ? -1
            : 0
      if (!delta) return
      e.preventDefault()
      e.stopPropagation() // 防止全局 ↑↓ 分支导航同时触发
      const i = options.indexOf(active)
      const next = options[(i + delta + options.length) % options.length]
      onChange(next)
      refs.current[next]?.focus() // 焦点跟随选中项
    },
    [options, active, onChange]
  )

  const getProps = useCallback(
    (v: T) => ({
      ref: (el: HTMLButtonElement | null) => {
        refs.current[v] = el
      },
      role: 'radio' as const,
      'aria-checked': v === active,
      tabIndex: v === active ? 0 : -1, // 单一 Tab 落点
    }),
    [active]
  )

  return { getProps, onKeyDown }
}
