# Localization and Theme

## ADDED Requirements

### Requirement: Platform supports Japanese and English languages
The system SHALL support both Japanese and English languages with automatic browser detection and user-configurable language switching.

#### Scenario: Auto-detecting browser language
```gherkin
Given a user visits the platform for the first time
When the page loads
Then the system detects the browser's language setting
And displays the UI in Japanese if browser language is "ja"
And displays the UI in English for all other languages
```

#### Scenario: Japanese language display
```gherkin
Given the system is set to Japanese
When viewing any page
Then all UI text, buttons, and labels are in Japanese
And date/time formats follow Japanese conventions
And currency defaults to JPY (¥)
```

#### Scenario: English language display
```gherkin
Given the system is set to English
When viewing any page
Then all UI text, buttons, and labels are in English
And date/time formats follow English conventions
And currency can be any standard currency
```

### Requirement: Users can change language in settings
The system SHALL provide a settings interface where users can manually change the language preference.

#### Scenario: Accessing language settings
```gherkin
Given a user is viewing an itinerary
When they tap the settings icon
Then a settings panel or page opens
And shows current language selection
And provides options to switch between Japanese and English
```

#### Scenario: Changing language
```gherkin
Given a user is in the settings panel
When they select a different language
Then the UI immediately updates to the selected language
And the preference is saved to localStorage
And persists across browser sessions
```

#### Scenario: Language persistence
```gherkin
Given a user has manually selected a language
When they return to the platform later
Then the manually selected language is used
And overrides the browser's default language setting
```

### Requirement: Platform supports light and dark modes
The system MUST support both light and dark color themes with automatic detection and user-configurable switching.

#### Scenario: Auto-detecting system theme preference
```gherkin
Given a user visits the platform for the first time
When the page loads
Then the system detects the OS/browser dark mode setting
And displays dark mode if prefers-color-scheme is "dark"
And displays light mode if prefers-color-scheme is "light"
```

#### Scenario: Dark mode appearance
```gherkin
Given the system is in dark mode
When viewing any page
Then the background is dark (near-black)
And text is light (white/light gray)
And colors have appropriate contrast for readability
And maps and images are slightly dimmed for comfort
```

#### Scenario: Light mode appearance
```gherkin
Given the system is in light mode
When viewing any page
Then the background is light (white/light gray)
And text is dark (black/dark gray)
And colors are vibrant and clear
```

#### Scenario: Switching theme in settings
```gherkin
Given a user is in the settings panel
When they toggle between light and dark mode
Then the UI immediately updates with smooth transition
And the preference is saved to localStorage
And persists across browser sessions
```

#### Scenario: Theme affects all UI elements
```gherkin
Given a theme is selected
Then all components respect the theme
Including buttons, forms, cards, navigation, and modals
And third-party components (maps) adapt where possible
```

### Requirement: Settings are simple and accessible
The settings interface MUST be minimal and easy to access.

#### Scenario: Settings panel design
```gherkin
Given a user opens settings
Then they see a simple panel with:
  - Language selector (日本語 / English)
  - Theme toggle (Light / Dark / Auto)
  - Close button
And no other complex options in MVP
```

#### Scenario: Auto theme option
```gherkin
Given a user selects "Auto" for theme
When the system theme changes (OS level)
Then the app automatically switches to match
And no manual intervention is needed
```
