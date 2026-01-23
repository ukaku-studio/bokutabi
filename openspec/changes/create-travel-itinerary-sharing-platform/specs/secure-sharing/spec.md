# Secure Sharing

## ADDED Requirements

### Requirement: Itineraries are protected by password authentication
Each itinerary must have password protection to prevent unauthorized access while remaining simple to share.

#### Scenario: Setting itinerary password
```gherkin
Given a user creates a new itinerary
Then they must set a password
And the password is required for all future access
```

#### Scenario: Accessing shared itinerary
```gherkin
Given a user receives a shared itinerary URL
When they visit the URL
Then they are prompted for the password
And can view the itinerary only after entering the correct password
```

#### Scenario: Failed authentication
```gherkin
Given a user enters an incorrect password
Then access is denied
And they can retry with a different password
```

### Requirement: Shareable URLs provide easy access
Each itinerary has a unique, shareable URL that can be distributed to collaborators.

#### Scenario: Generating shareable URL
```gherkin
Given a user creates an itinerary
Then the system generates a unique URL
And the URL remains constant for the lifetime of the itinerary
```

#### Scenario: Sharing via URL
```gherkin
Given an itinerary with a URL and password
When the creator shares both with friends
Then friends can access the itinerary from any device
```

### Requirement: Password can be updated
The itinerary owner can change the password to revoke and re-grant access.

#### Scenario: Changing password
```gherkin
Given an authenticated user in an itinerary
When they change the password
Then the old password no longer grants access
And users must re-authenticate with the new password
```
