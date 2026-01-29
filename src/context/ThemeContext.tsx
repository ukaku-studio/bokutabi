import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedRaw = localStorage.getItem('theme')
    const saved = savedRaw as Theme | 'auto' | null
    // Migrate existing 'auto' users
    if (saved === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const migrated = prefersDark ? 'dark' : 'light'
      localStorage.setItem('theme', migrated)
      return migrated
    }
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  const [isDark, setIsDark] = useState(theme === 'dark')

  useEffect(() => {
    setIsDark(theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
