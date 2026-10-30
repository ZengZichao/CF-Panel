// src/renderer/stores/treeSettings.ts
// 树画布设置 — Zustand 体系，persist 中间件持久化到 localStorage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TreeLayoutType, ColorSchemeType } from '../types/cf'

export interface TreeSettings {
  layoutType: TreeLayoutType
  useBranchLength: boolean
  branchWidth: number
  colorScheme: ColorSchemeType
  labelFontSize: number
  labelFontColor: string
  showLabels: boolean
  showBranchIds: boolean
  searchQuery: string
  useRegex: boolean
}

export const DEFAULT_TREE_SETTINGS: TreeSettings = {
  layoutType: 'rectangular',
  useBranchLength: true,
  branchWidth: 1.5,
  colorScheme: 'heat',
  labelFontSize: 10,
  labelFontColor: '',
  showLabels: true,
  // 分支 ID 默认隐藏，zoom 高时才显示
  showBranchIds: false,
  searchQuery: '',
  useRegex: false,
}

interface TreeSettingsState extends TreeSettings {
  update: (partial: Partial<TreeSettings>) => void
  reset: () => void
}

export const useTreeSettingsStore = create<TreeSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_TREE_SETTINGS,
      update: (partial) => set(partial),
      reset: () => set({ ...DEFAULT_TREE_SETTINGS }),
    }),
    {
      name: 'cfpanel-tree-settings',
      // searchQuery 属会话态，不持久化
      partialize: (s) => ({
        layoutType: s.layoutType,
        useBranchLength: s.useBranchLength,
        branchWidth: s.branchWidth,
        colorScheme: s.colorScheme,
        labelFontSize: s.labelFontSize,
        labelFontColor: s.labelFontColor,
        showLabels: s.showLabels,
        showBranchIds: s.showBranchIds,
        useRegex: s.useRegex,
      }),
    }
  )
)
