import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { ja } from 'date-fns/locale/ja'
import { Timestamp } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import ItineraryMap from '../components/map/ItineraryMap'
import { api } from '../lib/api'
import type { Itinerary, ItineraryItem } from '../types/itinerary'

type TravelMode = Exclude<ItineraryItem['travelMode'], null>

type ItemForm = {
  title: string
  location: string
  date: string
  time: string
  notes: string
  cost: string
  currency: string
  duration: string
  travelMode: TravelMode
}

type FormFeedback = {
  type: 'success' | 'error'
  text: string
}

const localeForLanguage = (language: string) => {
  return language.startsWith('ja') ? ja : enUS
}

const formatCurrency = (amount: number, currency: string, locale: string) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

const groupItemsByDay = (items: ItineraryItem[]) => {
  return items
    .slice()
    .sort((a, b) => {
      const aTime = a.date.toMillis()
      const bTime = b.date.toMillis()
      if (aTime !== bTime) {
        return aTime - bTime
      }
      return (a.order ?? 0) - (b.order ?? 0)
    })
    .reduce((acc, item) => {
      const dayKey = item.date.toDate().toISOString().split('T')[0]
      if (!acc[dayKey]) {
        acc[dayKey] = []
      }
      acc[dayKey].push(item)
      return acc
    }, {} as Record<string, ItineraryItem[]>)
}

const travelModes: TravelMode[] = ['walking', 'transit', 'driving']

const defaultFormState: ItemForm = {
  title: '',
  location: '',
  date: '',
  time: '',
  notes: '',
  cost: '',
  currency: 'JPY',
  duration: '',
  travelMode: 'walking'
}

const formatDateISO = (iso: string) => iso.split('T')[0]

function ItineraryPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [formFeedback, setFormFeedback] = useState<FormFeedback | null>(null)
  const [newItemForm, setNewItemForm] = useState<ItemForm>(defaultFormState)
  const [editForm, setEditForm] = useState<ItemForm>(defaultFormState)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mapDayFilter, setMapDayFilter] = useState<string | null>(null)
  const [mapSelectedItemId, setMapSelectedItemId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    if (!id) {
      setLoading(false)
      return
    }

    setCopyMessage('')
    setError('')
    setLoading(true)

    Promise.all([api.getItinerary(id), api.getItineraryItems(id)])
      .then(([itineraryData, itineraryItems]) => {
        if (!isMounted) {
          return
        }

        if (!itineraryData) {
          setError(t('itinerary.notFound', 'Itinerary not found'))
          return
        }

        setItinerary(itineraryData)
        setItems(itineraryItems)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }
        setError(t('itinerary.loadError', 'Unable to load itinerary data'))
      })
      .finally(() => {
        if (!isMounted) {
          return
        }
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id, t])

  useEffect(() => {
    if (itinerary) {
      const startIso = formatDateISO(itinerary.dateRange.start.toDate().toISOString())
      setNewItemForm((prev) => ({
        ...prev,
        date: prev.date || startIso
      }))
    }
  }, [itinerary])

  const groupedItems = useMemo(() => groupItemsByDay(items), [items])
  const dayKeys = useMemo(() => Object.keys(groupedItems), [groupedItems])
  const locale = useMemo(() => localeForLanguage(i18n.language || 'en'), [i18n.language])
  const startDate = itinerary?.dateRange.start.toDate()
  const endDate = itinerary?.dateRange.end.toDate()
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/itinerary/${id}`
      : `https://bokutabi.app/itinerary/${id}`

  const mapItems = useMemo(() => {
    const source = mapDayFilter ? groupedItems[mapDayFilter] ?? [] : items
    return source.filter((item) => Boolean(item.coordinates?.lat && item.coordinates?.lng))
  }, [groupedItems, items, mapDayFilter])

  const mapSelectedItem = items.find((item) => item.id === mapSelectedItemId) ?? null

  const aiSuggestion = useMemo(() => {
    const withTravel = items.find((item) => item.travelTimeToNext && item.travelMode !== null)
    if (withTravel) {
      return {
        type: 'travel' as const,
        title: withTravel.title,
        minutes: withTravel.travelTimeToNext as number,
        mode: withTravel.travelMode
      }
    }

    const withDuration = items.find((item) => item.estimatedDuration)
    if (withDuration) {
      return {
        type: 'duration' as const,
        title: withDuration.title,
        minutes: withDuration.estimatedDuration as number
      }
    }

    return null
  }, [items])

  useEffect(() => {
    if (mapSelectedItemId && !mapItems.some((item) => item.id === mapSelectedItemId)) {
      setMapSelectedItemId(null)
    }
  }, [mapItems, mapSelectedItemId])

  const handleMapDayChange = (day: string | null) => {
    setMapDayFilter(day)
    setMapSelectedItemId(null)
  }

  const costSummary = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.cost) {
        return acc
      }
      const { amount, currency } = item.cost
      acc[currency] = (acc[currency] ?? 0) + amount
      return acc
    }, {} as Record<string, number>)
  }, [items])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyMessage(t('itinerary.copiedLink', 'Link copied to clipboard'))
    } catch {
      setCopyMessage(t('itinerary.copyFailed', 'Unable to copy link'))
    }
  }

  const clearFormFeedback = () => setFormFeedback(null)

  const updateNewFormField = (field: keyof ItemForm, value: string) => {
    setNewItemForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const updateEditFormField = (field: keyof ItemForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!itinerary) {
      return
    }

    clearFormFeedback()
    setIsAdding(true)

    try {
      const isoDate =
        newItemForm.date || formatDateISO(itinerary.dateRange.start.toDate().toISOString())
      const timestamp = Timestamp.fromDate(new Date(isoDate))
      const newItem: ItineraryItem = {
        id: `local-${Date.now()}`,
        date: timestamp,
        time: newItemForm.time || null,
        title: newItemForm.title || t('itinerary.untitled', 'Untitled place'),
        location: newItemForm.location,
        address: newItemForm.location,
        coordinates: null,
        cost: newItemForm.cost
          ? { amount: Number(newItemForm.cost), currency: newItemForm.currency }
          : null,
        notes: newItemForm.notes,
        order: items.length,
        estimatedDuration: newItemForm.duration ? Number(newItemForm.duration) : null,
        travelTimeToNext: null,
        travelMode: newItemForm.travelMode,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      }

      setItems((prev) => [...prev, newItem])
      await api.addItineraryItem(itinerary.id, newItem)

      setFormFeedback({ type: 'success', text: t('itinerary.addSuccess') })
      setNewItemForm((prev) => ({
        ...prev,
        title: '',
        location: '',
        time: '',
        notes: '',
        cost: '',
        duration: ''
      }))
    } catch {
      setFormFeedback({ type: 'error', text: t('itinerary.addFailure') })
    } finally {
      setIsAdding(false)
    }
  }

  const startEditingItem = (item: ItineraryItem) => {
    setEditItemId(item.id)
    setEditForm({
      title: item.title,
      location: item.location,
      date: item.date.toDate().toISOString().split('T')[0],
      time: item.time ?? '',
      notes: item.notes,
      cost: item.cost?.amount ? String(item.cost.amount) : '',
      currency: item.cost?.currency ?? 'JPY',
      duration: item.estimatedDuration ? String(item.estimatedDuration) : '',
      travelMode: item.travelMode ?? 'walking'
    })
    clearFormFeedback()
  }

  const handleUpdateItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!itinerary || !editItemId) {
      return
    }

    const existingItem = items.find((item) => item.id === editItemId)
    if (!existingItem) {
      setFormFeedback({ type: 'error', text: t('itinerary.updateFailure') })
      return
    }

    clearFormFeedback()
    setIsUpdating(true)

    try {
      const isoDate = editForm.date || existingItem.date.toDate().toISOString()
      const updatedItem: ItineraryItem = {
        ...existingItem,
        title: editForm.title || existingItem.title,
        location: editForm.location || existingItem.location,
        date: Timestamp.fromDate(new Date(isoDate)),
        time: editForm.time || null,
        notes: editForm.notes,
        cost: editForm.cost
          ? { amount: Number(editForm.cost), currency: editForm.currency }
          : null,
        estimatedDuration: editForm.duration ? Number(editForm.duration) : null,
        travelMode: editForm.travelMode,
        updatedAt: Timestamp.fromDate(new Date())
      }

      setItems((prev) => prev.map((item) => (item.id === editItemId ? updatedItem : item)))
      await api.updateItineraryItem(itinerary.id, editItemId, updatedItem)

      setFormFeedback({ type: 'success', text: t('itinerary.updateSuccess') })
      setEditItemId(null)
    } catch {
      setFormFeedback({ type: 'error', text: t('itinerary.updateFailure') })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditItemId(null)
    clearFormFeedback()
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!itinerary) {
      return
    }

    clearFormFeedback()
    setDeletingId(itemId)

    try {
      await api.deleteItineraryItem(itinerary.id, itemId)
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      setFormFeedback({ type: 'success', text: t('itinerary.deleteSuccess') })
      if (editItemId === itemId) {
        setEditItemId(null)
      }
    } catch {
      setFormFeedback({ type: 'error', text: t('itinerary.deleteFailure') })
    } finally {
      setDeletingId(null)
    }
  }

  const renderItems = () => {
    if (dayKeys.length === 0) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('itinerary.noItems')}</p>
      )
    }

    return (
      <div className="space-y-6">
        {dayKeys.map((dayKey) => {
          const dayItems = groupedItems[dayKey]
          const parsedDate = parseISO(dayKey)
          const dayLabel = format(parsedDate, 'EEEE, MMM d', { locale })

          return (
            <div key={dayKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  {dayLabel}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('itinerary.itemsCount', { count: dayItems.length })}
                </span>
              </div>
              <div className="space-y-4">
                {dayItems.map((item) => {
                  const travelModeKey = item.travelMode
                    ? `itinerary.mode.${item.travelMode}`
                    : 'itinerary.mode.walking'
                  const fallbackMode = travelModeKey.split('.').pop() ?? ''
                  const travelModeLabel = t(travelModeKey, { defaultValue: fallbackMode })

                  return (
                    <article
                      key={item.id}
                      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {item.time ?? t('itinerary.timeTBD', 'Time TBD')}
                          </p>
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.location}</p>
                        </div>
                        {item.cost && (
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-300 whitespace-nowrap">
                            {formatCurrency(item.cost.amount, item.cost.currency, i18n.language)}
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {item.estimatedDuration && (
                          <span className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1">
                            {t('itinerary.estimatedDuration', {
                              minutes: item.estimatedDuration
                            })}
                          </span>
                        )}
                        {item.travelTimeToNext && (
                          <span className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1">
                            {t('itinerary.travelTime', {
                              minutes: item.travelTimeToNext,
                              mode: travelModeLabel
                            })}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingItem(item)}
                          className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline dark:text-blue-300"
                        >
                          {t('itinerary.actions.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-xs font-semibold uppercase tracking-wide text-red-600 hover:underline dark:text-red-400 disabled:text-red-300"
                          disabled={deletingId === item.id}
                        >
                          {t('itinerary.actions.delete')}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-50">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">
            {itinerary ? itinerary.title : t('itinerary.loadingTitle', 'Itinerary')}
          </h1>
          <div className="flex items-center gap-4">
            {id && localStorage.getItem(`auth-${id}`) && (
              <Link
                to={`/create?edit=${id}`}
                className="px-4 py-2 rounded-full bg-[#5A9CB5] text-white text-sm font-semibold hover:bg-[#4a8ca5]"
              >
                {t('itinerary.editButton')}
              </Link>
            )}
            <Link
              to="/"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-300"
            >
              ← {t('common.backHome')}
            </Link>
          </div>
        </div>
        {isOffline && (
          <div className="rounded-2xl border border-orange-300 bg-orange-50 dark:bg-orange-900/40 dark:border-orange-700 p-3 text-sm font-semibold text-orange-800 dark:text-orange-200">
            {t('itinerary.offlineBanner')}
          </div>
        )}

        {loading && (
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {itinerary && !loading && (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('itinerary.dateRange')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {startDate && endDate
                      ? `${format(startDate, 'PPP', { locale })} — ${format(endDate, 'PPP', {
                          locale
                        })}`
                      : t('itinerary.datePending')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/create"
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t('itinerary.addPlace')}
                  </Link>
                  <button
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    type="button"
                  >
                    {t('itinerary.viewMap')}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {Object.entries(costSummary).length === 0 ? (
                  <span>{t('itinerary.noCost')}</span>
                ) : (
                  Object.entries(costSummary).map(([currency, amount]) => (
                    <span key={currency} className="font-medium">
                      {t('itinerary.totalCost', {
                        cost: formatCurrency(amount, currency, i18n.language)
                      })}
                    </span>
                  ))
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-dashed border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-pink-500/10" />
                <div className="relative space-y-3">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                    {t('itinerary.shareTitle')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                    {t('itinerary.shareDescription')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 min-w-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-xs text-gray-600 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      {t('itinerary.copyLink')}
                    </button>
                  </div>
                  {copyMessage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{copyMessage}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('itinerary.passwordHint')}
                  </p>
                  <Link
                    to={`/itinerary/${id}/auth`}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                  >
                    {t('itinerary.needPassword')}
                  </Link>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{t('itinerary.mapTitle')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('itinerary.mapSubtitle')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleMapDayChange(null)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                      mapDayFilter === null
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t('itinerary.mapFilterAll')}
                  </button>
                  {dayKeys.map((dayKey) => {
                    const label = format(parseISO(dayKey), 'MMM d', { locale })
                    return (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => handleMapDayChange(dayKey)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                          mapDayFilter === dayKey
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </header>
              <div className="space-y-3">
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                  {mapItems.length ? (
                    <ItineraryMap
                      items={mapItems}
                      selectedItemId={mapSelectedItemId}
                      onMarkerClick={(item) => setMapSelectedItemId(item?.id ?? null)}
                    />
                  ) : (
                    <div className="h-72 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      {t('itinerary.mapNoCoordinates')}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-gray-500 dark:text-gray-400">
                  {mapSelectedItem ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.4em] text-blue-600 dark:text-blue-300">
                        {t('itinerary.mapSelectionTitle')}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                        {mapSelectedItem.title}
                      </p>
                      <p>{mapSelectedItem.location}</p>
                      <p>
                        {mapSelectedItem.time ?? t('itinerary.timeTBD')} •{' '}
                        {mapSelectedItem.cost
                          ? formatCurrency(
                              mapSelectedItem.cost.amount,
                              mapSelectedItem.cost.currency,
                              i18n.language
                            )
                          : t('itinerary.noCost')}
                      </p>
                      {mapSelectedItem.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {mapSelectedItem.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>{t('itinerary.mapSelectHint')}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
                      {t('itinerary.aiTitle')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('itinerary.aiSubtitle')}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                    AI
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  {aiSuggestion ? (
                    aiSuggestion.type === 'travel' ? (
                      <p>
                        {t('itinerary.aiTravelHint', {
                          from: aiSuggestion.title,
                          minutes: aiSuggestion.minutes,
                          mode: t(`itinerary.mode.${aiSuggestion.mode}`) ?? aiSuggestion.mode
                        })}
                      </p>
                    ) : (
                      <p>
                        {t('itinerary.aiDurationHint', {
                          title: aiSuggestion.title,
                          minutes: aiSuggestion.minutes
                        })}
                      </p>
                    )
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('itinerary.aiFallback')}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">{t('itinerary.addSectionTitle')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('itinerary.addSectionSubtitle')}
                </p>
              </header>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
                      {t('itinerary.addFormTitle')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('itinerary.addFormSubtitle')}
                    </p>
                  </div>
                  <form onSubmit={handleAddItem} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('itinerary.addFieldTitle')}
                      </label>
                      <input
                        required
                        value={newItemForm.title}
                        onChange={(e) => updateNewFormField('title', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('itinerary.addFieldLocation')}
                      </label>
                      <input
                        required
                        value={newItemForm.location}
                        onChange={(e) => updateNewFormField('location', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldDate')}
                        </label>
                        <input
                          type="date"
                          value={newItemForm.date}
                          onChange={(e) => updateNewFormField('date', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldTime')}
                        </label>
                        <input
                          type="time"
                          value={newItemForm.time}
                          onChange={(e) => updateNewFormField('time', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldCost')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newItemForm.cost}
                          onChange={(e) => updateNewFormField('cost', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldCurrency')}
                        </label>
                        <select
                          value={newItemForm.currency}
                          onChange={(e) => updateNewFormField('currency', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        >
                          <option value="JPY">JPY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('itinerary.addFieldDuration')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItemForm.duration}
                        onChange={(e) => updateNewFormField('duration', e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('itinerary.addFieldTravelMode')}
                      </label>
                      <select
                        value={newItemForm.travelMode}
                        onChange={(e) =>
                          updateNewFormField('travelMode', e.target.value as TravelMode)
                        }
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                      >
                        {travelModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {t(`itinerary.mode.${mode}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {t('itinerary.addFieldNotes')}
                      </label>
                      <textarea
                        value={newItemForm.notes}
                        onChange={(e) => updateNewFormField('notes', e.target.value)}
                        className="mt-1 h-24 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!itinerary || isAdding}
                      className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isAdding ? t('common.loading') : t('itinerary.formAddButton')}
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4 shadow">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
                      {t('itinerary.editSectionTitle')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('itinerary.editSectionSubtitle')}
                    </p>
                  </div>
                  {editItemId ? (
                    <form onSubmit={handleUpdateItem} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldTitle')}
                        </label>
                        <input
                          required
                          value={editForm.title}
                          onChange={(e) => updateEditFormField('title', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldLocation')}
                        </label>
                        <input
                          required
                          value={editForm.location}
                          onChange={(e) => updateEditFormField('location', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('itinerary.addFieldDate')}
                          </label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => updateEditFormField('date', e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('itinerary.addFieldTime')}
                          </label>
                          <input
                            type="time"
                            value={editForm.time}
                            onChange={(e) => updateEditFormField('time', e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('itinerary.addFieldCost')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.cost}
                            onChange={(e) => updateEditFormField('cost', e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('itinerary.addFieldCurrency')}
                          </label>
                          <select
                            value={editForm.currency}
                            onChange={(e) => updateEditFormField('currency', e.target.value)}
                            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                          >
                            <option value="JPY">JPY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldDuration')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.duration}
                          onChange={(e) => updateEditFormField('duration', e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldTravelMode')}
                        </label>
                        <select
                          value={editForm.travelMode}
                          onChange={(e) =>
                            updateEditFormField('travelMode', e.target.value as TravelMode)
                          }
                          className="mt-1 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        >
                          {travelModes.map((mode) => (
                            <option key={mode} value={mode}>
                              {t(`itinerary.mode.${mode}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t('itinerary.addFieldNotes')}
                        </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => updateEditFormField('notes', e.target.value)}
                          className="mt-1 h-24 w-full rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-50"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {isUpdating ? t('common.loading') : t('itinerary.formUpdateButton')}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-50"
                        >
                          {t('itinerary.formCancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                        {t('itinerary.editPlaceholderTitle')}
                      </p>
                      <p>{t('itinerary.editPlaceholderBody')}</p>
                    </div>
                  )}
                </div>
              </div>
              {formFeedback && (
                <p
                  className={`text-sm ${
                    formFeedback.type === 'success'
                      ? 'text-green-600 dark:text-green-300'
                      : 'text-red-600 dark:text-red-300'
                  }`}
                >
                  {formFeedback.text}
                </p>
              )}
            </section>

            <section className="space-y-6">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">{t('itinerary.itemsTitle')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('itinerary.itemsHint')}
                </p>
              </header>
              {renderItems()}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default ItineraryPage
