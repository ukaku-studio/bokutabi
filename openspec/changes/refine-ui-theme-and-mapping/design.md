# Design Document

## Architecture Overview

This change touches four main areas of the application:
1. Theme system (context layer)
2. Geocoding service (data layer)
3. Map display (presentation layer)
4. Mobile responsive layout (presentation layer)

## Design Decisions

### 1. Theme System Simplification

**Decision**: Remove 'auto' theme option and force users to choose light or dark explicitly.

**Rationale**:
- Simplifies UI by reducing options from 3 to 2
- Reduces code complexity (no need to maintain media query listeners)
- Most users have a preference and don't change it often
- Migration path is straightforward for existing users

**Trade-offs**:
- **Pro**: Simpler code, clearer user intent, easier to maintain
- **Con**: Users lose automatic system preference following
- **Con**: Breaking change for existing users with 'auto' set

**Migration Strategy**:
```typescript
// One-time migration in ThemeProvider
const [theme, setTheme] = useState<Theme>(() => {
  const saved = localStorage.getItem('theme') as Theme | 'auto'
  if (saved === 'auto') {
    // Detect system preference one time
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const migrated = prefersDark ? 'dark' : 'light'
    localStorage.setItem('theme', migrated)
    return migrated
  }
  return saved || 'light'
})
```

### 2. Google Maps to OpenStreetMap Migration

**Decision**: Replace Google Maps with Leaflet + OpenStreetMap.

**Rationale**:
- **Cost**: OpenStreetMap is free (Nominatim has usage policies but no API key required)
- **Flexibility**: No vendor lock-in, open-source ecosystem
- **Privacy**: No data shared with Google
- **Bundle size**: Leaflet is lighter than Google Maps JavaScript API

**Trade-offs**:
- **Pro**: Free, open-source, lighter bundle, better privacy
- **Con**: Different visual style (users may notice)
- **Con**: Nominatim rate limits (need to respect usage policy)
- **Con**: Slightly different API surface

**Technical Approach**:

#### Geocoding Service (src/lib/geocoding.ts)
```typescript
// Before (Google Maps)
const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
url.searchParams.set('address', address)
url.searchParams.set('key', apiKey)

// After (Nominatim)
const url = new URL('https://nominatim.openstreetmap.org/search')
url.searchParams.set('format', 'json')
url.searchParams.set('q', address)
// Add required User-Agent header
const response = await fetch(url.toString(), {
  headers: {
    'User-Agent': 'BOKUTABI/1.0'  // Required by Nominatim policy
  }
})

// Response parsing
const data = await response.json()
if (data && data.length > 0) {
  const result = data[0]
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formattedAddress: result.display_name
  }
}
```

