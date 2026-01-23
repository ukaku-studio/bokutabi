# Architecture Design

## Overview
This document outlines the technical architecture for the travel itinerary sharing platform, a mobile-first Progressive Web App (PWA) built with Next.js, Firebase, and real-time collaboration features.

## UI Design Principles: Simple & Clean

### Mobile Interface Concept (Simplified)

```
┌─────────────────────────┐
│  Tokyo Trip  🗓 📍 📤  │  ← Minimal header: title + 3 icons
├─────────────────────────┤
│ Day 1 - Jan 24          │
│                         │
│ ○ 09:00  Tokyo Tower    │  ← Minimal item card
│   ¥1000  📍             │     Click to expand details
│                         │
│ ○ 12:30  Sushi Dai      │
│   ¥3000  📍             │
│   🚶 15 min from above  │  ← Auto-calculated travel time
│                         │
│ ○ 15:00  Asakusa Temple │
│   Free   📍             │
│   🚗 20 min from above  │
│                         │
├─────────────────────────┤
│ Day 2 - Jan 25          │
│ ...                     │
├─────────────────────────┤
│                         │
│      + Add Place        │  ← Single action button
│                         │
└─────────────────────────┘
```

### Key Simplification Decisions

1. **No Complex Navigation**: Single scrollable page, all days visible
2. **Inline Editing**: Tap item to edit in-place, no modal popups
3. **Minimal Icons**: Only essential actions visible (map, share, settings)
4. **Auto-expand on Tap**: Collapsed by default, expand to see notes/details
5. **Smart Input**: Location field has autocomplete, auto-geocodes on blur
6. **Subtle AI**: Travel time shown as small hint, not prominent feature
7. **No Clutter**: Hide empty fields (if no cost, don't show ¥0)
8. **Language Auto-detection**: Browser language detected automatically
9. **Theme Auto-detection**: System theme preference detected automatically
10. **Simple Settings**: Only 2 settings (Language + Theme), immediately accessible

### Input Flow (Ultra Simple)

```
User taps "+ Add Place"
  ↓
Inline form appears:
┌─────────────────────────┐
│ Where?  [Tokyo Disn...] │ ← Autocomplete as you type
│ When?   [Jan 24] [10:00]│ ← Native date/time pickers
│ Cost?   [¥5000]         │ ← Optional, only if relevant
│ [Save]                  │
└─────────────────────────┘
  ↓
System auto-geocodes "Tokyo Disneyland"
System suggests 8h visit duration (subtle)
System calculates travel time from previous place
  ↓
Item appears in list immediately (auto-save)
```

No modals, no multi-step wizards, no confirmation dialogs.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer (SPA/PWA)                │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React 18 + Vite Application                │  │
│  │  - React Router for client-side routing            │  │
│  │  - Mobile-first responsive UI                      │  │
│  │  - Service Worker for offline caching (PWA)        │  │
│  │  - Real-time UI updates via Firestore listeners    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Client-side Storage                        │  │
│  │  - IndexedDB for offline data caching              │  │
│  │  - LocalStorage for auth tokens & preferences      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Firebase Services                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Firestore (Real-time Database)             │  │
│  │  - itineraries collection                          │  │
│  │  - itineraries/{id}/items subcollection            │  │
│  │  - Real-time listeners for collaboration           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Firebase Authentication                     │  │
│  │  - Custom token-based password auth                │  │
│  │  - Session management                              │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Firebase Cloud Functions                   │  │
│  │  - createItinerary (API endpoint)                  │  │
│  │  - authenticateItinerary (API endpoint)            │  │
│  │  - updatePassword (API endpoint)                   │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Firebase Hosting                           │  │
│  │  - Serves built React SPA                          │  │
│  │  - HTTPS for PWA requirement                       │  │
│  │  - CDN for fast global delivery                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ API Calls
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 External Services                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │      Google Maps APIs (or Mapbox)                  │  │
│  │  - Geocoding API: Address → Coordinates            │  │
│  │  - Distance Matrix API: Travel time estimation     │  │
│  │  - Maps JavaScript API: Interactive maps           │  │
│  │  - Places API: Destination info & visit duration   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Model

### Firestore Collections

#### `itineraries` Collection
```typescript
interface Itinerary {
  id: string;                    // Auto-generated document ID
  title: string;                 // Trip title
  dateRange: {
    start: Timestamp;            // Trip start date
    end: Timestamp;              // Trip end date
  };
  passwordHash: string;          // bcrypt hash of password
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last modification timestamp
  createdBy: string;             // Optional: creator identifier
}
```

#### `itineraries/{id}/items` Subcollection
```typescript
interface ItineraryItem {
  id: string;                    // Auto-generated document ID
  date: Timestamp;               // Date of this item
  time: string | null;           // Time (HH:MM format), nullable
  title: string;                 // Destination/activity name
  location: string;              // Location name/address
  coordinates: {
    lat: number;
    lng: number;
  } | null;                      // Geocoded coordinates, nullable
  cost: {
    amount: number;
    currency: string;            // ISO currency code (USD, JPY, etc.)
  } | null;                      // Cost, nullable
  notes: string;                 // Free-form notes/comments
  order: number;                 // For ordering items within a day
  estimatedDuration: number | null;  // Expected visit duration in minutes
  travelTimeToNext: number | null;   // Travel time to next item in minutes
  travelMode: 'driving' | 'walking' | 'transit' | null;  // Transportation mode
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check password (requires custom claim or separate auth)
    function isAuthenticated(itineraryId) {
      return request.auth != null &&
             request.auth.token.itineraryId == itineraryId;
    }

    match /itineraries/{itineraryId} {
      // Anyone can read metadata to attempt password auth
      allow read: if true;
      // Only authenticated users can write
      allow write: if isAuthenticated(itineraryId);

      match /items/{itemId} {
        // Only authenticated users can read/write items
        allow read, write: if isAuthenticated(itineraryId);
      }
    }
  }
}
```

## Authentication Flow

### Password-Based Access (No User Accounts)

```
1. User creates itinerary with password
   ↓
2. Server hashes password (bcrypt) and stores in Firestore
   ↓
3. Server generates unique itinerary URL: /itinerary/{id}
   ↓
4. Creator shares URL + password with friends
   ↓
5. Friend visits URL, enters password
   ↓
6. Next.js API route verifies password against hash
   ↓
7. If valid, API generates Firebase Custom Token with claim: {itineraryId: "..."}
   ↓
8. Client stores token in localStorage
   ↓
9. Client uses token for Firestore access (protected by security rules)
   ↓
10. Token expires after X hours (configurable, e.g., 24h)
    ↓
11. User must re-authenticate with password
```

### Firebase Cloud Functions (API Endpoints)
- `POST /createItinerary` - Create new itinerary, hash password, return ID
- `POST /authenticateItinerary` - Verify password, return Firebase Custom Token
- `POST /updatePassword` - Change password (requires valid token)

**Note**: Since we're using React (not Next.js), API routes are implemented as Firebase Cloud Functions.

## Real-Time Collaboration

### Firestore Real-Time Listeners

```typescript
// Client-side: Listen to itinerary items
const unsubscribe = onSnapshot(
  collection(db, 'itineraries', itineraryId, 'items'),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // Add item to UI
      }
      if (change.type === 'modified') {
        // Update item in UI
      }
      if (change.type === 'removed') {
        // Remove item from UI
      }
    });
  }
);
```

### Conflict Resolution Strategy: Last-Write-Wins
- Firestore automatically handles concurrent writes with last-write-wins
- No complex operational transforms needed for MVP
- Trade-off: Rare edge case where simultaneous edits to same field may overwrite
- Acceptable for MVP; can enhance with optimistic locking later if needed

## Offline Support (PWA)

### Service Worker Strategy

```
Cache Strategy:
1. App Shell (HTML, CSS, JS)
   → Cache-First with Background Update
   → Ensures instant load even offline

2. Itinerary Data (Firestore documents)
   → Network-First with Cache Fallback
   → Fresh data when online, cached data when offline

3. Map Tiles & Static Assets
   → Stale-While-Revalidate
   → Show cached tiles immediately, update in background

4. API Responses (Geocoding, Distance Matrix)
   → Cache with Expiration (24 hours)
   → Minimize API costs
```

### Offline Data Synchronization

```typescript
// Use Firestore's built-in offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Offline persistence enabled');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support offline persistence
    }
  });
```

For MVP:
- **Read Offline**: Fully supported via Firestore cache
- **Write Offline**: Queue operations in Firestore (built-in), sync when online
- **Conflict Handling**: Last-write-wins on reconnection
- **User Feedback**: Show "offline" indicator, notify when changes are synced

## Map Integration

### Automatic Geocoding Flow
```
1. User types location name (e.g., "東京タワー")
   ↓
2. After 3+ characters, show autocomplete (Google Places Autocomplete API)
   ↓
3. User selects from suggestions OR finishes typing
   ↓
4. System automatically calls Google Geocoding API
   ↓
5. API returns:
   - Coordinates { lat, lng }
   - Formatted address
   - Place ID
   - Place details (name, type, etc.)
   ↓
6. Automatically embed all data into the item (no confirmation needed)
   ↓
7. Store in Firestore:
   - coordinates
   - address
   - placeId
   ↓
8. Display marker on map using coordinates
   ↓
9. If geocoding fails, show error and allow retry
```

**Key Point**: The process is automatic and seamless - users just type a place name and the map information is auto-embedded.

### Map Display
- Library: `@react-google-maps/api` or `react-map-gl` (Mapbox)
- Features:
  - Display markers for all items with coordinates
  - Cluster markers by day (filterable)
  - Draw polylines for routes (optional)
  - Click marker → show item details
  - Embedded map preview per item (small static map thumbnail)

### Autocomplete Integration
- **Library**: Google Places Autocomplete (part of Places API)
- **UX**: Dropdown suggestions appear as user types
- **Debouncing**: 300ms delay to avoid excessive API calls
- **Session tokens**: Use session tokens to reduce Places API costs
- **Selection**: Clicking suggestion auto-fills location and geocodes immediately

### Cost Optimization
- Cache geocoding results (location → coordinates) in Firestore to avoid repeat calls
- Use session tokens for Places Autocomplete (cheaper billing)
- Use map static images for embedded thumbnails to reduce API calls
- Implement request batching for Distance Matrix API

## AI Time Estimation

### Travel Time Calculation
```
1. User adds consecutive items A and B with locations
   ↓
2. Client calls Distance Matrix API:
   - Origin: coordinates of A
   - Destination: coordinates of B
   - Mode: driving (default) | walking | transit
   ↓
3. API returns duration in seconds
   ↓
4. Store `travelTimeToNext` in item A
   ↓
5. Suggest arrival time for B = departure time of A + travel time
   ↓
6. User can accept or manually override
```

### Visit Duration Estimation
```
1. User adds destination (e.g., "Tokyo Disneyland")
   ↓
2. Client calls Google Places API:
   - Get place details including type (museum, park, restaurant, etc.)
   ↓
3. Apply heuristic based on place type:
   - Theme parks: 6-8 hours
   - Museums: 2-3 hours
   - Restaurants: 1-2 hours
   - Landmarks: 30-60 minutes
   ↓
4. Store `estimatedDuration` in item
   ↓
5. User can accept or override
```

Fallback: Maintain a JSON file with common destinations and typical durations.

### Auto-Update on Changes
- When user reorders items → recalculate travel times for affected pairs
- When user changes location → recalculate travel time to/from neighbors
- Use Firestore transactions to ensure consistency

## Internationalization (i18n) and Theming

### Language Support: Japanese and English

#### Implementation Approach
- **Library**: react-i18next + i18next
- **Supported Languages**: Japanese (ja), English (en)
- **Default Language**: Auto-detect from `navigator.language`
  - `ja` or `ja-JP` → Japanese
  - All others → English
- **User Override**: Stored in localStorage, persists across sessions

#### i18next Configuration
```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ja from './locales/ja.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector) // Auto-detect browser language
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### Translation Structure
```typescript
// src/i18n/locales/ja.json
{
  "common": {
    "add": "追加",
    "edit": "編集",
    "delete": "削除",
    "save": "保存"
  },
  "itinerary": {
    "title": "旅程",
    "addPlace": "場所を追加",
    "date": "日付",
    "time": "時刻",
    "location": "場所",
    "cost": "費用"
  }
}

// src/i18n/locales/en.json
{
  "common": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save"
  },
  "itinerary": {
    "title": "Itinerary",
    "addPlace": "Add Place",
    "date": "Date",
    "time": "Time",
    "location": "Location",
    "cost": "Cost"
  }
}
```

#### Locale-Specific Formatting
- **Dates**: `date-fns` with locale support
  - Japanese: `2024年1月24日`
  - English: `January 24, 2024`
- **Times**: 24-hour format for both (simpler, internationally understood)
- **Currency**: Default to ¥ for Japanese, $ for English (user can override)

### Dark Mode Support

#### Implementation Approach
- **Library**: Tailwind CSS dark mode with `class` strategy
- **Detection**: Check `prefers-color-scheme` media query on first load
- **Storage**: Save preference to localStorage
- **Options**: Light, Dark, Auto (follow system)

#### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom color palette for light/dark
      }
    }
  }
}
```

