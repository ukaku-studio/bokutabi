# Capability: Location display labels

## ADDED Requirements

### Requirement: Capture official place names with address fallback
The system SHALL store an official place name and an address when a map search result provides them, and SHALL use the official place name as the display label.

#### Scenario: Official name available
- **WHEN** a user searches a location and the geocoder provides both an official name and an address
- **THEN** the system stores both values and displays only the official name in the UI

#### Scenario: Official name unavailable
- **WHEN** a user selects a location and the geocoder does not provide an official name
- **THEN** the system stores the address and displays the address as the label

### Requirement: Consistent display in schedule panel and preview
The system SHALL apply the same display label logic in the create schedule panel and the preview itinerary view.

#### Scenario: Official name label
- **WHEN** a stop has an official name
- **THEN** both the schedule panel and the preview show the official name

#### Scenario: Address fallback label
- **WHEN** a stop lacks an official name but has an address
- **THEN** both the schedule panel and the preview show the address
