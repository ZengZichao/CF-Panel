// src/renderer/stores/selection.ts
import { create } from 'zustand'
import type { CFType } from '../types/cf'
import { saveViewState, getViewState } from './persistence'

interface SelectionState {
  selectedBranchId: number | null
  hoveredBranchId: number | null
  activeCFType: CFType
  selectBranch: (id: number | null) => void
  hoverBranch: (id: number | null) => void
  setActiveCFType: (t: CFType) => void
  restoreFromPersistence: () => Promise<void>
  persistState: () => Promise<void>
}

// persistState 节流 — 高频 select（键盘连按 ↑↓）不再每次都异步写 IndexedDB
const PERSIST_DEBOUNCE_MS = 400
let persistTimer: ReturnType<typeof setTimeout> | null = null

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedBranchId: null,
  hoveredBranchId: null,
  activeCFType: 'gene',
  selectBranch: (id) => {
    set({ selectedBranchId: id })
    // Debounced persist（卸载前由 App flush 一次）
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      persistTimer = null
      get().persistState()
    }, PERSIST_DEBOUNCE_MS)
  },
  hoverBranch: (id) => set({ hoveredBranchId: id }),
  setActiveCFType: (t) => {
    set({ activeCFType: t })
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
      get().persistState()
    }
  },
  persistState: async () => {
    const { selectedBranchId, activeCFType } = get()
    try {
      await saveViewState({
        id: 'current',
        selectedBranchId,
        activeCFType,
        treeLayoutType: '',
        useBranchLength: true,
        colorScheme: 'heat',
        lastProjectId: null,
      })
    } catch {
      // Persistence is best-effort, don't throw
    }
  },
  restoreFromPersistence: async () => {
    try {
      const state = await getViewState()
      if (state) {
        set({
          selectedBranchId: state.selectedBranchId ?? null,
          activeCFType: state.activeCFType ?? 'gene',
        })
      }
    } catch {
      // Best-effort restore
    }
  },
}))

/** 立即 flush 待写入的持久化（App 卸载时调用） */
export function flushPersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
    useSelectionStore.getState().persistState()
  }
}
