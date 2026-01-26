import { FormEvent, useRef, useState, useEffect, Fragment, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import { geocodeAddress } from '../lib/geocoding'
import LocationPreviewMap from '../components/map/LocationPreviewMap'

type StopEntry = {
  date: string
  time: string
  location: string
  coordinates: { lat: number; lng: number } | null
  memo: string
  icon: string
  cost: string
  currency: string
}

const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `(${days[date.getDay()]})`
}

const createEmptyEntry = (): StopEntry => ({
  date: '',
  time: '',
  location: '',
  coordinates: null,
  memo: '',
  icon: '📍',
  cost: '',
  currency: 'JPY'
})

const getAutoEmoji = (location: string): string | null => {
  const lowerLocation = location.toLowerCase()
  const keywords: Record<string, string[]> = {
    '✈️': ['airport', '空港', '飛行場'],
    '🚃': ['station', '駅', 'train', 'railway'],
    '🏨': ['hotel', 'ホテル', 'inn', '旅館', 'hostel'],
    '🍽️': ['restaurant', 'レストラン', 'cafe', 'カフェ', '食堂', 'dining'],
    '⛩️': ['temple', '寺', '神社', 'shrine'],
    '🏯': ['castle', '城'],
    '🏖️': ['beach', 'ビーチ', '海', 'ocean', 'coast'],
    '⛰️': ['mountain', '山', 'mt.', 'peak']
  }

  for (const [emoji, words] of Object.entries(keywords)) {
    if (words.some(word => lowerLocation.includes(word))) {
      return emoji
    }
  }
  return null
}

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 2v4M16 2v4M3 9h18" />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21s6-4.15 6-10a6 6 0 0 0-12 0c0 5.85 6 10 6 10z" />
    <circle cx="12" cy="9" r="2" />
  </svg>
)

function CreateItineraryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPassword, setModalPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [modalError, setModalError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [createdId, setCreatedId] = useState('')
  const formRef = useRef<HTMLFormElement | null>(null)

  const [formData, setFormData] = useState({
    title: ''
  })
  const [entries, setEntries] = useState<StopEntry[]>(() => [createEmptyEntry()])
  const [validationErrors, setValidationErrors] = useState<{ title?: boolean }>({})
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null)
  const [locationSearch, setLocationSearch] = useState('')
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)
  const [geocodingError, setGeocodingError] = useState<string>('')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResultCoords, setSearchResultCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchResultLocation, setSearchResultLocation] = useState<string>('')

  const isEntryModified = (entry: StopEntry): boolean => {
    return (
      entry.date !== '' ||
      entry.time !== '' ||
      entry.location !== '' ||
      entry.memo !== '' ||
      entry.icon !== '📍' ||
      entry.cost !== '' ||
      entry.currency !== 'JPY'
    )
  }

  const uniqueDates = useMemo(() => {
    const dates = entries
      .map(entry => entry.date)
      .filter(Boolean)
      .sort()
    return [...new Set(dates)]
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!selectedDateFilter) return entries
    return entries.filter(entry => entry.date === selectedDateFilter)
  }, [entries, selectedDateFilter])

  const getMinDateForPanel = (index: number): string => {
    for (let i = index - 1; i >= 0; i--) {
      if (entries[i].date) {
        return entries[i].date
      }
    }
    return ''
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastVisible])

  // Auto-search when modal opens with existing location
  useEffect(() => {
    if (locationModalOpen && activeEntryIndex !== null) {
      const currentEntry = entries[activeEntryIndex]
      if (currentEntry.location && currentEntry.location.trim()) {
        // Set the location search value
        setLocationSearch(currentEntry.location)
        setSearchResultLocation(currentEntry.location)
        // Auto-trigger search if coordinates exist
        if (currentEntry.coordinates) {
          setSearchResultCoords(currentEntry.coordinates)
          setHasSearched(true)
        } else {
          // Try to search for the location
          const autoSearch = async () => {
            setIsGeocoding(true)
            setGeocodingError('')
            try {
              const result = await geocodeAddress(currentEntry.location)
              setSearchResultCoords({ lat: result.lat, lng: result.lng })
              setSearchResultLocation(result.formattedAddress)
              setHasSearched(true)
            } catch {
              setGeocodingError(t('create.geocodingFallbackMessage'))
              setSearchResultLocation(currentEntry.location)
              setHasSearched(true)
            } finally {
              setIsGeocoding(false)
            }
          }
          autoSearch()
        }
      }
    }
  }, [locationModalOpen, activeEntryIndex])

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const handleSearchClick = async () => {
    const query = locationSearch.trim()
    if (!query) {
      return
    }

    // Try geocoding
    setIsGeocoding(true)
    setGeocodingError('')
    setSearchResultCoords(null)
    setSearchResultLocation('')
    try {
      const result = await geocodeAddress(query)
      setSearchResultCoords({ lat: result.lat, lng: result.lng })
      setSearchResultLocation(result.formattedAddress)
      setHasSearched(true)
    } catch {
      setGeocodingError(t('create.geocodingFallbackMessage'))
      showToast(t('create.geocodingFailed'))
      setSearchResultLocation(query)
      setHasSearched(true)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleApplyLocation = async () => {
    if (!searchResultLocation || activeEntryIndex === null) {
      return
    }

    const currentEntry = entries[activeEntryIndex]
    const updates: Partial<StopEntry> = {
      location: searchResultLocation,
      coordinates: searchResultCoords
    }

    // Auto-set emoji if current icon is default
    if (currentEntry.icon === '📍') {
      const autoEmoji = getAutoEmoji(searchResultLocation)
      if (autoEmoji) {
        updates.icon = autoEmoji
      }
    }

    updateEntry(activeEntryIndex, updates)

    // Reset modal state
    setLocationModalOpen(false)
    setActiveEntryIndex(null)
    setLocationSearch('')
    setGeocodingError('')
    setHasSearched(false)
    setSearchResultCoords(null)
    setSearchResultLocation('')
  }
  const resetModal = () => {
    setModalPassword('')
    setModalError('')
    setCopyMessage('')
    setShareLink('')
    setCreatedId('')
  }

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()])
  }

  const insertEntryAt = (index: number, dateFilter?: string | null) => {
    const newEntry = createEmptyEntry()
    if (dateFilter) {
      newEntry.date = dateFilter
    }
    setEntries((prev) => [
      ...prev.slice(0, index + 1),
      newEntry,
      ...prev.slice(index + 1)
    ])
  }

  const handleDeleteClick = (index: number) => {
    const entry = entries[index]
    if (isEntryModified(entry)) {
      setDeleteConfirmIndex(index)
    } else {
      deleteEntry(index)
    }
  }

  const deleteEntry = (index: number) => {
    if (entries.length === 1) {
      // Reset the last panel instead of deleting
      setEntries([createEmptyEntry()])
    } else {
      setEntries((prev) => prev.filter((_, i) => i !== index))
    }
    setDeleteConfirmIndex(null)
  }

  const updateEntry = (index: number, updates: Partial<typeof entries[number]>) => {
    setEntries((prev) => {
      const updated = prev.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry))

      // Date auto-inheritance: when setting a date, update subsequent panels if needed
      if (updates.date) {
        const newDate = updates.date
        for (let i = index + 1; i < updated.length; i++) {
          const subsequentDate = updated[i].date
          if (!subsequentDate || subsequentDate < newDate) {
            updated[i] = { ...updated[i], date: newDate }
          } else {
            break
          }
        }
      }

      return updated
    })
  }

  const openModalWithValidation = () => {
    setModalError('')
    setValidationErrors({})

    const errors: { title?: boolean } = {}

    if (!formData.title.trim()) {
      errors.title = true
    }

    if (Object.keys(errors).length > 0 || entries.length === 0) {
      setValidationErrors(errors)
      showToast(t('create.formValidation'))
      return
    }

    if (formRef.current?.reportValidity()) {
      setIsModalOpen(true)
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (modalPassword.length < 2) {
      setModalError(t('create.modalPasswordError'))
      return
    }

    setModalError('')
    setIsSaving(true)

    // Filter out empty panels (no location and no memo)
    const filteredEntries = entries.filter(
      entry => entry.location.trim() || entry.memo.trim()
    )
    const removedCount = entries.length - filteredEntries.length

    try {
      const { id } = await api.createItinerary({
        title: formData.title,
        dateRange: {
          start: new Date(filteredEntries
            .map((entry) => entry.date)
            .filter(Boolean)
            .sort()[0] ?? Date.now()),
          end: new Date(
            filteredEntries
              .map((entry) => entry.date)
              .filter(Boolean)
              .sort()
              .slice(-1)[0] ?? Date.now()
          )
        },
        password: modalPassword
      })

      localStorage.setItem(`auth-${id}`, 'mock-token')

      // Save itinerary to localStorage for home page display
      const savedItineraries = JSON.parse(localStorage.getItem('created-itineraries') || '[]')
      savedItineraries.push({
        id,
        title: formData.title,
        entries: filteredEntries.map(e => ({
          date: e.date,
          time: e.time,
          location: e.location,
          icon: e.icon,
          memo: e.memo,
          cost: e.cost,
          currency: e.currency
        })),
        createdAt: Date.now()
      })
      localStorage.setItem('created-itineraries', JSON.stringify(savedItineraries))

      // Show toast if empty panels were removed
      if (removedCount > 0) {
        showToast(t('create.emptyPanelsRemoved'))
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bokutabi.app'
      setShareLink(`${origin}/itinerary/${id}`)
      setCreatedId(id)
      setCopyMessage('')
    } catch (err) {
      setModalError(err instanceof Error ? err.message : t('create.modalSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareLink) return

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyMessage(t('create.copiedLink'))
    } catch {
      setCopyMessage(t('create.copyFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* Toast notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toastVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-[#FA6868] text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium">
          {toastMessage}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
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
            {t('common.backHome')}
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
        >
          <div className="space-y-1">
            <span className="sr-only">{t('create.tripTitle')}</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                setValidationErrors((prev) => ({ ...prev, title: false }))
              }}
              placeholder={t('create.titlePlaceholder', 'e.g., Tokyo Trip 2024')}
              className={`w-full px-4 py-2 border rounded-2xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#5A9CB5] focus:border-transparent transition-all ${
                validationErrors.title
                  ? 'border-[#FA6868] ring-2 ring-[#FA6868]/30 animate-pulse'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>

          {uniqueDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedDateFilter(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  selectedDateFilter === null
                    ? 'bg-[#5A9CB5] text-white'
                    : 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {t('create.allDates')}
              </button>
              {uniqueDates.map((date) => {
                const d = new Date(date)
                const label = `${d.getMonth() + 1}/${d.getDate()}${getDayOfWeek(date)}`
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDateFilter(date)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                      selectedDateFilter === date
                        ? 'bg-[#5A9CB5] text-white'
                        : 'border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="relative">
            {filteredEntries.length > 1 && (
              <span className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#FACE68] via-[#FAAC68] to-[#FACE68] dark:from-[#FAAC68]/50 dark:via-[#FA6868]/50 dark:to-[#FAAC68]/50" />
            )}
            <div className="relative space-y-6">
            {filteredEntries.map((entry) => {
              const index = entries.indexOf(entry)
              return (
              <Fragment key={`entry-${index}`}>
              <div
                className="relative rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-2 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleDeleteClick(index)}
                  className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition dark:bg-gray-800 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label={t('common.delete')}
                >
                  ×
                </button>
                <div className="space-y-2 pr-6">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiPickerIndex(emojiPickerIndex === index ? null : index)}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-xl hover:border-[#FAAC68] transition dark:border-gray-700 dark:bg-gray-900"
                      >
                        {entry.icon}
                      </button>
                      {emojiPickerIndex === index && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setEmojiPickerIndex(null)}
                          />
                          <div className="absolute top-12 left-0 z-20">
                            <EmojiPicker
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                updateEntry(index, { icon: emojiData.emoji })
                                setEmojiPickerIndex(null)
                              }}
                              theme={isDark ? Theme.DARK : Theme.LIGHT}
                              lazyLoadEmojis={true}
                              width={300}
                              height={350}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <span className="sr-only">{t('create.entryDate')}</span>
                      <div
                        onClick={(e) => {
                          const input = (e.currentTarget as HTMLElement).querySelector('input') as HTMLInputElement | null
                          if (input) {
                            try {
                              input.showPicker()
                            } catch {
                              input.focus()
                            }
                          }
                        }}
                        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-[#5A9CB5] transition dark:border-gray-700 dark:bg-gray-900"
                      >
                        <CalendarIcon className="h-5 w-5 text-[#5A9CB5]" />
                        <input
                          type="date"
                          value={entry.date}
                          min={getMinDateForPanel(index)}
                          onChange={(e) => updateEntry(index, { date: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                        />
                        {entry.date && (
                          <span className="text-sm font-medium text-[#5A9CB5]">
                            {getDayOfWeek(entry.date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <span className="sr-only">{t('create.entryTime')}</span>
                      <div
                        onClick={(e) => {
                          const input = (e.currentTarget as HTMLElement).querySelector('input') as HTMLInputElement | null
                          if (input) {
                            try {
                              input.showPicker()
                            } catch {
                              input.focus()
                            }
                          }
                        }}
                        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-[#5A9CB5] transition dark:border-gray-700 dark:bg-gray-900"
                      >
                        <ClockIcon className="h-5 w-5 text-[#5A9CB5]" />
                        <input
                          type="time"
                          value={entry.time}
                          onChange={(e) => updateEntry(index, { time: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="sr-only">{t('create.entryMemo')}</span>
                    <textarea
                      value={entry.memo}
                      onChange={(e) => updateEntry(index, { memo: e.target.value })}
                      rows={2}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                      placeholder={t('create.entryMemoPlaceholder')}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveEntryIndex(index)
                      setLocationModalOpen(true)
                      setLocationSearch('')
                      setHasSearched(false)
                      setSearchResultCoords(null)
                      setSearchResultLocation('')
                      setGeocodingError('')
                    }}
                    aria-label={t('create.locationButtonLabel', 'Select location')}
                    className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-[#FAAC68] bg-gradient-to-r from-[#FACE68]/20 via-transparent to-[#FAAC68]/20 px-4 py-3 text-xs text-gray-500 transition hover:border-[#FA6868] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FAAC68] dark:border-[#FAAC68] dark:from-[#FAAC68]/20 dark:via-transparent dark:to-[#FA6868]/20 dark:hover:border-[#FA6868]"
                  >
                    <MapPinIcon className="h-5 w-5 text-[#FA6868] dark:text-[#FAAC68]" />
                    <div className="text-left">
                      <p className="text-[0.85rem] font-semibold text-gray-900 dark:text-gray-50">
                        {entry.location || t('create.locationHint')}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="sr-only">{t('create.entryCost')}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={entry.cost}
                        onChange={(e) => updateEntry(index, { cost: e.target.value })}
                        placeholder={t('create.entryCostPlaceholder')}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                    </div>
                    <div className="w-24">
                      <span className="sr-only">{t('create.entryCurrency')}</span>
                      <select
                        value={entry.currency}
                        onChange={(e) => updateEntry(index, { currency: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                      >
                        <option value="JPY">JPY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              {index < entries.length - 1 && (
                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => insertEntryAt(index, selectedDateFilter)}
                    aria-label={t('create.addPanel')}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FAAC68] bg-white text-lg font-bold text-[#FA6868] transition hover:border-[#FA6868] hover:bg-[#FACE68]/20 dark:border-[#FAAC68] dark:bg-gray-900 dark:text-[#FAAC68] shadow-sm"
                  >
                    +
                  </button>
                </div>
              )}
              </Fragment>
              )
            })}
            </div>
          </div>
        </form>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={addEntry}
            aria-label={t('create.addPanel')}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FAAC68] bg-white text-2xl font-bold text-[#FA6868] transition hover:border-[#FA6868] hover:bg-[#FACE68]/20 dark:border-[#FAAC68] dark:bg-gray-900 dark:text-[#FAAC68]"
          >
            +
          </button>
        </div>

      </div>

      {locationModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLocationModalOpen(false)
              setActiveEntryIndex(null)
              setLocationSearch('')
              setHasSearched(false)
              setSearchResultCoords(null)
              setSearchResultLocation('')
              setGeocodingError('')
            }
          }}
        >
          <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">{t('create.locationPickerTitle')}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(false)
                  setActiveEntryIndex(null)
                  setLocationSearch('')
                  setHasSearched(false)
                  setSearchResultCoords(null)
                  setSearchResultLocation('')
                  setGeocodingError('')
                }}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ×
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-gray-400 dark:text-gray-500">🔎</span>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && locationSearch.trim() && !isGeocoding) {
                        handleSearchClick()
                      }
                    }}
                    placeholder={t('create.mapModalSearchPlaceholder')}
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-gray-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchClick}
                  disabled={!locationSearch.trim() || isGeocoding}
                  className="rounded-2xl bg-[#5A9CB5] px-4 py-2 text-sm font-semibold text-white disabled:bg-[#5A9CB5]/50 disabled:opacity-60 hover:bg-[#4a8ca5]"
                >
                  {isGeocoding ? t('create.geocodingInProgress') : t('create.searchButton')}
                </button>
              </div>
              {searchResultCoords ? (
                <LocationPreviewMap
                  lat={searchResultCoords.lat}
                  lng={searchResultCoords.lng}
                  locationName={locationSearch}
                />
              ) : (
                <div className="h-64 md:h-80 lg:h-96 rounded-2xl border border-gray-200 bg-slate-100 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                  {isGeocoding ? (
                    t('create.geocodingInProgress')
                  ) : geocodingError ? (
                    <div className="text-red-600 dark:text-red-400">
                      {geocodingError}
                    </div>
                  ) : (
                    t('create.mapModalMapPlaceholder')
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyLocation}
                  disabled={!hasSearched}
                  className="rounded-2xl bg-[#5A9CB5] px-5 py-2 text-sm font-semibold text-white disabled:bg-[#5A9CB5]/50 disabled:opacity-60 hover:bg-[#4a8ca5]"
                >
                  {isGeocoding ? t('create.geocodingInProgress') : t('create.selectFromSearch')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
              resetModal()
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('create.modalTitle')}</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetModal()
                }}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ×
              </button>
            </div>

            {!shareLink ? (
              <form onSubmit={handleSave} className="space-y-4 mt-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('create.modalDescription')}
                </p>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                    {t('create.modalPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-white dark:text-gray-900"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('create.modalPasswordHint')}
                  </p>
                </div>
                {modalError && (
                  <p className="text-xs text-red-600 dark:text-red-300">{modalError}</p>
                )}
                <button
                  type="submit"
                  disabled={modalPassword.length < 2 || isSaving}
                  className="w-full rounded-2xl bg-[#FA6868] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e85858] disabled:bg-gray-400"
                >
                  {isSaving ? t('common.loading') : t('create.modalSaveButton')}
                </button>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('create.modalSuccessMessage')}
                </p>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-4">
                  <label className="text-xs uppercase tracking-[0.3em] text-gray-500">
                    {t('create.modalShareLabel')}
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      readOnly
                      value={shareLink}
                      className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="rounded-2xl bg-[#5A9CB5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4a8ca5]"
                    >
                      {t('create.copyLink')}
                    </button>
                  </div>
                  {copyMessage && (
                    <p className="text-xs text-[#5A9CB5] dark:text-[#FACE68]">{copyMessage}</p>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">{t('create.modalPasswordLabel')}:</span>{' '}
                    {modalPassword}
                  </p>
                  <button
                    onClick={() => {
                      if (!createdId) return
                      setIsModalOpen(false)
                      navigate(`/itinerary/${createdId}`)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#5A9CB5] px-4 py-2 text-xs font-semibold text-[#5A9CB5] hover:bg-[#5A9CB5]/10 dark:text-[#FACE68] dark:border-[#FACE68] dark:hover:bg-[#FACE68]/10"
                  >
                    {t('create.openItinerary')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirmIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirmIndex(null)
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{t('create.deleteConfirmTitle')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('create.deleteConfirmMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmIndex(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {t('create.deleteConfirmNo')}
              </button>
              <button
                type="button"
                onClick={() => deleteEntry(deleteConfirmIndex)}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
              >
                {t('create.deleteConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed right-6 bottom-8 z-40 flex-col gap-3 ${locationModalOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={() => {
            // Save current state to localStorage for preview
            const previewData = {
              id: 'preview',
              title: formData.title || t('itinerary.untitled'),
              entries: entries.filter(e => e.location.trim() || e.memo.trim()).map(e => ({
                date: e.date,
                time: e.time,
                location: e.location,
                icon: e.icon,
                memo: e.memo,
                cost: e.cost,
                currency: e.currency,
                coordinates: e.coordinates
              }))
            }
            localStorage.setItem('preview-itinerary', JSON.stringify(previewData))
            navigate('/preview')
          }}
          className="rounded-full bg-[#5A9CB5] px-4 py-2 text-white shadow-lg transition hover:shadow-2xl hover:bg-[#4a8ca5] whitespace-nowrap text-xs font-semibold"
        >
          {t('create.previewButton')}
        </button>
        <button
          onClick={openModalWithValidation}
          className="group relative h-14 w-14 rounded-full bg-[#FA6868] text-white shadow-lg transition hover:shadow-2xl hover:bg-[#e85858]"
        >
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
            {t('create.floatSave')}
          </span>
        </button>
      </div>
    </div>
  )
}

export default CreateItineraryPage
