# Offline Access

## ADDED Requirements

### Requirement: Platform functions as a Progressive Web App
The application must be installable and work offline to support travelers without reliable internet access.

#### Scenario: Installing PWA
```gherkin
Given a user accesses the platform on mobile
When the browser prompts to install
Then the user can add it to their home screen
And it launches like a native app
```

#### Scenario: Loading cached itinerary offline
```gherkin
Given a user has previously viewed an itinerary while online
When they open the same itinerary without internet
Then the last viewed version is displayed from cache
And they can browse all previously loaded data
```

#### Scenario: Offline indicator
```gherkin
Given the user is offline
Then the UI shows an offline indicator
And indicates which data may be stale
```

### Requirement: Service worker caches essential resources
The platform must cache HTML, CSS, JS, and itinerary data for offline functionality.

#### Scenario: Caching on first visit
```gherkin
Given a user visits an itinerary while online
When the page loads
Then the service worker caches all essential resources
And the itinerary data
```

#### Scenario: Updating cache
```gherkin
Given cached itinerary data exists
When the user goes online
Then the cache is updated with the latest data
And changes are synchronized
```

### Requirement: Offline editing is handled gracefully
Users attempting to edit offline are informed that changes require connectivity.

#### Scenario: Attempting to edit offline
```gherkin
Given a user is viewing an itinerary offline
When they attempt to edit
Then they see a message that editing requires internet
And changes are not lost if queued for sync
```

#### Scenario: Sync on reconnection
```gherkin
Given a user made changes that were queued
When internet connection is restored
Then queued changes are synchronized
And conflicts are resolved with last-write-wins
```
