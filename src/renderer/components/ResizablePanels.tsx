// src/renderer/components/ResizablePanels.tsx
// 可拖拽面板布局组件 — 支持面板之间拖拽调整大小
// 分割器键盘模型 — 仅轴向正确的方向键生效、步长 8%、Home/End 极值、
//         aria-valuenow 语义；命中区扩至 ≥8px（CSS）
// 面板尺寸持久化（persistKey → ui store → localStorage，重启恢复）

import React, { useCallback, useRef, useState } from 'react'
import { useUIStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'

interface ResizablePanelsProps {
  children: React.ReactNode[]
  direction: 'horizontal' | 'vertical'
  initialSizes?: number[]
  minSizes?: number[]
  className?: string
  /** 持久化键 — 提供后尺寸变化自动写入 ui store */
  persistKey?: string
}

const KEYBOARD_STEP = 0.08

const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  children,
  direction,
  initialSizes,
  minSizes,
  className = '',
  persistKey
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelSizes = useUIStore((s) => s.panelSizes)
  const setPanelSizes = useUIStore((s) => s.setPanelSizes)
  const { t } = useSettingsStore()

  const [sizes, setSizes] = useState<number[]>(() => {
    if (persistKey) {
      const saved = panelSizes[persistKey]
      if (saved && saved.length === children.length) return saved
    }
    return initialSizes && initialSizes.length === children.length
      ? initialSizes
      : Array(children.length).fill(1 / children.length)
  })
  const [dragging, setDragging] = useState<number | null>(null)
  const dragInfo = useRef<{ startMouse: number; startSizes: number[] }>({
    startMouse: 0,
    startSizes: []
  })

  const sizesRef = useRef(sizes)
  sizesRef.current = sizes

  const commit = useCallback(
    (next: number[]) => {
      setSizes(next)
      if (persistKey) setPanelSizes(persistKey, next)
    },
    [persistKey, setPanelSizes]
  )

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    const isHorizontal = direction === 'horizontal'
    const startMouse = isHorizontal ? e.clientX : e.clientY
    dragInfo.current = { startMouse, startSizes: [...sizesRef.current] }
    setDragging(index)

    const handleMouseMove = (ev: MouseEvent) => {
      const currentMouse = isHorizontal ? ev.clientX : ev.clientY
      const delta = currentMouse - dragInfo.current.startMouse
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const containerSize = isHorizontal ? containerRect.width : containerRect.height
      const deltaRatio = delta / containerSize

      const newSizes = [...dragInfo.current.startSizes]
      const minSize1 = minSizes?.[index] ?? 0.05
      const minSize2 = minSizes?.[index + 1] ?? 0.05

      // 分配 delta 给左右两个面板
      let leftChange = deltaRatio
      // 限制不能小于最小值
      if (newSizes[index] + leftChange < minSize1) {
        leftChange = minSize1 - newSizes[index]
      }
      if (newSizes[index + 1] - leftChange < minSize2) {
        leftChange = newSizes[index + 1] - minSize2
      }

      newSizes[index] += leftChange
      newSizes[index + 1] -= leftChange

      setSizes(newSizes)
    }

    const handleMouseUp = () => {
      setDragging(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // 拖拽结束持久化
      if (persistKey) setPanelSizes(persistKey, sizesRef.current)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [direction, minSizes, persistKey, setPanelSizes])

  const isHorizontal = direction === 'horizontal'

  // 键盘调整 — 仅轴向正确的按键生效；横向分隔用 ←/→，纵向分隔用 ↑/↓
  const handleDividerKeyDown = (e: React.KeyboardEvent, index: number) => {
    const validKeys = isHorizontal ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
    const isHomeEnd = e.key === 'Home' || e.key === 'End'
    if (!validKeys.includes(e.key) && !isHomeEnd) return

    e.preventDefault()
    e.stopPropagation() // 防止全局 ↑↓ 分支导航同时触发

    const newSizes = [...sizesRef.current]
    const min1 = minSizes?.[index] ?? 0.05
    const min2 = minSizes?.[index + 1] ?? 0.05

    // 正方向 = 前一个面板增大
    const positive = isHorizontal
      ? e.key === 'ArrowRight' || e.key === 'Home'
      : e.key === 'ArrowDown' || e.key === 'Home'

    const maxPositive = newSizes[index + 1] - min2 // 前面板最多可增大
    const maxNegative = newSizes[index] - min1     // 前面板最多可缩小

    let change = 0
    if (e.key === 'Home') {
      change = maxPositive // 前面板最大化
    } else if (e.key === 'End') {
      change = -maxNegative // 后面板最大化
    } else {
      const step = positive ? KEYBOARD_STEP : -KEYBOARD_STEP
      change = Math.max(-maxNegative, Math.min(step, maxPositive))
    }

    if (change !== 0) {
      newSizes[index] += change
      newSizes[index + 1] -= change
      commit(newSizes)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`resizable-panels ${isHorizontal ? 'horizontal' : 'vertical'} ${className}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div
            className="resizable-panel"
            style={{
              flex: `${sizes[index]} 1 0`,
              overflow: 'hidden',
              minHeight: 0,
              minWidth: 0,
              position: 'relative'
            }}
          >
            {child}
          </div>
          {/* Divider */}
          {index < children.length - 1 && (
            <div
              className={`panel-divider ${isHorizontal ? 'horizontal' : 'vertical'} ${dragging === index ? 'dragging' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, index)}
              role="separator"
              tabIndex={0}
              aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
              aria-label={t.resizeDivider}
              aria-valuenow={Math.round(sizes[index] * 100)}
              aria-valuemin={Math.round((minSizes?.[index] ?? 0.05) * 100)}
              aria-valuemax={Math.round((1 - (minSizes?.[index + 1] ?? 0.05)) * 100)}
              aria-valuetext={`${Math.round(sizes[index] * 100)}% / ${Math.round(sizes[index + 1] * 100)}%`}
              onKeyDown={(e) => handleDividerKeyDown(e, index)}
            >
              <div className="panel-divider-handle" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default ResizablePanels
