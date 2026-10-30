// src/renderer/stores/ui.ts
// UI 布局状态 — viewMode 与面板尺寸持久化
// 修复「调整完布局重启即失忆」的会话成本问题。

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = 'all' | 'tree' | 'ternary' | 'table'

interface PanelSizesState {
  [persistKey: string]: number[] // 每组 ResizablePanels 的尺寸比例
}

interface UIState {
  viewMode: ViewMode
  panelSizes: PanelSizesState
  setViewMode: (v: ViewMode) => void
  setPanelSizes: (key: string, sizes: number[]) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'all',
      panelSizes: {},
      setViewMode: (v) => set({ viewMode: v }),
      setPanelSizes: (key, sizes) =>
        set((s) => ({ panelSizes: { ...s.panelSizes, [key]: sizes } })),
    }),
    {
      name: 'cfpanel-ui',
      partialize: (s) => ({ viewMode: s.viewMode, panelSizes: s.panelSizes }),
    }
  )
)
