# Design: Travel time suggestions (mock)

## Scope
- Apply to the create itinerary schedule panel only.
- Preview page displays the persisted time values without additional logic.

## Suggestion trigger
- Previous entry: has `time` and `location`.
- Current entry: has `location`.
- When conditions are met, show travel-time suggestions for the current entry.

## Mock routing
- Provide a helper that returns a small set of travel options (walking/transit/driving) with mock durations.
- Use a deterministic placeholder strategy to keep UX predictable (e.g., base minutes + small mode offsets).
- Future replacement: swap helper with a real routing API without changing UI contracts.

## Time application
- Suggested time = previous entry date + time + duration.
- If the result crosses midnight, advance the date accordingly.
- Only update the current entry’s date/time; do not modify other entries.

## Overwrite confirmation
- If current entry has a time already, show a confirm dialog before overwriting.
- Confirm only for the selected suggestion; dismiss on cancel.
