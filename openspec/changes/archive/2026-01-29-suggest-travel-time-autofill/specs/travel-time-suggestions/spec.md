# Capability: Travel time suggestions for consecutive stops

## ADDED Requirements

### Requirement: Offer mock travel-time suggestions for consecutive stops
The system SHALL show mock travel-time suggestions when a previous stop has a time and location, and the next stop has a location.

#### Scenario: Suggestions appear
- **WHEN** entry N has a time and location and entry N+1 has a location
- **THEN** the system displays travel-time options for entry N+1

#### Scenario: Suggestions hidden
- **WHEN** entry N lacks a time or location OR entry N+1 lacks a location
- **THEN** the system does not display travel-time options

### Requirement: Apply selected suggestion with date rollover
The system SHALL apply the selected suggestion to the next stop’s time (and date when crossing midnight).

#### Scenario: Same-day arrival
- **WHEN** a user selects a suggestion that does not cross midnight
- **THEN** the system sets the next stop time on the same date

#### Scenario: Midnight rollover
- **WHEN** a user selects a suggestion that crosses midnight
- **THEN** the system advances the date and sets the new time accordingly

### Requirement: Confirm overwrites
The system SHALL request confirmation before overwriting an existing time value.

#### Scenario: Existing time present
- **WHEN** the next stop already has a time and the user selects a suggestion
- **THEN** the system asks for confirmation before applying the update
