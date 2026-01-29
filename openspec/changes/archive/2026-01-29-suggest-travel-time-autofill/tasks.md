## 1. Baseline review
- [x] 1.1 Inspect create itinerary panel flow and time/location state.
- [x] 1.2 Confirm preview uses stored values without recomputation.

## 2. Mock travel-time helper
- [x] 2.1 Add a helper to return mock travel options (walking/transit/driving) with durations.
- [x] 2.2 Define deterministic duration rules for repeatable suggestions.

## 3. Suggestion UI + logic
- [x] 3.1 Show suggestion chips when previous stop has time+location and current stop has location.
- [x] 3.2 Compute suggested arrival time/date (handle midnight rollover).
- [x] 3.3 Add overwrite confirmation when current time is already set.

## 4. Validation
- [x] 4.1 Manual check: selecting a suggestion fills time/date and respects confirmation.
- [x] 4.2 Manual check: suggestions do not show when conditions are unmet.