#### Color Scheme
```css
/* Light Mode */
--bg-primary: white
--bg-secondary: gray-50
--text-primary: gray-900
--text-secondary: gray-600
--border: gray-200

/* Dark Mode */
--bg-primary: gray-900
--bg-secondary: gray-800
--text-primary: gray-50
--text-secondary: gray-300
--border: gray-700
```

#### Implementation Pattern
```tsx
// Use Tailwind dark: modifier
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-50">Title</h1>
</div>
```

#### Theme Switcher Component
```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">Auto</option>
    </select>
  );
}
```

### Settings Panel Design

#### Simple Settings UI
```
┌─────────────────────────┐
│      Settings           │
├─────────────────────────┤
│                         │
│ Language                │
│ ○ 日本語  ○ English     │
│                         │
│ Theme                   │
│ ○ Light  ○ Dark  ○ Auto│
│                         │
│      [Close]            │
│                         │
└─────────────────────────┘
```

- Accessed via ⚙️ settings icon in header
- Modal or slide-in panel (mobile-friendly)
- Only 2 settings for MVP: Language + Theme
- Changes apply immediately
- No "Save" button needed (auto-save to localStorage)

## Technology Stack

### Frontend
- **Build Tool**: Vite (for fast development and build)
- **Framework**: React 18+
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Minimal custom components or Headless UI (for simplicity)
- **State Management**: React Context + Firestore listeners (no Redux needed)
- **Forms**: React Hook Form + Zod validation
- **Date/Time**: date-fns with locale support
- **Maps**: @react-google-maps/api or react-map-gl
- **Internationalization**: react-i18next
- **Theme Management**: Tailwind dark mode + localStorage
- **PWA**: vite-plugin-pwa (Workbox)

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Custom Tokens (password-based)
- **Cloud Functions**: Firebase Cloud Functions (for API endpoints)
- **Hosting**: Firebase Hosting
- **Password Hashing**: bcryptjs (in Cloud Functions)

