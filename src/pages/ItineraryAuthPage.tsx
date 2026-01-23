import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

function ItineraryAuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setError('')
    setLoading(true)

    try {
      const { token } = await api.authenticateItinerary(id, password)

      // Store auth token
      localStorage.setItem(`auth-${id}`, token)

      // Navigate to itinerary
      navigate(`/itinerary/${id}`)
    } catch (err) {
      setError(t('auth.invalidPassword', 'Invalid password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              🔒 {t('auth.title', 'Password Required')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.subtitle', 'Enter the password to access this itinerary')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('auth.password', 'Password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Enter password')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? t('common.loading') : t('auth.unlock', 'Unlock Itinerary')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← {t('common.backHome', 'Back to Home')}
            </button>
          </div>

          {/* Dev hint */}
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Dev Mode:</strong> Try passwords: "tokyo2024" or "osaka123"
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItineraryAuthPage
