# Change: Suggest travel time autofill between consecutive stops

## Why
- Users want the next panel time to be auto-suggested when two consecutive stops are set.
- The UX should offer rough travel-time options and let users choose, instead of forcing manual calculations.
- For now, the product needs a mock implementation while preparing for a future routing API integration.

## What Changes
- Add mock travel-time suggestions when a previous stop has time + location and the next stop has a location.
- Show multiple travel mode options (walking/transit/driving) and compute a suggested arrival time.
- Selecting a suggestion fills the next panel time (and date when crossing midnight).
- If the next panel already has a time, prompt for confirmation before overwriting it.
- Preview screen continues to display the values as entered in the create screen.

## Impact
- Create itinerary UI (schedule panels) and related state handling.
- New mock travel-time calculation helper.
- Minor UI additions for suggestion chips and overwrite confirmation.
