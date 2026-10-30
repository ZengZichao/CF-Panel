// src/renderer/stores/project.ts
import { create } from 'zustand'
import type { CFProject, TreeNode } from '../types/cf'
import {
  saveRecentProject,
  getRecentProjects,
  type RecentProject,
} from './persistence'

interface ProjectState {
  project: CFProject | null
  rootNode: TreeNode | null
  branchIdMap: Map<number, TreeNode> | null
  loading: boolean
  error: string | null
  recentProjects: RecentProject[]
  setProject: (p: CFProject | null) => void
  setTree: (root: TreeNode | null, map: Map<number, TreeNode> | null) => void
  setLoading: (b: boolean) => void
  setError: (e: string | null) => void
  clear: () => void
  loadRecentProjects: () => Promise<void>
  saveCurrentAsRecent: (dirPath: string, name: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  rootNode: null,
  branchIdMap: null,
  loading: false,
  error: null,
  recentProjects: [],
  setProject: (p) => set({
    project: p,
    // P0: Reset tree when project is null or has no tree data
    rootNode: (!p || (!p.branchIdTree && !p.treeNewick)) ? null : get().rootNode,
    branchIdMap: (!p || (!p.branchIdTree && !p.treeNewick)) ? null : get().branchIdMap,
  }),
  setTree: (root, map) => set({ rootNode: root, branchIdMap: map }),
  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e }),
  clear: () => set({ project: null, rootNode: null, branchIdMap: null, loading: false, error: null }),
  loadRecentProjects: async () => {
    try {
      const recent = await getRecentProjects(10)
      set({ recentProjects: recent })
    } catch {
      // Best-effort
    }
  },
  saveCurrentAsRecent: async (dirPath: string, name: string) => {
    const { project } = get()
    if (!project) return
    const id = dirPath.replace(/[^a-zA-Z0-9]/g, '_')
    const recent: RecentProject = {
      id,
      name,
      dirPath,
      loadedAt: Date.now(),
      branchCount: project.vectors.length,
      projectData: {
        treeNewick: project.treeNewick,
        branchIdTree: project.branchIdTree,
        vectors: project.vectors,
      },
    }
    try {
      await saveRecentProject(recent)
      await get().loadRecentProjects()
    } catch {
      // Best-effort
    }
  },
}))
