# Map Integration

## ADDED Requirements

### Requirement: Locations are displayed on an interactive map
Each itinerary item with a location SHALL be visualized on a map for spatial context.

#### Scenario: Viewing locations on map
```gherkin
Given an itinerary with location data
When the user views the map
Then each location is shown as a marker
And markers are labeled with the destination name
```

#### Scenario: Map clustering by day
```gherkin
Given an itinerary spanning multiple days
When viewing the map
Then users can filter to show only specific days
And see the route for that day
```

#### Scenario: Interacting with markers
```gherkin
Given locations displayed on a map
When the user clicks a marker
Then the corresponding itinerary item details are shown
And the user can navigate to the full schedule view
```

### Requirement: Addresses are geocoded to coordinates
When users enter an address or location name, the system SHALL automatically search Google Maps and convert it to coordinates with map information embedded.

#### Scenario: Auto-searching location on input
```gherkin
Given a user types a location name in the input field
When they finish typing (or select from autocomplete)
Then the system automatically searches Google Maps
And retrieves coordinates, full address, and place details
And embeds the map information without requiring manual confirmation
```

#### Scenario: Geocoding location input
```gherkin
Given a user enters a location name or address
When the item is saved
Then the system geocodes it to latitude/longitude
And stores the coordinates and full address for map rendering
```

#### Scenario: Autocomplete suggestions
```gherkin
Given a user is typing a location name
When they type at least 3 characters
Then the system shows autocomplete suggestions from Google Places
And the user can select from the suggestions
And the selected place is automatically geocoded and embedded
```

#### Scenario: Failed geocoding
```gherkin
Given a user enters an ambiguous or invalid address
When geocoding fails or no results found
Then the user is shown "Location not found" message
And can enter a different location name
And the item can still be saved without map display
```

### Requirement: Map supports mobile and desktop
The map interface MUST be responsive and work on both mobile and desktop devices.

#### Scenario: Mobile map interaction
```gherkin
Given a user on a mobile device
When they view the map
Then touch gestures (pinch zoom, pan) work smoothly
And the map fits the screen responsively
```

#### Scenario: Desktop map interaction
```gherkin
Given a user on desktop
When they view the map
Then mouse controls (scroll zoom, drag) work intuitively
And the map layout complements the itinerary sidebar
```
