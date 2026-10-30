// src/renderer/stores/ternarySettings.ts
// 三元图设置 — 聚焦强度三档
// 选中分支后的语境保留策略由用户选择：
//   emphasize  — 强调：非选中点降至 0.4（保持可辨），选中点放大 + 描边
//   dim-less   — 弱化语境：全部保持 0.85，选中点仅以尺寸/描边区分
//   hide-others— 完全隐藏：只看选中分支（部分分析任务确实只看一个分支）

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TernaryFocusMode = 'emphasize' | 'dim-less' | 'hide-others'

interface TernarySettingsState {
  focusMode: TernaryFocusMode
  showConvexHull: boolean
  showDensityContour: boolean
  setFocusMode: (m: TernaryFocusMode) => void
  setShowConvexHull: (b: boolean) => void
  setShowDensityContour: (b: boolean) => void
}

export const useTernarySettingsStore = create<TernarySettingsState>()(
  persist(
    (set) => ({
      focusMode: 'emphasize',
      showConvexHull: false,
      showDensityContour: false,
      setFocusMode: (m) => set({ focusMode: m }),
      setShowConvexHull: (b) => set({ showConvexHull: b }),
      setShowDensityContour: (b) => set({ showDensityContour: b }),
    }),
    { name: 'cfpanel-ternary-settings' }
  )
)
