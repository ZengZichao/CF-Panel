// src/renderer/components/OverflowMenu.tsx
// 可访问的下拉菜单 — Header 信息架构收拢用
// 遵循 APG Menu Button 模式：aria-haspopup / aria-expanded / role="menu"
// 键盘：Enter/Space/↓ 打开并聚焦首项；↑↓ 循环；Escape 关闭并归还焦点；
//       Home/End 跳转首末；Tab 关闭。

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Icon, type IconName } from './Icon'

export interface MenuItemDef {
  key: string
  label: string
  icon?: IconName
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

interface OverflowMenuProps {
  label: string
  icon?: IconName
  items: MenuItemDef[]
  /** 菜单展开方向：down（默认）或 up */
  align?: 'left' | 'right'
}

export function OverflowMenu({ label, icon, items, align = 'left' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const focusItem = (index: number) => {
    const el = itemRefs.current[index]
    if (el) el.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      requestAnimationFrame(() => focusItem(0))
    }
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const count = items.length
    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement)
    switch (e.key) {
      case 'Escape':
        e.stopPropagation()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        focusItem((currentIndex + 1 + count) % count)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem((currentIndex - 1 + count) % count)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(count - 1)
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div className="overflow-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="header-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          if (!open) requestAnimationFrame(() => focusItem(0))
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {icon && <Icon name={icon} size={15} />}
        {label}
        <Icon name="chevronDown" size={12} className="overflow-menu__chevron" />
      </button>
      {open && (
        <div
          className={`overflow-menu__panel overflow-menu__panel--${align}`}
          role="menu"
          aria-label={label}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              role="menuitem"
              className={`overflow-menu__item ${item.danger ? 'overflow-menu__item--danger' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                close(false)
                item.onSelect()
              }}
            >
              {item.icon && <Icon name={item.icon} size={14} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
