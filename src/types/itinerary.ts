import { Timestamp } from 'firebase/firestore'

export interface Itinerary {
  id: string
  title: string
  dateRange: {
    start: Timestamp
    end: Timestamp
  }
  passwordHash: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy?: string
}

export interface ItineraryItem {
  id: string
  date: Timestamp
  time: string | null
  title: string
  location: string
  address: string
  coordinates: {
    lat: number
    lng: number
  } | null
  cost: {
    amount: number
    currency: string
  } | null
  notes: string
  order: number
  estimatedDuration: number | null
  travelTimeToNext: number | null
  travelMode: 'driving' | 'walking' | 'transit' | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
