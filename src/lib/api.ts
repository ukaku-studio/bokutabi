// Mock API functions that simulate Firebase Cloud Functions
import { mockItineraries, mockItineraryItems, checkMockPassword } from './mockData'
import type { Itinerary, ItineraryItem } from '../types/itinerary'

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const api = {
  // Create a new itinerary
  async createItinerary(data: {
    title: string
    dateRange: { start: Date; end: Date }
    password: string
  }): Promise<{ id: string }> {
    await delay()

    // In real implementation, this would:
    // 1. Hash the password
    // 2. Save to Firestore
    // 3. Return the generated ID

    const id = `itinerary-${Date.now()}`
    console.log('Mock: Created itinerary', { id, title: data.title })

    return { id }
  },

  // Authenticate with itinerary password
  async authenticateItinerary(itineraryId: string, password: string): Promise<{ token: string }> {
    await delay()

    const isValid = checkMockPassword(itineraryId, password)

    if (!isValid) {
      throw new Error('Invalid password')
    }

    // In real implementation, this would return a Firebase Custom Token
    const token = `mock-token-${itineraryId}-${Date.now()}`

    console.log('Mock: Authenticated', { itineraryId, token })

    return { token }
  },

  // Get itinerary by ID
  async getItinerary(itineraryId: string): Promise<Itinerary | null> {
    await delay()

    const itinerary = mockItineraries.find(i => i.id === itineraryId)

    if (!itinerary) {
      return null
    }

    return itinerary as unknown as Itinerary
  },

  // Get itinerary items
  async getItineraryItems(itineraryId: string): Promise<ItineraryItem[]> {
    await delay()

    const items = mockItineraryItems[itineraryId as keyof typeof mockItineraryItems] || []

    return items as unknown as ItineraryItem[]
  },

  // Add itinerary item
  async addItineraryItem(itineraryId: string, item: Partial<ItineraryItem>): Promise<{ id: string }> {
    await delay()

    const id = `item-${Date.now()}`

    console.log('Mock: Added item', { itineraryId, itemId: id, item })

    return { id }
  },

  // Update itinerary item
  async updateItineraryItem(
    itineraryId: string,
    itemId: string,
    updates: Partial<ItineraryItem>
  ): Promise<void> {
    await delay()

    console.log('Mock: Updated item', { itineraryId, itemId, updates })
  },

  // Delete itinerary item
  async deleteItineraryItem(itineraryId: string, itemId: string): Promise<void> {
    await delay()

    console.log('Mock: Deleted item', { itineraryId, itemId })
  }
}
