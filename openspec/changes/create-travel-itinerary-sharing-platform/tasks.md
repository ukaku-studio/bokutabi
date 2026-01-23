# Implementation Tasks

This document outlines the implementation tasks in priority order. Each task is designed to deliver user-visible progress incrementally.

## Phase 1: Foundation & Basic Functionality

### 1. Project Setup
- [x] Initialize Vite + React + TypeScript project (`npm create vite@latest`)
- [x] Configure Tailwind CSS for styling with dark mode support
- [x] Install and configure React Router v6
- [x] Set up Firebase project and obtain credentials
- [x] Configure Firebase SDK in React app
- [x] Set up environment variables (.env with VITE_ prefix)
- [x] Create basic project structure (components, pages, lib, types, i18n)
- [x] Configure TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Install and configure react-i18next + i18next-browser-languagedetector
- [x] Set up locale files for Japanese and English (src/i18n/locales/)
- [x] Configure dark mode with Tailwind CSS class strategy
- [x] Install and configure vite-plugin-pwa for PWA support
- [ ] Set up Firebase Cloud Functions project (functions/ directory) - *Pending Firebase project creation*
- [ ] Configure Cloud Functions with TypeScript - *Pending Firebase project creation*

**Validation**: ✅ `npm run dev` starts without errors (http://localhost:5173), theme toggle works, language switches (EN/日本語), routing works
**Note**: Firebase Cloud Functions setup requires actual Firebase project credentials. A placeholder `.env.example` has been created.

---

### 2. Database Schema & Models
- [x] Design Firestore data model for itineraries
  - Collection: `itineraries`
  - Fields: `id`, `title`, `dateRange`, `passwordHash`, `createdAt`, `updatedAt`
- [x] Design Firestore data model for itinerary items
  - Subcollection: `itineraries/{id}/items`
  - Fields: `id`, `date`, `time`, `title`, `location`, `address`, `coordinates`, `cost`, `currency`, `notes`, `order`, `estimatedDuration`, `travelTime`
- [x] Create TypeScript interfaces for data models
- [x] Create mock data for development (src/lib/mockData.ts)
- [x] Create mock API functions (src/lib/api.ts)
- [ ] Implement Firestore security rules for password-protected access - *Deferred until Firebase setup*

**Validation**: ✅ TypeScript interfaces created, mock data available, mock API functions working

---

### 3. Firebase Cloud Functions for API Endpoints
- [ ] Create Cloud Function: `createItinerary`
  - Accept itinerary data + password
  - Hash password with bcrypt
  - Generate unique ID
  - Save to Firestore
  - Return itinerary ID
- [ ] Create Cloud Function: `authenticateItinerary`
  - Accept itinerary ID + password
  - Verify password against hash
  - Generate Firebase Custom Token with itinerary claim
  - Return token
- [ ] Create Cloud Function: `updatePassword`
  - Verify current auth token
  - Hash new password
  - Update in Firestore
  - Return success
- [ ] Deploy Cloud Functions to Firebase
- [ ] Test Cloud Functions with Postman or curl

**Validation**: All Cloud Functions deploy successfully, respond correctly to API calls

---

### 4. Password-Protected Itinerary Creation (Frontend)
- [ ] Create landing page with "Create Itinerary" button (React Router route: `/`)
- [ ] Build itinerary creation form (title, date range, password)
- [ ] Call `createItinerary` Cloud Function from frontend
- [ ] Generate shareable URL using returned ID
- [ ] Navigate to itinerary view after creation (route: `/itinerary/:id`)
- [ ] Display shareable URL and password to creator

**Validation**: User can create itinerary, URL is unique, data persists in Firestore

---

### 5. Password Authentication & Access Control (Frontend)
- [ ] Create authentication page for shared URLs (route: `/itinerary/:id/auth`)
- [ ] Call `authenticateItinerary` Cloud Function with password
- [ ] Store returned Firebase Custom Token in localStorage
- [ ] Use token to sign in to Firebase Auth
- [ ] Handle incorrect password attempts with error messages
- [ ] Redirect to itinerary view on successful auth
- [ ] Implement logout/clear session functionality

**Validation**: Only users with correct password can access itinerary

---

### 6. Basic Itinerary Display (Frontend)
- [ ] Create itinerary view page (React Router route: `/itinerary/:id`)
- [ ] Fetch and display itinerary metadata (title, date range)
- [ ] Fetch and display itinerary items grouped by date using Firestore real-time listeners
- [ ] Implement responsive layout (mobile-first)
- [ ] Show items in chronological order
- [ ] Display loading states and error handling
- [ ] Protect route: redirect to auth page if not authenticated

**Validation**: Itinerary displays correctly on mobile and desktop, grouped by day

---

## Phase 2: Core Editing & Collaboration

### 7. Add & Edit Itinerary Items
- [ ] Create "Add Item" button and form modal
- [ ] Implement form fields: date, time, title, location, cost, notes
- [ ] Save new items to Firestore subcollection
- [ ] Implement real-time listener for Firestore updates
- [ ] Add inline editing for existing items
- [ ] Implement delete item functionality
- [ ] Add drag-and-drop reordering within a day

**Validation**: Users can add, edit, delete, and reorder items; changes persist

---

### 8. Real-Time Collaborative Editing
- [ ] Set up Firestore real-time listeners on itinerary items
- [ ] Implement optimistic UI updates for better UX
- [ ] Handle real-time sync across multiple clients
- [ ] Display changes from other users immediately (< 2 seconds)
- [ ] Implement conflict resolution (last-write-wins)
- [ ] Add visual feedback when data is syncing

**Validation**: Two users can edit simultaneously, see each other's changes in real-time

---

## Phase 3: Map Integration

### 9. Geocoding & Location Services
- [ ] Set up Google Maps API or Mapbox API key
- [ ] Implement geocoding service to convert addresses to coordinates
- [ ] Add location autocomplete to item form
- [ ] Store coordinates in Firestore with each item
- [ ] Handle geocoding errors gracefully (fallback to manual coordinates)
- [ ] Implement rate limiting or caching for API calls

**Validation**: Entering a location geocodes correctly, coordinates stored in database

---

### 10. Interactive Map Display
- [ ] Integrate map library (react-google-maps or react-map-gl)
- [ ] Create map component with responsive sizing
- [ ] Display markers for all itinerary items with locations
- [ ] Add click handlers to markers to show item details
- [ ] Implement day filtering to show only specific days
- [ ] Add route polylines between consecutive locations (optional)
- [ ] Ensure map works on mobile (touch gestures) and desktop (mouse controls)

**Validation**: Map displays all locations, markers clickable, responsive on mobile and desktop

---

## Phase 4: AI Time Estimation

### 11. Travel Time Calculation
- [ ] Integrate Google Maps Distance Matrix API or equivalent
- [ ] Implement service to calculate travel time between consecutive locations
- [ ] Support multiple travel modes (driving, walking, transit)
- [ ] Cache API results to minimize costs
- [ ] Display suggested travel time in UI when adding/editing items
- [ ] Allow users to accept or override suggested times
- [ ] Recalculate times when locations or order change

**Validation**: Adding consecutive items shows travel time suggestions, user can accept/override

---

### 12. Visit Duration Estimation
- [ ] Create database or service for common destination visit durations
- [ ] Implement heuristic algorithm for typical visit times (e.g., museums: 2-3h, theme parks: 6-8h)
- [ ] Suggest visit duration when adding known destinations
- [ ] Allow manual entry for unknown destinations
- [ ] Update schedule automatically when durations change

**Validation**: Known destinations suggest durations, unknown locations allow manual entry

---

## Phase 5: Offline Support (PWA)

### 13. Progressive Web App Setup
- [ ] Install and configure vite-plugin-pwa
- [ ] Create `manifest.json` for PWA (handled by plugin)
- [ ] Add app icons for various sizes (192x192, 512x512) to `public/`
- [ ] Configure Workbox for service worker caching strategies
- [ ] Implement cache-first strategy for static assets (JS, CSS, images)
- [ ] Implement network-first with cache fallback for itinerary data
- [ ] Configure service worker in vite.config.ts
- [ ] Test installation on mobile devices (iOS, Android)

**Validation**: App can be installed to home screen, launches like native app

---

### 14. Offline Viewing
- [ ] Cache itinerary data in IndexedDB or localStorage
- [ ] Implement offline detection (navigator.onLine)
- [ ] Show offline indicator in UI
- [ ] Load cached data when offline
- [ ] Display "stale data" warning if cache is old
- [ ] Sync cache with Firestore when online

**Validation**: Previously viewed itinerary loads offline, shows offline indicator

---

### 15. Offline Editing & Sync
- [ ] Queue edit operations when offline
- [ ] Store pending changes in IndexedDB
- [ ] Sync queued changes when connection restored
- [ ] Show "editing requires internet" message for offline edit attempts (MVP approach)
- [ ] Alternatively: Implement full offline editing with sync (more complex)
- [ ] Handle conflicts with last-write-wins strategy

**Validation**: Offline users see appropriate messaging, changes sync when reconnected

---

## Phase 6: Polish & Enhancements

### 16. Internationalization & Theming
- [ ] Create complete Japanese translation file (ja.json)
- [ ] Create complete English translation file (en.json)
- [ ] Implement language detection from browser settings
- [ ] Create language selector in settings panel
- [ ] Save language preference to localStorage
- [ ] Apply locale-specific date/time formatting
- [ ] Implement dark mode color scheme
- [ ] Create theme toggle in settings panel (Light/Dark/Auto)
- [ ] Save theme preference to localStorage
- [ ] Listen to system theme changes for "Auto" mode
- [ ] Test all UI components in both themes
- [ ] Ensure map and external components work in dark mode
- [ ] Test language switching on all pages
- [ ] Verify text is readable in both light and dark modes

**Validation**: Language switches correctly, theme toggles work, preferences persist across sessions

---

### 17. Responsive Design & Mobile UX
- [ ] Refine mobile layout for all pages
- [ ] Optimize touch targets for mobile (min 44x44px)
- [ ] Add mobile-friendly navigation (bottom nav or hamburger menu)
- [ ] Test on various screen sizes (iPhone SE, iPad, desktop)
- [ ] Improve form UX on mobile (native date/time pickers)
- [ ] Add haptic feedback where appropriate

**Validation**: All features work smoothly on mobile and desktop, no layout issues

---

### 18. Password Management
- [ ] Add "Change Password" functionality for itinerary creator
- [ ] Invalidate old sessions when password changes
- [ ] Add optional password strength indicator
- [ ] Consider optional password expiration or time-limited access

**Validation**: Password can be changed, old password no longer works

---

### 19. Cost Tracking & Summary
- [ ] Display total cost per day
- [ ] Display total trip cost
- [ ] Support multiple currencies (with basic conversion or separate totals)
- [ ] Add cost breakdown visualization (optional: charts)

**Validation**: Costs are tallied correctly, displayed per day and total

---

### 20. Testing & Documentation
- [ ] Write unit tests for critical functions (geocoding, time estimation, auth)
- [ ] Write integration tests for Firestore operations
- [ ] Test real-time sync with multiple clients
- [ ] Test PWA offline functionality across devices
- [ ] Write user documentation or help section
- [ ] Create README with setup instructions

**Validation**: Tests pass, documentation is clear and helpful

---

### 21. Deployment
- [ ] Build React app with Vite (`npm run build`)
- [ ] Deploy built app to Firebase Hosting
- [ ] Deploy Cloud Functions (`firebase deploy --only functions`)
- [ ] Configure custom domain (optional)
- [ ] SSL certificate is automatic with Firebase Hosting
- [ ] Configure environment variables in Firebase (functions config)
- [ ] Test production deployment end-to-end
- [ ] Monitor Firebase usage and costs

**Validation**: App is live, accessible via HTTPS, PWA works in production

---

## Future Enhancements (Post-MVP)
- [ ] User accounts for managing multiple itineraries
- [ ] Itinerary templates or public gallery
- [ ] Image uploads for destinations
- [ ] Weather integration
- [ ] Export to PDF or calendar (iCal)
- [ ] Social sharing (preview cards)
- [ ] Multi-language support
- [ ] Advanced conflict resolution (operational transforms)
- [ ] Revision history and undo functionality

---

## Dependencies & Parallelization

**Can be done in parallel:**
- Tasks 9 (Geocoding) and 11 (Travel Time) - both are API integrations
- Tasks 13-15 (PWA setup) can start after Phase 2 completes
- Task 16 (i18n & Theming) can be done early or late
- Task 17 (Responsive Design) can be ongoing throughout development

**Sequential dependencies:**
- Task 1 must complete before all others
- Task 3 (Cloud Functions) must be set up before Task 4 (Frontend creation flow)
- Tasks 2, 4, 5, 6 should be done in order (foundation for editing)
- Task 7 must complete before Task 8 (real-time editing requires items to exist)
- Task 9 must complete before Task 10 (map needs coordinates)
- Task 7 must complete before Task 11 (time estimation needs items)

**Critical path:**
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (enables basic collaborative editing)

Then:
- Branch 1: 9 → 10 (map features)
- Branch 2: 11 → 12 (AI features)
- Branch 3: 13 → 14 → 15 (offline features)

All branches converge at Task 16 (i18n & theme) → 17-21 (final features and deployment)
