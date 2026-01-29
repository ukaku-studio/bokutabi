# Design: Official location names

## Data model
- Add storage for both the official place name and the address when a map search result is applied.
- Continue to use a single display label in the UI: `officialName` when present, otherwise `address`.
- Preserve backwards compatibility: existing entries that only have `location` (address) still render correctly.

## Geocoding mapping
- Request geocoding fields that include an official name when available (e.g., Nominatim `name` or `namedetails`).
- Map to:
  - `officialName`: preferred label for UI display.
  - `address`: full address string for internal storage.
- If `officialName` is missing or empty, set display label to `address`.

## UI display
- Schedule panel and preview page use the same display label logic: `officialName ?? address`.
- Address is not shown in the UI when an official name exists.
