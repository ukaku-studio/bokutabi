# Change: Prefer official location names in schedule panels and previews

## Why
- Map search selections like "羽田空港" currently save the address string into the schedule panel.
- The schedule panel and preview should surface the official place name when available while still retaining the address internally.

## What Changes
- Extend geocoding results to capture an official place name (when available) and a full address.
- Store both values on the stop entry; treat the official name as the display label.
- When no official name exists, fall back to displaying the address.
- Align display logic across the schedule panel on the create page and the preview page.
- When two consecutive panels have locations (and the previous panel has a time), request OpenStreetMap routing durations and surface them as selectable arrival-time suggestions.
- Fall back to the existing mock suggestions when routing data is unavailable.

## Impact
- UI: create itinerary schedule panel, preview itinerary list.
- Data: stop entry fields to store official name + address.
- Geocoding integration.
- Travel-time suggestions logic (routing fetch + suggestion options).