#### Map Component (src/components/map/LeafletItineraryMap.tsx)
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function LeafletItineraryMap({ items, selectedItemId, onMarkerClick }) {
  const center = items.length
    ? [items[0].coordinates.lat, items[0].coordinates.lng]
    : [35.6762, 139.6503]  // Default to Tokyo

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ width: '100%', height: '360px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Marker
          key={item.id}
          position={[item.coordinates.lat, item.coordinates.lng]}
          eventHandlers={{ click: () => onMarkerClick?.(item) }}
        >
          <Popup>
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs">{item.location}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

**Rate Limiting Strategy**:
- Nominatim requires max 1 request/second
- Consider debouncing search input (500ms delay)
- Consider caching geocoding results in localStorage
- Display clear error message if rate limited

### 3. Geocoding Error Handling

**Decision**: Show error inline on the map placeholder, allow saving as text-only.

**Rationale**:
- Users still get value even without coordinates
- Error is contextual (shown where map would be)
- No blocking error that prevents workflow completion

**Trade-offs**:
- **Pro**: Graceful degradation, user can still proceed
- **Pro**: Clear feedback about what happened
- **Con**: Slightly more complex UI logic

**UI Flow**:
```
1. User enters "東京タワー" and clicks search
2. Geocoding request to Nominatim
3a. Success path:
    - Coordinates fetched: { lat: 35.6586, lng: 139.7454 }
    - Location saved with coordinates
    - Map placeholder shows coordinates
3b. Failure path:
    - API returns empty results or error
    - Show in placeholder: "位置情報を取得できませんでしたが、ラベルとして保存します"
    - Show toast: "この場所の座標を取得できませんでした"
    - Location saved as text-only (coordinates = null)
    - User can still close modal and proceed
```

### 4. Mobile Responsive Buttons

**Decision**: Hide floating action buttons when location modal is open on mobile.

**Rationale**:
- Prevents z-index conflicts and visual clutter
- Modal should be the focus on mobile (limited screen space)
- Buttons return when modal closes (not permanent loss)

**Trade-offs**:
- **Pro**: Cleaner mobile UX, no overlapping elements
- **Con**: Buttons temporarily hidden (but restored on close)

**Implementation Strategy**:
```tsx
// Use Tailwind responsive utilities
const buttonClasses = `
  fixed right-6 bottom-8 z-40 flex flex-col gap-3
  ${locationModalOpen ? 'hidden md:flex' : 'flex'}
`
// Result:
// - Mobile (< 768px) + modal open = hidden
// - Mobile (< 768px) + modal closed = flex
// - Desktop (>= 768px) + any state = flex
```

**Breakpoint Choice**:
- Use 768px (Tailwind's `md:` breakpoint)
- Matches common tablet/mobile boundary
- Consistent with existing responsive patterns in the app

## Data Flow

### Geocoding Flow
```
User Input → CreateItineraryPage
  ↓
applyLocationSearch() → geocodeAddress(query)
  ↓
Nominatim API Request
  ↓
Success → { lat, lng, formattedAddress } → updateEntry()
  ↓
Failure → Error Message + Save as Label → updateEntry({ coordinates: null })
```

### Theme Flow
```
User Clicks Theme Button → setTheme(newTheme)
  ↓
ThemeContext State Update
  ↓
localStorage.setItem('theme', newTheme)
  ↓
useEffect → Update document.documentElement.classList
  ↓
Tailwind dark: classes activate/deactivate
```

## Performance Considerations

1. **Bundle Size**:
   - Removing `@react-google-maps/api` (~50KB gzipped)
   - Adding `leaflet` + `react-leaflet` (~40KB gzipped)
   - Net improvement: ~10KB smaller

2. **API Calls**:
   - Nominatim has rate limits (1 req/sec)
   - Consider debouncing search input
   - Consider caching results in localStorage

3. **Rendering**:
   - Leaflet map initialization is fast
   - No need to wait for API key validation
   - Dark mode doesn't require re-fetching tiles

## Security Considerations

1. **No API Key**: OpenStreetMap doesn't require API keys, reducing credential management risk
2. **User-Agent**: Must set appropriate User-Agent header per Nominatim policy
3. **Rate Limiting**: Respect Nominatim usage policy to avoid IP blocks
4. **XSS**: Sanitize location names if displaying in popups (React handles this by default)

## Testing Strategy

1. **Unit Tests**:
   - Test `geocodeAddress()` with mock Nominatim responses
   - Test theme migration logic
   - Test mobile button visibility logic

2. **Integration Tests**:
   - Test complete search → save flow
   - Test geocoding failure → save as label flow
   - Test theme switching

3. **Manual Testing**:
   - Test on real mobile devices (not just Chrome DevTools)
   - Test with various location queries (Japanese, English, addresses, landmarks)
   - Test with network throttling to simulate slow API responses

## Rollback Plan

If issues arise after deployment:
1. **Theme**: Can revert to 'auto' option easily (just add back the third button)
2. **Maps**: Can temporarily switch back to Google Maps by reverting geocoding.ts and map component
3. **Mobile**: Can remove conditional rendering to always show buttons

## Future Enhancements

1. **Caching**: Implement localStorage cache for geocoding results
2. **Debouncing**: Add search input debouncing to reduce API calls
3. **Dark Map Tiles**: Use different tile provider for dark mode (e.g., CartoDB Dark Matter)
4. **Offline Support**: Cache map tiles for offline viewing (PWA enhancement)
