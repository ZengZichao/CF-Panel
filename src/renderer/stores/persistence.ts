// src/renderer/stores/persistence.ts
// IndexedDB-based persistence for recent projects, view state, and selected branches

import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'cfpanel'
const DB_VERSION = 1

// Store names
const STORE_RECENT_PROJECTS = 'recentProjects'
const STORE_VIEW_STATE = 'viewState'
const STORE_APP_SETTINGS = 'appSettings'

export interface RecentProject {
  id: string          // unique ID (e.g. dirPath hash)
  name: string        // display name
  dirPath: string     // IQ-TREE output directory path
  loadedAt: number    // timestamp
  branchCount: number // number of branches
  // Serialized project data (for quick restore)
  projectData?: {
    treeNewick: string
    branchIdTree: string
    vectors: unknown[]
  }
}

export interface PersistedViewState {
  id: 'current'       // singleton key
  selectedBranchId: number | null
  activeCFType: 'gene' | 'site' | 'quartet'
  treeLayoutType: string
  useBranchLength: boolean
  colorScheme: string
  lastProjectId: string | null
}

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_RECENT_PROJECTS)) {
        db.createObjectStore(STORE_RECENT_PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_VIEW_STATE)) {
        db.createObjectStore(STORE_VIEW_STATE)
      }
      if (!db.objectStoreNames.contains(STORE_APP_SETTINGS)) {
        db.createObjectStore(STORE_APP_SETTINGS)
      }
    },
  })
  return dbInstance
}

// ─── Recent Projects ───

export async function saveRecentProject(project: RecentProject): Promise<void> {
  const db = await getDB()
  await db.put(STORE_RECENT_PROJECTS, project)
}

export async function getRecentProjects(limit = 10): Promise<RecentProject[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_RECENT_PROJECTS) as RecentProject[]
  return all.sort((a, b) => b.loadedAt - a.loadedAt).slice(0, limit)
}

export async function deleteRecentProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_RECENT_PROJECTS, id)
}

export async function clearRecentProjects(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_RECENT_PROJECTS)
}

// ─── View State ───

export async function saveViewState(state: PersistedViewState): Promise<void> {
  const db = await getDB()
  await db.put(STORE_VIEW_STATE, state, 'current')
}

export async function getViewState(): Promise<PersistedViewState | null> {
  const db = await getDB()
  const state = await db.get(STORE_VIEW_STATE, 'current') as PersistedViewState | null
  return state
}

export async function clearViewState(): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_VIEW_STATE, 'current')
}

// ─── App Settings ───

export async function saveAppSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put(STORE_APP_SETTINGS, value, key)
}

export async function getAppSetting<T>(key: string): Promise<T | null> {
  const db = await getDB()
  return (await db.get(STORE_APP_SETTINGS, key)) as T | null
}
