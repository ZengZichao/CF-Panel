import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
// Fonts are bundled locally via @fontsource (no CDN dependency)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import { useSettingsStore } from './stores/settings'

// Apply initial theme before render（html 级唯一写入源；App 内不再重复设置）
const initialTheme = useSettingsStore.getState().theme
document.documentElement.setAttribute('data-theme', initialTheme)

// Sync theme with main process (native window background)
if (window.cfpanel?.setTheme) {
  window.cfpanel.setTheme(initialTheme)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
