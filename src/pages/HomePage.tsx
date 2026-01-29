import { Link, useNavigate } from 'react-router-dom'
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
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('created-itineraries')
    if (stored) {
      setSavedItineraries(JSON.parse(stored))
    }
  }, [])

  const handleCreateClick = () => {
    const draft = localStorage.getItem('preview-itinerary')
    if (draft) {
      setRestoreModalOpen(true)
      return
    }
    navigate('/create')
  }

  const handleRestoreYes = () => {
    setRestoreModalOpen(false)
    navigate('/create')
  }

  const handleRestoreNo = () => {
    localStorage.removeItem('preview-itinerary')
    setRestoreModalOpen(false)
    navigate('/create')
  }

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
              <button
                type="button"
                onClick={handleCreateClick}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FA6868] to-[#FAAC68] text-white font-semibold text-sm hover:opacity-90 transition"
              >
                {t('home.createButton')}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-6 bg-slate-50 dark:bg-slate-900 shadow-lg">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400 mb-3">
              {t('home.quickSettings')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('settings.language')}</span>
                <div className="flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-3 py-1 text-sm transition ${
                      i18n.language === 'en'
                        ? 'bg-[#5A9CB5] text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('ja')}
                    className={`px-3 py-1 text-sm transition ${
                      i18n.language === 'ja'
                        ? 'bg-[#5A9CB5] text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    日本語
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t('settings.theme')}</span>
                <div className="flex rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 text-sm transition ${
                      theme === 'light'
                        ? 'bg-[#5A9CB5] text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                      {t('settings.light')}
                    </span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 text-sm transition ${
                      theme === 'dark'
                        ? 'bg-[#5A9CB5] text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                      </svg>
                      {t('settings.dark')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

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

      {restoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRestoreModalOpen(false)
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{t('home.restoreDraftTitle')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('home.restoreDraftMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleRestoreNo}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {t('home.restoreDraftNo')}
              </button>
              <button
                type="button"
                onClick={handleRestoreYes}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5A9CB5] rounded-full hover:bg-[#4a8ca5]"
              >
                {t('home.restoreDraftYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
