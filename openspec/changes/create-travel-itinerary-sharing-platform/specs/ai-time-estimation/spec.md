# AI Time Estimation

## ADDED Requirements

### Requirement: System automatically estimates travel time between destinations
When users add consecutive locations, the system calculates estimated travel time and duration.

#### Scenario: Calculating travel time
```gherkin
Given a user adds two consecutive itinerary items with locations
When the second item is saved
Then the system calculates travel time from the first to second location
And suggests arrival time based on departure from the first location
```

#### Scenario: Auto-filling suggested times
```gherkin
Given the system calculates a travel duration
When presenting the suggestion to the user
Then the user can accept the suggested time with one click
Or manually override with their own time
```

#### Scenario: Multiple transportation modes
```gherkin
Given a route between two locations
When calculating travel time
Then the system considers driving time as default
And optionally allows user to select (walking, transit, driving)
And adjusts estimates accordingly
```

### Requirement: Estimates account for typical visit duration
For well-known destinations, the system suggests typical visit duration.

#### Scenario: Suggesting visit duration
```gherkin
Given a user adds a destination (e.g., "Tokyo Disneyland")
When the location is recognized
Then the system suggests a typical visit duration (e.g., 8 hours)
And the user can accept or modify the suggestion
```

#### Scenario: Unknown destinations
```gherkin
Given a user adds a custom or unknown location
When no typical duration data exists
Then the system leaves duration blank
And the user can manually enter expected time
```

### Requirement: Time estimates update when locations change
If a user modifies locations or sequence, travel times are recalculated.

#### Scenario: Reordering items with time estimates
```gherkin
Given an itinerary with time estimates between items
When the user reorders items
Then travel times are recalculated for the new sequence
And the user is notified of the changes
```

#### Scenario: Editing location address
```gherkin
Given an item with a calculated travel time
When the user changes the location
Then the travel time is recalculated
And dependent times are updated
```
