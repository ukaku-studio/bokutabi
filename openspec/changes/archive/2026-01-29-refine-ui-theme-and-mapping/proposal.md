# Change: Refine UI theme settings and map integration

## Why

Currently, the application has several UI/UX issues that need to be addressed:

1. **Theme Settings**: The "auto" theme option exists but may not be needed if we want users to make explicit light/dark choices
2. **Mapping Provider**: The application uses Google Maps API, but we want to migrate to OpenStreetMap for better flexibility and cost control
3. **Error Handling**: When geocoding fails (location cannot be found), there's no clear feedback to users about saving as a label-only location
4. **Mobile UX**: On mobile devices, the location modal doesn't hide the save/preview buttons, which can cause layout issues and confusion

## What Changes

This change addresses the following UI/UX improvements:

### 1. Theme Settings Refinement
- Remove the "auto" theme option from the theme selector
- Update theme type to only support 'light' | 'dark'
- Adjust default theme behavior when auto is no longer available
- Update i18n translation files to remove auto theme references

### 2. Map Provider Migration
- Replace Google Maps API with OpenStreetMap
- Update geocoding service to use Nominatim (OpenStreetMap's geocoding service)
- Update map display component to use Leaflet/React-Leaflet instead of @react-google-maps/api
- Remove Google Maps API key dependency

### 3. Geocoding Error Handling
- Add user-visible feedback when geocoding fails
- Display message on the mock map placeholder: "位置情報を取得できませんでしたが、ラベルとして保存します" (Could not fetch location data, will save as label)
- Allow users to proceed with saving location as text-only (without coordinates)

### 4. Mobile Responsiveness for Location Modal
- Hide save and preview buttons when location modal is open on mobile devices
- Use media query or viewport width detection to determine mobile state
- Restore button visibility when modal is closed

## Impact

### Affected Specs
This change will require new specs for:
- `ui/theme-settings` - Theme selection behavior
- `features/location-search` - Location search and geocoding
- `ui/mobile-responsiveness` - Mobile layout behavior

### User-Facing Changes
- Users will no longer see "auto" theme option (breaking change for users who rely on system preference)
- Users will experience OpenStreetMap instead of Google Maps (visual difference in map style)
- Better error messages when location search fails
- Improved mobile experience when selecting locations

### Technical Dependencies
- Add new dependencies: `leaflet`, `react-leaflet`
- Remove dependencies: `@react-google-maps/api`, `@googlemaps/js-api-loader`
- Update environment variables: remove `VITE_GOOGLE_MAPS_API_KEY`

### Breaking Changes
- Theme type changes from `'light' | 'dark' | 'auto'` to `'light' | 'dark'`
- Existing users with theme preference set to 'auto' will need to be migrated (default to 'light')

## Alternatives Considered

1. **Keep auto theme**: We could keep the auto option, but removing it simplifies the UI and reduces user choice fatigue
2. **Keep Google Maps**: We could continue using Google Maps, but OpenStreetMap provides better cost control and flexibility
3. **Show error in modal**: Instead of showing error on the map placeholder, we could show it in a toast/alert, but the inline approach is more contextual

## Open Questions

1. Should we migrate existing localStorage theme='auto' users to 'light' or 'dark'? (Recommend: check system preference one time and set accordingly)
2. Do we need a rate limit strategy for Nominatim API calls? (Nominatim has usage policies)
3. Should we cache geocoding results to avoid repeated API calls for the same location?
