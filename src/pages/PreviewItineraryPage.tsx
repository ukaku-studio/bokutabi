import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

type PreviewEntry = {
  date: string
  time: string
  location: string
  icon: string
  memo: string
  cost: string
  currency: string
  coordinates?: { lat: number; lng: number } | null
}

type PreviewData = {
  id: string
  title: string
  entries: PreviewEntry[]
}

const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

const formatCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function PreviewItineraryPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load from localStorage (for preview before save)
    const tempData = localStorage.getItem('preview-itinerary')
    if (tempData) {
      try {
        const parsed = JSON.parse(tempData)
        setPreviewData(parsed)
      } catch {
        // Failed to parse
      }
    }

    // Also try to load from saved itineraries if we have an ID
    if (id) {
      const saved = localStorage.getItem('created-itineraries')
      if (saved) {
        const itineraries = JSON.parse(saved)
        const found = itineraries.find((i: PreviewData) => i.id === id)
        if (found) {
          setPreviewData(found)
        }
      }
    }

    setLoading(false)
  }, [id])

  const groupedByDate = useMemo(() => {
    if (!previewData) return {}
    return previewData.entries.reduce((acc, entry) => {
      const dateKey = entry.date || 'unscheduled'
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(entry)
      return acc
    }, {} as Record<string, PreviewEntry[]>)
  }, [previewData])

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => {
      if (a === 'unscheduled') return 1
      if (b === 'unscheduled') return -1
      return a.localeCompare(b)
    })
  }, [groupedByDate])

  const totalCosts = useMemo(() => {
    if (!previewData) return {}
    return previewData.entries.reduce((acc, entry) => {
      if (entry.cost && parseFloat(entry.cost) > 0) {
        const currency = entry.currency || 'JPY'
        acc[currency] = (acc[currency] || 0) + parseFloat(entry.cost)
      }
      return acc
    }, {} as Record<string, number>)
  }, [previewData])

  const formatEntryDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()} (${getDayOfWeek(dateString)})`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">{t('itinerary.notFound')}</p>
          <Link
            to="/create"
            className="inline-block px-4 py-2 rounded-full bg-[#5A9CB5] text-white text-sm font-semibold"
          >
            {t('preview.backToEdit')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('preview.backToEdit')}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/create?save=1')}
                className="rounded-full bg-[#5A9CB5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a8ca5]"
              >
                {t('preview.saveButton')}
              </button>
            </div>
          </div>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold">{previewData.title}</h1>
        </header>

        {Object.keys(totalCosts).length > 0 && (
          <section className="mb-8 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t('preview.totalCost')}
            </h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(totalCosts).map(([currency, amount]) => (
                <span key={currency} className="text-xl font-bold text-[#5A9CB5]">
                  {formatCurrency(amount, currency)}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          {sortedDates.map((dateKey) => {
            const entries = groupedByDate[dateKey]
            const isUnscheduled = dateKey === 'unscheduled'
            const dateLabel = isUnscheduled
              ? t('preview.dateUnscheduled')
              : formatEntryDate(dateKey)

            return (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-lg md:text-xl font-semibold tracking-wide text-[#5A9CB5] dark:text-[#FACE68]">
                  {dateLabel}
                </h3>
                <div className="space-y-3">
                  {entries.map((entry, idx) => (
                    <article
                      key={idx}
                      className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
                    >
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {entry.time ||
                          (entry.date ? formatEntryDate(entry.date) : t('preview.dateUnscheduled'))}
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{entry.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold truncate">
                            {entry.location || t('home.noLocation')}
                          </h4>
                          {entry.memo && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {entry.memo}
                            </p>
                          )}
                          {entry.cost && parseFloat(entry.cost) > 0 && (
                            <p className="mt-2 text-sm font-semibold text-[#FA6868]">
                              {formatCurrency(parseFloat(entry.cost), entry.currency || 'JPY')}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        {previewData.entries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('itinerary.noItems')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PreviewItineraryPage
