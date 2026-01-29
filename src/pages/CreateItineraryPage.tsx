import { FormEvent, useRef, useState, useEffect, Fragment, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

type TravelMode = 'walking' | 'transit' | 'driving'

type TravelSuggestion = {
  mode: TravelMode
  durationMinutes: number
}

const getDayOfWeek = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `(${days[date.getDay()]})`
}

const parseTimeToMinutes = (time: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

const formatTimeFromMinutes = (minutes: number): string => {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

const addDaysToDate = (dateString: string, dayOffset: number): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return ''
  }
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + dayOffset)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

const getMockTravelSuggestions = (from: string, to: string): TravelSuggestion[] => {
  const seed = `${from}::${to}`
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000
  }
  const baseMinutes = 30 + (hash % 61)
  return [
    { mode: 'walking', durationMinutes: baseMinutes + 30 },
    { mode: 'transit', durationMinutes: baseMinutes },
    { mode: 'driving', durationMinutes: Math.max(15, baseMinutes - 15) }
  ]
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

const normalizeEntry = (entry: Partial<StopEntry>): StopEntry => ({
  date: entry.date ?? '',
  time: entry.time ?? '',
  location: entry.location ?? '',
  coordinates: entry.coordinates ?? null,
  memo: entry.memo ?? '',
  icon: entry.icon ?? '📍',
  cost: entry.cost ?? '',
  currency: entry.currency ?? 'JPY'
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

  const splitLocationDisplay = (displayName: string): { name: string; address: string } => {
    if (!displayName) {
      return { name: '', address: '' }
    }
    const parts = displayName
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
    if (parts.length <= 1) {
      return { name: displayName.trim(), address: '' }
    }
    return { name: parts[0], address: parts.slice(1).join(', ') }
  }

const shouldShowAddress = (displayName: string): boolean => {
  if (!displayName) return false
  const parts = displayName
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
  return parts.length <= 1
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useTheme()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPassword, setModalPassword] = useState('')
  const [showModalPassword, setShowModalPassword] = useState(false)
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
  const [selectedSuggestionByEntry, setSelectedSuggestionByEntry] = useState<Record<number, string>>({})
  const [pendingSaveOpen, setPendingSaveOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResultCoords, setSearchResultCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchResultLocation, setSearchResultLocation] = useState<string>('')
  const locationDisplay = useMemo(
    () => splitLocationDisplay(searchResultLocation),
    [searchResultLocation]
  )
  const locationDisplayName = locationDisplay.name || locationSearch
  const locationDisplayAddress = locationDisplay.address
  const showLocationAddress = shouldShowAddress(searchResultLocation) && !!locationDisplayAddress

  const normalizeLanguage = (language: string | undefined) => {
    if (!language) return ''
    const normalized = language.split(',')[0].trim()
    if (normalized.toLowerCase().startsWith('ja')) return 'ja'
    if (normalized.toLowerCase().startsWith('en')) return 'en'
    return 'en'
  }

  const getPreferredLanguage = () => {
    if (i18n.language) {
      return normalizeLanguage(i18n.language)
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return normalizeLanguage(navigator.language)
    }
    return 'ja'
  }

  const getFallbackLanguages = (primary: string) => {
    if (primary.startsWith('ja')) {
      return ['en']
    }
    return ['ja']
  }

  const geocodeWithFallback = async (query: string) => {
    const primary = getPreferredLanguage()
    try {
      return await geocodeAddress(query, primary)
    } catch {
      const fallbacks = getFallbackLanguages(primary)
      for (const language of fallbacks) {
        try {
          return await geocodeAddress(query, language)
        } catch {
          // try next fallback
        }
      }
      return await geocodeAddress(query)
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return t('create.travelSuggestionDurationHourMinute', { hours, minutes: mins })
    }
    return t('create.travelSuggestionDurationMinutes', { minutes })
  }

  const getSuggestionKey = (suggestion: TravelSuggestion) =>
    `${suggestion.mode}-${suggestion.durationMinutes}`

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

  const hasEmptyEntry = useMemo(
    () => entries.some(entry => !isEntryModified(entry)),
    [entries]
  )
  const canAddEntry = !hasEmptyEntry

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

  // Restore draft from preview storage when returning from preview
  useEffect(() => {
    const isDefaultState =
      formData.title.trim() === '' && entries.every(entry => !isEntryModified(entry))
    if (!isDefaultState) return

    const draft = localStorage.getItem('preview-itinerary')
    if (!draft) return

    try {
      const parsed = JSON.parse(draft)
      if (!parsed || !Array.isArray(parsed.entries)) return

      setFormData({ title: typeof parsed.title === 'string' ? parsed.title : '' })
      setEntries(parsed.entries.map((entry: Partial<StopEntry>) => normalizeEntry(entry)))
    } catch {
      // ignore draft parse errors
    }
  }, [entries, formData.title])

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

  // Keep only one empty panel at a time
  useEffect(() => {
    const emptyIndices = entries
      .map((entry, idx) => (!isEntryModified(entry) ? idx : -1))
      .filter(idx => idx >= 0)

    if (emptyIndices.length <= 1) return

    const keepIndex = emptyIndices[emptyIndices.length - 1]
    setEntries((prev) =>
      prev.filter((entry, idx) => !(idx !== keepIndex && !isEntryModified(entry)))
    )
    setSelectedSuggestionByEntry({})
  }, [entries])

  // Auto-search when modal opens with existing location
  useEffect(() => {
    if (locationModalOpen && activeEntryIndex !== null) {
      const currentEntry = entries[activeEntryIndex]
      if (currentEntry.location && currentEntry.location.trim()) {
        // Set the location search value to official name when available
        const officialName = splitLocationDisplay(currentEntry.location).name || currentEntry.location
        setLocationSearch(officialName)
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
              const result = await geocodeWithFallback(currentEntry.location)
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

  const savePreviewAndNavigate = () => {
    const previewData = {
      id: 'preview',
      title: formData.title,
      entries: entries.map(e => ({
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
  }

  const openPreviewWithValidation = () => {
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
      savePreviewAndNavigate()
    }
  }

  const showEmptyPanelToast = () => {
    showToast(t('create.emptyPanelExists'))
  }

  const showPreviewDisabledToast = () => {
    showToast(t('create.previewRequiresTitle'))
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
      const result = await geocodeWithFallback(query)
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
    setShowModalPassword(false)
    setModalError('')
    setCopyMessage('')
    setShareLink('')
    setCreatedId('')
  }

  const addEntry = () => {
    setEntries((prev) => {
      const lastEntry = prev[prev.length - 1]
      const newEntry = createEmptyEntry()
      if (lastEntry?.date) {
        newEntry.date = lastEntry.date
      }
      return [...prev, newEntry]
    })
  }

  const shiftSelectedSuggestions = (startIndex: number, offset: number, removeIndex?: number) => {
    setSelectedSuggestionByEntry((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const idx = Number(key)
        if (removeIndex !== undefined && idx === removeIndex) return
        const newIndex = idx > startIndex ? idx + offset : idx
        if (newIndex >= 0) {
          next[newIndex] = value
        }
      })
      return next
    })
  }

  const insertEntryAt = (index: number, dateFilter?: string | null) => {
    const newEntry = createEmptyEntry()
    if (dateFilter) {
      newEntry.date = dateFilter
    } else if (entries[index]?.date) {
      newEntry.date = entries[index].date
    }
    shiftSelectedSuggestions(index, 1)
    setEntries((prev) => [
      ...prev.slice(0, index + 1),
      newEntry,
      ...prev.slice(index + 1)
    ])
  }

  const handleAddEntryClick = () => {
    if (!canAddEntry) {
      showEmptyPanelToast()
      return
    }
    addEntry()
  }

  const handleInsertEntryClick = (index: number) => {
    if (!canAddEntry) {
      showEmptyPanelToast()
      return
    }
    insertEntryAt(index, selectedDateFilter)
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
      setSelectedSuggestionByEntry({})
    } else {
      setEntries((prev) => prev.filter((_, i) => i !== index))
      shiftSelectedSuggestions(index, -1, index)
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

  const updateEntryWithoutDateCascade = (index: number, updates: Partial<typeof entries[number]>) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry)))
  }

  const getSuggestedArrival = (baseTime: string, durationMinutes: number) => {
    const baseMinutes = parseTimeToMinutes(baseTime)
    if (baseMinutes === null) return null
    const totalMinutes = baseMinutes + durationMinutes
    const dayOffset = Math.floor(totalMinutes / 1440)
    const time = formatTimeFromMinutes(totalMinutes)
    return { time, dayOffset }
  }

  const applySuggestionToEntry = (index: number, suggestion: TravelSuggestion) => {
    const currentEntry = entries[index]
    const previousEntry = entries[index - 1]
    if (!currentEntry || !previousEntry) return

    if (currentEntry.time.trim()) {
      const shouldOverwrite = window.confirm(t('create.travelSuggestionConfirm'))
      if (!shouldOverwrite) return
    }

    const arrival = getSuggestedArrival(previousEntry.time, suggestion.durationMinutes)
    if (!arrival) return

    const updates: Partial<StopEntry> = { time: arrival.time }
    const baseDate = previousEntry.date || currentEntry.date
    if (baseDate) {
      if (arrival.dayOffset > 0) {
        const nextDate = addDaysToDate(baseDate, arrival.dayOffset)
        if (nextDate) {
          updates.date = nextDate
        }
      } else if (!currentEntry.date) {
        updates.date = baseDate
      }
    }

    updateEntryWithoutDateCascade(index, updates)
    setSelectedSuggestionByEntry((prev) => ({
      ...prev,
      [index]: getSuggestionKey(suggestion)
    }))
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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('save') === '1') {
      params.delete('save')
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : ''
        },
        { replace: true }
      )
      setPendingSaveOpen(true)
    }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!pendingSaveOpen) return
    const hasContent =
      formData.title.trim() !== '' || entries.some(entry => isEntryModified(entry))
    if (!hasContent) return
    openModalWithValidation()
    setPendingSaveOpen(false)
  }, [pendingSaveOpen, formData.title, entries, openModalWithValidation])

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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
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
              const previousEntry = index > 0 ? entries[index - 1] : null
              const canSuggest =
                !!previousEntry &&
                previousEntry.time.trim() !== '' &&
                previousEntry.location.trim() !== '' &&
                entry.location.trim() !== '' &&
                parseTimeToMinutes(previousEntry.time) !== null
            const travelSuggestions = canSuggest
              ? getMockTravelSuggestions(previousEntry.location, entry.location)
              : []
            const hasLocation = entry.location.trim() !== ''

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
                            onChange={(e) => {
                              setSelectedSuggestionByEntry((prev) => {
                                if (!prev[index]) return prev
                                const next = { ...prev }
                                delete next[index]
                                return next
                              })
                              updateEntry(index, { time: e.target.value })
                            }}
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-50 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                          />
                      </div>
                    </div>
                  </div>

                  {travelSuggestions.length > 0 && previousEntry && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
                        {t('create.travelSuggestionTitle')}
                      </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {travelSuggestions.map((suggestion) => {
                            const arrival = getSuggestedArrival(previousEntry.time, suggestion.durationMinutes)
                            if (!arrival) return null
                            const modeLabel = t(`itinerary.mode.${suggestion.mode}`, {
                              defaultValue: suggestion.mode
                            })
                            const durationLabel = formatDuration(suggestion.durationMinutes)
                            const arrivalLabel =
                              arrival.dayOffset > 0
                                ? `${arrival.time} (${t('create.travelSuggestionNextDay')})`
                                : arrival.time
                            const suggestionKey = getSuggestionKey(suggestion)
                            const isSelected = selectedSuggestionByEntry[index] === suggestionKey

                            return (
                              <button
                                type="button"
                                key={suggestionKey}
                                onClick={() => applySuggestionToEntry(index, suggestion)}
                                aria-pressed={isSelected}
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                  isSelected
                                    ? 'border-[#5A9CB5] bg-[#5A9CB5] text-white dark:border-[#FACE68] dark:bg-[#FACE68] dark:text-gray-900'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-[#5A9CB5] hover:text-[#5A9CB5] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:text-[#FACE68]'
                                }`}
                              >
                                {modeLabel} / {durationLabel} -&gt; {arrivalLabel}
                              </button>
                            )
                        })}
                      </div>
                    </div>
                  )}

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
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-xs transition focus-visible:outline focus-visible:outline-2 ${
                        hasLocation
                          ? 'border border-gray-200 bg-white text-gray-700 hover:border-[#5A9CB5] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                          : 'border border-dashed border-[#FAAC68] bg-gradient-to-r from-[#FACE68]/20 via-transparent to-[#FAAC68]/20 text-gray-500 hover:border-[#FA6868] hover:shadow-sm dark:border-[#FAAC68] dark:from-[#FAAC68]/20 dark:via-transparent dark:to-[#FA6868]/20 dark:hover:border-[#FA6868]'
                      } ${hasLocation ? 'focus-visible:outline-[#5A9CB5]' : 'focus-visible:outline-[#FAAC68]'}`}
                    >
                      <MapPinIcon
                        className={`h-5 w-5 ${hasLocation ? 'text-[#5A9CB5] dark:text-[#FACE68]' : 'text-[#FA6868] dark:text-[#FAAC68]'}`}
                      />
                      <div className="text-left">
                        <p className="text-[0.85rem] font-semibold text-gray-900 dark:text-gray-50">
                          {entry.location || t('create.locationHint')}
                        </p>
                      </div>
                  </button>

                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </div>
              {index < entries.length - 1 && (
                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => handleInsertEntryClick(index)}
                    aria-label={t('create.addPanel')}
                    aria-disabled={!canAddEntry}
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#FA6868] transition hover:bg-[#FACE68]/20 dark:bg-gray-900 dark:text-[#FAAC68] shadow-sm ${
                      canAddEntry ? '' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-full w-full"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
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
            onClick={handleAddEntryClick}
            aria-label={t('create.addPanel')}
            aria-disabled={!canAddEntry}
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#FA6868] transition hover:bg-[#FACE68]/20 dark:bg-gray-900 dark:text-[#FAAC68] ${
              canAddEntry ? '' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                  {t('create.searchButton')}
                </button>
              </div>
              {showLocationAddress && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                    {t('create.locationAddressLabel')}:
                  </span>{' '}
                  {locationDisplayAddress}
                </div>
              )}
              {searchResultCoords ? (
                <LocationPreviewMap
                  lat={searchResultCoords.lat}
                  lng={searchResultCoords.lng}
                  locationName={locationDisplayName}
                  locationAddress={showLocationAddress ? locationDisplayAddress : undefined}
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
                  {t('create.selectFromSearch')}
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                  <div className="relative mt-1">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      value={modalPassword}
                      onChange={(e) => setModalPassword(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 pr-12 text-sm text-gray-900 dark:border-gray-700 dark:bg-white dark:text-gray-900"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword((prev) => !prev)}
                      aria-label={showModalPassword ? t('create.passwordHide') : t('create.passwordShow')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showModalPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <path d="M10.94 10.94a3 3 0 0 0 4.12 4.12" />
                          <path d="M9.88 5.09A9.94 9.94 0 0 1 12 5c5.52 0 10 4.48 10 7-1.02 2.51-3.44 4.77-6.45 5.71" />
                          <path d="M6.11 6.11C3.64 7.35 1.79 9.45 1 12c1.24 3.06 4.55 5.83 9 5.83 1.02 0 2-.13 2.93-.37" />
                          <path d="M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
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

      <div className={`fixed right-6 bottom-8 z-40 ${locationModalOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={() => {
            if (!formData.title.trim()) {
              setValidationErrors({ title: true })
              showPreviewDisabledToast()
              return
            }
            openPreviewWithValidation()
          }}
          className="rounded-full bg-[#FA6868] px-5 py-3 text-white shadow-lg transition hover:shadow-2xl hover:bg-[#e85858] whitespace-nowrap text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-[#FA6868]"
        >
          {t('create.floatSave')}
        </button>
      </div>
    </div>
  )
}

export default CreateItineraryPage
