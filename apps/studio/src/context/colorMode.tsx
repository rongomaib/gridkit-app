import { createContext, useContext, useEffect, useState } from 'react'

type ColorMode = 'light' | 'dark'

interface ColorModeValue {
  isDark: boolean
  toggle: () => void
}

const ColorModeCtx = createContext<ColorModeValue | null>(null)

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(() => {
    try {
      const s = localStorage.getItem('color-mode') as ColorMode | null
      if (s === 'dark' || s === 'light') return s
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    try {
      localStorage.setItem('color-mode', mode)
    } catch {}
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return <ColorModeCtx.Provider value={{ isDark: mode === 'dark', toggle }}>{children}</ColorModeCtx.Provider>
}

export function useColorMode() {
  const ctx = useContext(ColorModeCtx)
  if (ctx == null) throw new Error('useColorMode must be inside ColorModeProvider')
  return ctx
}