### External APIs
- **Geocoding**: Google Geocoding API or Mapbox Geocoding
- **Maps**: Google Maps JavaScript API or Mapbox GL JS
- **Distance Matrix**: Google Distance Matrix API or Mapbox Directions API
- **Places**: Google Places API (for visit duration estimation)

### PWA
- **Service Worker**: Workbox (via next-pwa)
- **Offline Storage**: Firestore offline persistence + IndexedDB
- **Manifest**: Standard PWA manifest.json

## Security Considerations

### Password Protection
- **Hashing**: Use bcrypt with salt rounds ≥ 10
- **No plain-text storage**: Never store passwords in plain text
- **Token-based access**: Use Firebase Custom Tokens with short expiration (24h)
- **HTTPS**: Required for PWA and secure token transmission

### Data Privacy
- **No personal data required**: No emails, names, or accounts
- **Shareable by design**: Users understand data is accessible via URL + password
- **Optional password expiration**: Future enhancement for temporary sharing

### Firestore Security Rules
- Read itinerary metadata: Public (needed for password auth)
- Write itinerary: Only authenticated users
- Read/write items: Only authenticated users
- No direct access to password hashes via client

## Performance Considerations

### Optimizations
1. **Lazy Loading**: Load map only when user navigates to map view
2. **Pagination**: For very long itineraries (>100 items), paginate by date
3. **Debouncing**: Debounce real-time saves (e.g., 500ms after user stops typing)
4. **Image Optimization**: Use Next.js Image component for uploaded photos (future feature)
5. **Code Splitting**: Split large libraries (maps, date pickers) into separate chunks

