import { FormEvent, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

type StopEntry = {
  date: string
  time: string
  location: string
  coordinates: { lat: number; lng: number } | null
  memo: string
  icon: string
}

const DEFAULT_ICONS = ['📍', '🏨', '🍽️', '🎡', '🛍️', '☕', '🚃', '✈️', '⛩️', '🏔️']

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
  icon: '📍'
})

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
  const [formValidationError, setFormValidationError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ title?: boolean }>({})
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [activeEntryIndex, setActiveEntryIndex] = useState<number | null>(null)
  const [locationSearch, setLocationSearch] = useState('')
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null)

  // Toast auto-dismiss
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toastVisible])

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const applyLocationSearch = () => {
    const query = locationSearch.trim()
    if (!query || activeEntryIndex === null) {
      return
    }

    updateEntry(activeEntryIndex, {
      location: query,
      coordinates: null
    })

    setLocationModalOpen(false)
    setActiveEntryIndex(null)
    setLocationSearch('')
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
    setFormValidationError('')
  }

  const updateEntry = (index: number, updates: Partial<typeof entries[number]>) => {
    setEntries((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry))
    )
    setFormValidationError('')
  }

  const openModalWithValidation = () => {
    setModalError('')
    setFormValidationError('')
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

    try {
      const { id } = await api.createItinerary({
        title: formData.title,
        dateRange: {
          start: new Date(entries
            .map((entry) => entry.date)
            .filter(Boolean)
            .sort()[0] ?? Date.now()),
          end: new Date(
            entries
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
        entries: entries.map(e => ({
          date: e.date,
          time: e.time,
          location: e.location,
          icon: e.icon,
          memo: e.memo
        })),
        createdAt: Date.now()
      })
      localStorage.setItem('created-itineraries', JSON.stringify(savedItineraries))

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
                setFormValidationError('')
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

          <div className="relative">
            {entries.length > 1 && (
              <span className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#FACE68] via-[#FAAC68] to-[#FACE68] dark:from-[#FAAC68]/50 dark:via-[#FA6868]/50 dark:to-[#FAAC68]/50" />
            )}
            <div className="relative space-y-6">
            {entries.map((entry, index) => (
              <div
                key={`${index}`}
                className="relative rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 shadow-sm"
              >
                <div className="space-y-2">
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
                          <div className="absolute top-12 left-0 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
                            <div className="grid grid-cols-5 gap-2">
                              {DEFAULT_ICONS.map((icon) => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => {
                                    updateEntry(index, { icon })
                                    setEmojiPickerIndex(null)
                                  }}
                                  className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xl transition ${
                                    entry.icon === icon
                                      ? 'bg-[#FACE68]/30 dark:bg-[#FAAC68]/30'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <span className="sr-only">{t('create.entryDate')}</span>
                      <div
                        onClick={(e) => {
                          const input = (e.currentTarget as HTMLElement).querySelector('input')
                          if (input && 'showPicker' in input) {
                            (input as HTMLInputElement).showPicker()
                          } else {
                            input?.focus()
                          }
                        }}
                        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-[#5A9CB5] transition dark:border-gray-700 dark:bg-gray-900"
                      >
                        <CalendarIcon className="h-5 w-5 text-[#5A9CB5]" />
                        <input
                          type="date"
                          value={entry.date}
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
                          const input = (e.currentTarget as HTMLElement).querySelector('input')
                          if (input && 'showPicker' in input) {
                            (input as HTMLInputElement).showPicker()
                          } else {
                            input?.focus()
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

                  <button
                    type="button"
                    onClick={() => {
                      setActiveEntryIndex(index)
                      setLocationModalOpen(true)
                      setLocationSearch('')
                    }}
                    aria-label={t('create.locationButtonLabel', 'Select location')}
                    className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-[#FAAC68] bg-gradient-to-r from-[#FACE68]/20 via-transparent to-[#FAAC68]/20 px-4 py-3 text-xs text-gray-500 transition hover:border-[#FA6868] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FAAC68] dark:border-[#FAAC68] dark:from-[#FAAC68]/20 dark:via-transparent dark:to-[#FA6868]/20 dark:hover:border-[#FA6868]"
                  >
                    <MapPinIcon className="h-5 w-5 text-[#FA6868] dark:text-[#FAAC68]" />
                    <div className="text-left">
                      <p className="text-[0.85rem] font-semibold text-gray-900 dark:text-gray-50">
                        {entry.location || t('create.locationHint')}
                      </p>
                      {entry.coordinates && (
                        <p className="text-[0.7rem] text-gray-500 dark:text-gray-400">
                          {`${entry.coordinates.lat.toFixed(2)}, ${entry.coordinates.lng.toFixed(2)}`}
                        </p>
                      )}
                    </div>
                  </button>

                  <div>
                    <span className="sr-only">{t('create.entryMemo')}</span>
                    <textarea
                      value={entry.memo}
                      onChange={(e) => updateEntry(index, { memo: e.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                      placeholder={t('create.entryMemoPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            ))}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">{t('create.locationPickerTitle')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('create.locationPickerSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(false)
                  setActiveEntryIndex(null)
                  setLocationSearch('')
                }}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ×
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
                  {t('create.mapModalSearchLabel')}
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <span className="text-gray-400 dark:text-gray-500">🔎</span>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder={t('create.mapModalSearchPlaceholder')}
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none dark:text-gray-50"
                  />
                </div>
              </div>
              <div className="h-64 rounded-2xl border border-gray-200 bg-slate-100 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                {t('create.mapModalMapPlaceholder')}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={applyLocationSearch}
                  disabled={!locationSearch.trim()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
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

      <div className="fixed right-6 bottom-8 z-40">
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
