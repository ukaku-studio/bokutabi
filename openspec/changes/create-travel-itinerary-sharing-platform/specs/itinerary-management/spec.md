# Itinerary Management

## ADDED Requirements

### Requirement: Users can create travel itineraries with comprehensive details
Users must be able to create new itineraries containing schedule information, locations, costs, and free-form notes to organize their trips.

#### Scenario: Creating a new itinerary
```gherkin
Given the user accesses the platform
When they create a new itinerary
Then they can set a trip title, date range, and initial password
And the system generates a unique shareable URL
```

#### Scenario: Adding itinerary items
```gherkin
Given an existing itinerary
When the user adds an item
Then they can specify:
  - Date and time
  - Location/destination name
  - Address or coordinates
  - Cost amount and currency
  - Free-form notes or comments
```

#### Scenario: Organizing itinerary by day
```gherkin
Given an itinerary with multiple items
When displayed to users
Then items are grouped by date
And shown in chronological order within each day
```

### Requirement: Users can edit and update itinerary details
Users with access can modify any aspect of the itinerary including items, schedule, and metadata.

#### Scenario: Editing itinerary items
```gherkin
Given an itinerary item
When the user edits it
Then all fields (time, location, cost, notes) can be updated
And changes are saved immediately
```

#### Scenario: Reordering items
```gherkin
Given multiple items on the same day
When the user drags to reorder
Then the sequence is updated
And reflected in the display
```

#### Scenario: Deleting items
```gherkin
Given an itinerary item
When the user deletes it
Then the item is removed from the schedule
And the deletion is synchronized across all viewers
```

### Requirement: Itinerary data persists reliably
All itinerary data must be stored persistently and be retrievable via the shareable URL.

#### Scenario: Data persistence
```gherkin
Given a user creates an itinerary
When they close the browser and return later
Then the itinerary is accessible via the same URL
And all data is preserved
```

#### Scenario: Multiple simultaneous viewers
```gherkin
Given an itinerary shared with multiple people
When one person views it
Then their viewing does not affect others' access
And all see the same current data
```