### Cost Management
- **Firestore**: Optimize queries, minimize document reads
- **Map APIs**: Cache results aggressively, use static maps where possible
- **Hosting**: CDN via Firebase Hosting or Vercel for fast global delivery

## Scalability Considerations

### MVP Constraints (Acceptable for Initial Launch)
- Max itinerary size: ~200 items (Firestore subcollection limits not an issue)
- Max concurrent editors: ~10 (Firestore handles well)
- No versioning or audit log (can add later)

### Future Enhancements
- User accounts for managing multiple itineraries
- Itinerary templates or public gallery
- Image uploads via Firebase Storage
- Export to PDF, iCal, or Google Calendar
- Weather integration
- Budget tracking and expense splitting
- Multi-language support (i18n)

## Testing Strategy

### Unit Tests
- Password hashing/verification logic
- Geocoding service wrapper
- Time estimation algorithms
- Data validation (Zod schemas)

### Integration Tests
- Firestore CRUD operations
- Real-time listener behavior
- Authentication flow (password → token → Firestore access)
- Service worker caching strategies

### End-to-End Tests (Playwright or Cypress)
- Create itinerary → share URL → authenticate → edit → sync
- Offline mode: cache data → go offline → view data → reconnect → sync
- Real-time collaboration: two users edit simultaneously

