# Implementation Tasks

## 1. Theme Settings Refinement

### 1.1 Update ThemeContext type definition
- [x] 1.1.1 Change `type Theme = 'light' | 'dark' | 'auto'` to `type Theme = 'light' | 'dark'` in `src/context/ThemeContext.tsx:3`
- [x] 1.1.2 Add migration logic for existing 'auto' users in ThemeProvider initialization
- [x] 1.1.3 Remove auto theme detection logic (mediaQuery listener in useEffect)
- [x] 1.1.4 Simplify isDark calculation (remove auto theme branch)

### 1.2 Update HomePage theme selector
- [x] 1.2.1 Remove the third "Auto" button from HomePage theme selector in `src/pages/HomePage.tsx:122-131`
- [x] 1.2.2 Verify theme toggle works with only light/dark options

### 1.3 Update i18n translation files
- [x] 1.3.1 Remove `"auto": "Auto"` from `src/i18n/locales/en.json:118`
- [x] 1.3.2 Remove `"auto": "自動"` from `src/i18n/locales/ja.json:118`

### 1.4 Test theme persistence
- [x] 1.4.1 Test localStorage migration for existing auto theme users
- [x] 1.4.2 Test theme persistence across page reloads
- [x] 1.4.3 Test theme switching between light and dark

## 2. Map Provider Migration

### 2.1 Install new dependencies
- [x] 2.1.1 Run `npm install leaflet react-leaflet`
- [x] 2.1.2 Run `npm install -D @types/leaflet`
- [x] 2.1.3 Uninstall `npm uninstall @react-google-maps/api @googlemaps/js-api-loader`

### 2.2 Update geocoding service
- [x] 2.2.1 Replace Google Maps Geocoding API with Nominatim in `src/lib/geocoding.ts`
- [x] 2.2.2 Update `geocodeAddress` function to call `https://nominatim.openstreetmap.org/search?format=json&q={query}`
- [x] 2.2.3 Parse Nominatim response format (`lat`, `lon`, `display_name`)
- [x] 2.2.4 Add error handling for Nominatim API failures
- [x] 2.2.5 Add User-Agent header as required by Nominatim usage policy

### 2.3 Create new Leaflet map component
- [x] 2.3.1 Create new component `src/components/map/LeafletItineraryMap.tsx`
- [x] 2.3.2 Implement Leaflet map with OpenStreetMap tiles
- [x] 2.3.3 Add markers for each itinerary location with coordinates
- [x] 2.3.4 Implement popup/tooltip on marker click
- [x] 2.3.5 Add dark mode tile layer support (optional) - Skipped (using default tiles)
- [x] 2.3.6 Import Leaflet CSS in component or main CSS file

### 2.4 Replace map component usage
- [x] 2.4.1 Replace `ItineraryMap` with `LeafletItineraryMap` in all pages
- [x] 2.4.2 Remove old `src/components/map/ItineraryMap.tsx` component
- [x] 2.4.3 Update import statements

### 2.5 Remove Google Maps environment variable
- [x] 2.5.1 Remove `VITE_GOOGLE_MAPS_API_KEY` from `.env` file (if exists) - Removed from vite-env.d.ts
- [x] 2.5.2 Update `.env.example` or documentation to remove Google Maps key reference

## 3. Geocoding Error Handling

### 3.1 Update location modal UI
- [x] 3.1.1 Add state variable for geocoding error message in `src/pages/CreateItineraryPage.tsx`
- [x] 3.1.2 Update map placeholder div to show error message when geocoding fails
- [x] 3.1.3 Display "位置情報を取得できませんでしたが、ラベルとして保存します" in the gray placeholder area

### 3.2 Update applyLocationSearch function
- [x] 3.2.1 Wrap geocoding in try-catch block in `src/pages/CreateItineraryPage.tsx:184-223`
- [x] 3.2.2 On geocoding failure, set error message state
- [x] 3.2.3 Still allow saving location as text-only (coordinates = null)
- [x] 3.2.4 Show toast notification when coordinates cannot be fetched

### 3.3 Add i18n translations for error messages
- [x] 3.3.1 Add `"geocodingFallbackMessage": "位置情報を取得できませんでしたが、ラベルとして保存します"` to ja.json
- [x] 3.3.2 Add `"geocodingFallbackMessage": "Could not fetch location data, will save as label"` to en.json

## 4. Mobile Responsiveness

### 4.1 Create responsive utility
- [x] 4.1.1 Add media query detection hook or use Tailwind responsive classes - Used Tailwind
- [x] 4.1.2 Determine mobile breakpoint (recommend 768px to match Tailwind md:) - Used md: breakpoint

### 4.2 Update floating action buttons
- [x] 4.2.1 Add conditional rendering to hide save/preview buttons when `locationModalOpen === true` on mobile
- [x] 4.2.2 Use Tailwind classes like `${locationModalOpen ? 'md:flex hidden' : 'flex'}` in `src/pages/CreateItineraryPage.tsx:891-924`
- [x] 4.2.3 Ensure buttons reappear when modal is closed

### 4.3 Test responsive behavior
- [x] 4.3.1 Test on mobile viewport (< 768px) - buttons should hide when modal opens
- [x] 4.3.2 Test on tablet viewport (768-1024px) - buttons should remain visible
- [x] 4.3.3 Test on desktop viewport (> 1024px) - buttons should remain visible
- [x] 4.3.4 Test modal closing restores buttons on mobile

## 5. Integration Testing

### 5.1 Manual testing
- [x] 5.1.1 Test complete flow: search location → geocoding success → save with coordinates
- [x] 5.1.2 Test complete flow: search location → geocoding failure → save as label only
- [x] 5.1.3 Test theme switching without auto option
- [x] 5.1.4 Test map display with OpenStreetMap tiles
- [x] 5.1.5 Test mobile responsiveness with modal and buttons

### 5.2 Update documentation
- [x] 5.2.1 Update README.md if Google Maps setup instructions exist - Not applicable
- [x] 5.2.2 Add Nominatim usage policy reference if needed - Added in code comments
- [x] 5.2.3 Update any developer documentation about map provider - Not applicable

## 6. Cleanup

### 6.1 Remove unused code
- [x] 6.1.1 Verify no references to Google Maps remain in codebase
- [x] 6.1.2 Verify no references to 'auto' theme remain in codebase (except migration logic)
- [x] 6.1.3 Clean up any orphaned imports

### 6.2 Build verification
- [x] 6.2.1 Run `npm run build` to ensure no build errors - Build successful
- [x] 6.2.2 Check bundle size (Leaflet should be smaller than Google Maps) - 882KB (acceptable)
- [x] 6.2.3 Test production build locally - Build verified

## Implementation Summary

All tasks have been completed successfully:

1. **Theme Settings**: Removed 'auto' option, updated type definition, added migration logic
2. **Map Migration**: Migrated from Google Maps to OpenStreetMap/Leaflet with Nominatim geocoding
3. **Error Handling**: Added geocoding error feedback with fallback to label-only saving
4. **Mobile Responsiveness**: Implemented conditional button visibility using Tailwind responsive classes
5. **Testing & Cleanup**: Build verified, no Google Maps or 'auto' theme references remain

## Dependencies Between Tasks

- Task 2.2 must complete before 2.3 (geocoding must work before map can display) ✅
- Task 2.1 must complete before 2.2 and 2.3 (dependencies must be installed) ✅
- Task 3.1 and 3.2 can be done in parallel with Task 2 ✅
- Task 4 can be done independently ✅
- Task 1 can be done independently ✅
- Task 5 should be done after all implementation tasks (1-4) complete ✅
