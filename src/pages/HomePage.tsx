import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect } from 'react'

type SavedItinerary = {
  id: string
  title: string
  entries: {
    date: string
    time: string
    location: string
    icon: string
    memo: string
  }[]
  createdAt: number
}

const features = [
  'home.featureShare',
  'home.featureOffline',
  'home.featureCollaborate',
  'home.featureAI'
]

type Theme = 'light' | 'dark' | 'auto'

const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

function HomePage() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('created-itineraries')
    if (stored) {
      setSavedItineraries(JSON.parse(stored))
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <div className="container mx-auto px-4 py-10 space-y-12">
        <header className="grid gap-8 lg:grid-cols-[2fr,1fr] items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-[#5A9CB5] dark:text-[#FACE68]">
              {t('home.subtitle')}
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">
              {t('home.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              {t('home.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/create"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FA6868] to-[#FAAC68] text-white font-semibold text-sm hover:opacity-90 transition"
              >
                {t('home.createButton')}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-6 bg-slate-50 dark:bg-slate-900 shadow-lg">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400 mb-3">
              {t('home.quickSettings')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('settings.language')}</span>
                <button
                  onClick={() => i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')}
                  className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200"
                >
                  {i18n.language === 'ja' ? 'EN' : '日本語'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('settings.theme')}</span>
                <button
                  onClick={() => {
                    const themeCycle: Theme[] = ['light', 'dark', 'auto']
                    const currentIndex = themeCycle.indexOf(theme)
                    const next = themeCycle[(currentIndex + 1) % themeCycle.length]
                    setTheme(next)
                  }}
                  className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200"
                >
                  {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '⚡'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-semibold">{t('home.featuresTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.featuresSubtitle')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((featureKey) => (
              <article
                key={featureKey}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400 dark:text-gray-500">
                  {t('home.featureLabel')}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {t(featureKey)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-semibold">{t('home.createdTitle', '作成した旅程')}</h2>
          </div>
          {savedItineraries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('home.noCreated', 'なし')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedItineraries.map((itinerary) => (
                <Link
                  key={itinerary.id}
                  to={`/itinerary/${itinerary.id}`}
                  className="block rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{itinerary.title}</h3>
                  <div className="mt-3 space-y-2">
                    {itinerary.entries.slice(0, 3).map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{entry.icon}</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {entry.location || t('home.noLocation', '場所未設定')}
                        </span>
                        {entry.date && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {entry.date} ({getDayOfWeek(entry.date)})
                          </span>
                        )}
                      </div>
                    ))}
                    {itinerary.entries.length > 3 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        +{itinerary.entries.length - 3} {t('home.moreEntries', 'more')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default HomePage
