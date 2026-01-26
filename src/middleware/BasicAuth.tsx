import { useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'basic-auth-session'

type BasicAuthProps = {
  children: ReactNode
}

function BasicAuth({ children }: BasicAuthProps) {
  const { t } = useTranslation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const expectedUser = import.meta.env.VITE_BASIC_AUTH_USER
  const expectedPass = import.meta.env.VITE_BASIC_AUTH_PASS

  // If no credentials are configured, skip authentication
  const isAuthEnabled = Boolean(expectedUser && expectedPass)

  useEffect(() => {
    if (!isAuthEnabled) {
      setIsAuthenticated(true)
      setIsChecking(false)
      return
    }

    // Check for existing session
    const session = localStorage.getItem(STORAGE_KEY)
    if (session) {
      try {
        const { user, timestamp } = JSON.parse(session)
        // Session expires after 24 hours
        const isValid = user === expectedUser && Date.now() - timestamp < 24 * 60 * 60 * 1000
        if (isValid) {
          setIsAuthenticated(true)
        }
      } catch {
        // Invalid session data
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsChecking(false)
  }, [expectedUser, isAuthEnabled])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username === expectedUser && password === expectedPass) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: username,
        timestamp: Date.now()
      }))
      setIsAuthenticated(true)
    } else {
      setError(t('auth.invalidPassword'))
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-2">{t('auth.basicTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            {t('auth.subtitle')}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                {t('auth.basicUsername')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                {t('auth.basicPassword')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-white dark:text-gray-900"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={!username || !password}
              className="w-full rounded-2xl bg-[#5A9CB5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4a8ca5] disabled:bg-gray-400"
            >
              {t('auth.unlock')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default BasicAuth
