## 1. Baseline confirmation
- [x] 1.1 Trace current location fields used in create + preview flows.
- [x] 1.2 Confirm storage shape for stops and preview payloads.

## 2. Geocoding enhancements
- [x] 2.1 Extend geocoding result to return `officialName` and `address`.
- [x] 2.2 Apply mapping rules for official name vs address fallback.

## 3. UI display alignment
- [x] 3.1 Update schedule panel display to use `officialName ?? address`.
- [x] 3.2 Update preview page display to use `officialName ?? address`.

## 4. Routing suggestions (OpenStreetMap)
- [x] 4.1 Fetch OSRM route durations for consecutive panels with coordinates.
- [x] 4.2 Convert route durations into selectable arrival-time suggestions.
- [x] 4.3 Fall back to mock suggestions when routing is unavailable.

## 5. Validation
- [x] 5.1 Add/adjust tests if present for location display rules.
- [x] 5.2 Manual check: "羽田空港" shows official name; an address-only result shows address in both screens.
- [x] 5.3 Manual check: two panels with locations show OSRM-based time options and apply to the next panel.