### Manual Testing
- PWA installation on iOS and Android
- Offline functionality across devices
- Map interaction on touch and desktop
- Responsive design on various screen sizes

## Deployment

### Hosting
**Firebase Hosting** (Required for Cloud Functions integration)
   - Automatic HTTPS
   - CDN included
   - Tight integration with Firestore and Cloud Functions
   - Free tier generous for MVP
   - Easy deployment: `firebase deploy`

### Environment Variables

**Frontend (.env)**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_GOOGLE_MAPS_API_KEY=
VITE_CLOUD_FUNCTIONS_URL=https://us-central1-PROJECT_ID.cloudfunctions.net
```

**Cloud Functions (.env or functions/.env)**
```
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

PASSWORD_HASH_SALT_ROUNDS=10
TOKEN_EXPIRATION_HOURS=24
```

### CI/CD
- GitHub Actions with Firebase auto-deploy on push to main
- Run tests before deployment
- Build Vite project: `npm run build`
- Deploy to Firebase: `firebase deploy`

## Trade-offs and Design Decisions

### Why React + Vite over Next.js?
- **Pros**: Simpler architecture, faster dev server, pure SPA (no SSR complexity), smaller bundle
- **Cons**: No SSR/SSG, need Cloud Functions for API routes
- **Decision**: User preference for React. Vite provides excellent DX and performance.

### Why Firebase over Custom Backend?
- **Pros**: Real-time sync out-of-the-box, offline persistence, scalable, low maintenance
- **Cons**: Vendor lock-in, less control over data model
- **Decision**: Firebase's real-time and offline features align perfectly with requirements

### Why Password-Only Auth (No User Accounts)?
- **Pros**: Simplest UX for sharing, no signup friction, perfect for one-off trips
- **Cons**: Less secure, no user profile, can't manage multiple itineraries
- **Decision**: MVP focuses on simplicity; user accounts can be added later

### Why Last-Write-Wins Conflict Resolution?
- **Pros**: Simple to implement, works for most cases, Firestore default
- **Cons**: Rare data loss if two users edit same field simultaneously
- **Decision**: Acceptable for MVP; can enhance with operational transforms later

### Why Google Maps over Mapbox?
- **Recommendation**: Start with Google Maps
- **Pros**: Better geocoding, more comprehensive Places API, familiar UX
- **Cons**: Higher cost at scale
- **Decision**: Use Google for MVP, design abstraction layer to swap later if needed

### Why Firebase Cloud Functions for API?
- **Pros**: Seamless integration with Firestore, auto-scaling, same project
- **Cons**: Cold start latency, limited execution time
- **Decision**: Since we're not using Next.js API routes, Cloud Functions are the natural choice for Firebase

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds (mobile 4G)
- Real-time sync latency < 2 seconds
- Offline mode works on 95%+ of browsers
- PWA installation success rate > 80%

### User Experience Metrics
- Time to create first itinerary < 5 minutes
- Zero data loss in collaborative editing
- Map loads successfully for 99% of geocoded locations
- AI time suggestions accepted rate > 50%

## Open Questions for Implementation

1. **Image uploads**: Should we add photo support in MVP or defer to v2?
   - Recommendation: Defer to keep MVP scope focused

2. **Currency conversion**: Auto-convert currencies or just display multiple totals?
   - Recommendation: Display separate totals per currency for MVP

3. **Password recovery**: No email → can't reset password. Just allow password change?
   - Recommendation: Allow password change if already authenticated; otherwise no recovery

4. **Itinerary deletion**: Permanent or soft delete? Expiration after X months?
   - Recommendation: Soft delete with 30-day retention for MVP

5. **Rate limiting**: Protect API routes from abuse?
   - Recommendation: Add basic rate limiting (e.g., 10 requests/minute per IP) using Next.js middleware
