import { Timestamp } from 'firebase/firestore'

// Mock Timestamp helper
const createMockTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString))
}

export const mockItineraries = [
  {
    id: 'tokyo-trip-2024',
    title: '東京旅行 2024',
    dateRange: {
      start: createMockTimestamp('2024-03-20'),
      end: createMockTimestamp('2024-03-23')
    },
    passwordHash: 'mock-hash-123', // In real app, this would be bcrypt hash
    createdAt: createMockTimestamp('2024-01-15'),
    updatedAt: createMockTimestamp('2024-01-15')
  },
  {
    id: 'osaka-adventure',
    title: 'Osaka Food Adventure',
    dateRange: {
      start: createMockTimestamp('2024-04-10'),
      end: createMockTimestamp('2024-04-12')
    },
    passwordHash: 'mock-hash-456',
    createdAt: createMockTimestamp('2024-01-20'),
    updatedAt: createMockTimestamp('2024-01-20')
  }
]

export const mockItineraryItems = {
  'tokyo-trip-2024': [
    {
      id: 'item-1',
      date: createMockTimestamp('2024-03-20'),
      time: '09:00',
      title: '東京タワー',
      location: '東京タワー',
      address: '東京都港区芝公園4-2-8',
      coordinates: {
        lat: 35.6586,
        lng: 139.7454
      },
      cost: {
        amount: 1200,
        currency: 'JPY'
      },
      notes: '展望台からの景色を楽しむ',
      order: 0,
      estimatedDuration: 120,
      travelTimeToNext: 30,
      travelMode: 'transit' as const,
      createdAt: createMockTimestamp('2024-01-15'),
      updatedAt: createMockTimestamp('2024-01-15')
    },
    {
      id: 'item-2',
      date: createMockTimestamp('2024-03-20'),
      time: '12:30',
      title: 'すし大',
      location: 'すし大 築地本店',
      address: '東京都中央区築地6-21-2',
      coordinates: {
        lat: 35.6654,
        lng: 139.7707
      },
      cost: {
        amount: 3500,
        currency: 'JPY'
      },
      notes: '開店30分前に並ぶこと',
      order: 1,
      estimatedDuration: 60,
      travelTimeToNext: 20,
      travelMode: 'walking' as const,
      createdAt: createMockTimestamp('2024-01-15'),
      updatedAt: createMockTimestamp('2024-01-15')
    },
    {
      id: 'item-3',
      date: createMockTimestamp('2024-03-20'),
      time: '15:00',
      title: '浅草寺',
      location: '浅草寺',
      address: '東京都台東区浅草2-3-1',
      coordinates: {
        lat: 35.7148,
        lng: 139.7967
      },
      cost: null,
      notes: '雷門で写真撮影',
      order: 2,
      estimatedDuration: 90,
      travelTimeToNext: null,
      travelMode: null,
      createdAt: createMockTimestamp('2024-01-15'),
      updatedAt: createMockTimestamp('2024-01-15')
    },
    {
      id: 'item-4',
      date: createMockTimestamp('2024-03-21'),
      time: '10:00',
      title: 'チームラボボーダレス',
      location: 'チームラボボーダレス お台場',
      address: '東京都江東区青海1-3-8',
      coordinates: {
        lat: 35.6252,
        lng: 139.7756
      },
      cost: {
        amount: 3200,
        currency: 'JPY'
      },
      notes: '事前予約済み',
      order: 0,
      estimatedDuration: 180,
      travelTimeToNext: 25,
      travelMode: 'transit' as const,
      createdAt: createMockTimestamp('2024-01-15'),
      updatedAt: createMockTimestamp('2024-01-15')
    }
  ],
  'osaka-adventure': [
    {
      id: 'item-osaka-1',
      date: createMockTimestamp('2024-04-10'),
      time: '11:00',
      title: '道頓堀',
      location: '道頓堀',
      address: '大阪府大阪市中央区道頓堀',
      coordinates: {
        lat: 34.6686,
        lng: 135.5004
      },
      cost: null,
      notes: 'グリコの看板で写真',
      order: 0,
      estimatedDuration: 120,
      travelTimeToNext: 10,
      travelMode: 'walking' as const,
      createdAt: createMockTimestamp('2024-01-20'),
      updatedAt: createMockTimestamp('2024-01-20')
    },
    {
      id: 'item-osaka-2',
      date: createMockTimestamp('2024-04-10'),
      time: '14:00',
      title: 'たこ焼き 十八番',
      location: 'たこ焼き 十八番',
      address: '大阪府大阪市中央区難波1-6-12',
      coordinates: {
        lat: 34.6658,
        lng: 135.5010
      },
      cost: {
        amount: 800,
        currency: 'JPY'
      },
      notes: '有名店のたこ焼き',
      order: 1,
      estimatedDuration: 30,
      travelTimeToNext: null,
      travelMode: null,
      createdAt: createMockTimestamp('2024-01-20'),
      updatedAt: createMockTimestamp('2024-01-20')
    }
  ]
}

// Mock password storage (in memory only for dev)
export const mockPasswords: Record<string, string> = {
  'tokyo-trip-2024': 'tokyo2024',
  'osaka-adventure': 'osaka123'
}

// Helper to check password
export const checkMockPassword = (itineraryId: string, password: string): boolean => {
  return mockPasswords[itineraryId] === password
}
