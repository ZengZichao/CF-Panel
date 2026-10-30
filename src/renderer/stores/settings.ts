// src/renderer/stores/settings.ts
import { create } from 'zustand'
import type { Language } from '../i18n/translations'
import { translations, type TranslationKey } from '../i18n/translations'

export type Theme = 'light' | 'dark'

interface SettingsState {
  language: Language
  theme: Theme
  t: TranslationKey
  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleLanguage: () => void
}

const STORAGE_KEY_LANG = 'cfpanel-language'
const STORAGE_KEY_THEME = 'cfpanel-theme'

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LANG)
    if (stored === 'en' || stored === 'zh') return stored
  } catch {}
  // Default to Chinese (中文界面为默认)
  return 'zh'
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  // Default to light theme (明亮界面为默认)
  return 'light'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: getInitialLanguage(),
  theme: getInitialTheme(),
  t: translations[getInitialLanguage()],
  setLanguage: (lang) => {
    try { localStorage.setItem(STORAGE_KEY_LANG, lang) } catch {}
    set({ language: lang, t: translations[lang] })
  },
  setTheme: (theme) => {
    try { localStorage.setItem(STORAGE_KEY_THEME, theme) } catch {}
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
  toggleLanguage: () => {
    const next = get().language === 'en' ? 'zh' : 'en'
    get().setLanguage(next)
  }
}))

// Apply initial theme on module load
if (typeof document !== 'undefined') {
  applyTheme(getInitialTheme())
}
