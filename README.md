# Bokutabi - Travel Itinerary Planner

A mobile-first Progressive Web App for collaborative travel itinerary planning.

## Features

- 🗺️ **Simple Sharing**: Share itineraries via URL + password (no account required)
- 📱 **Mobile-First**: Optimized for mobile with responsive design for desktop
- ✈️ **Offline Mode**: PWA with offline viewing capability
- 👥 **Real-time Collaboration**: Multiple users can edit simultaneously
- 🗺️ **Map Integration**: Auto-geocoding with Google Maps
- 🤖 **AI Time Estimation**: Automatic travel time and duration suggestions
- 🌍 **i18n**: Japanese and English support with auto-detection
- 🌓 **Dark Mode**: Light/Dark themes with system preference detection

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Cloud Functions + Hosting)
- **Maps**: Google Maps API
- **i18n**: react-i18next
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bokutabi.git
cd bokutabi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Firebase and Google Maps credentials.

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication
4. Set up Cloud Functions (see `functions/` directory)
5. Deploy security rules: `firebase deploy --only firestore:rules`

## Project Structure

```
bokutabi/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components (routes)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and Firebase config
│   ├── i18n/           # Translations (ja, en)
│   ├── types/          # TypeScript types
│   ├── context/        # React contexts
│   └── App.tsx         # Main app with routing
├── functions/          # Firebase Cloud Functions
├── public/             # Static assets
└── openspec/           # Design specifications
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `firebase deploy` - Deploy to Firebase

## Implementation Status

This project is currently in Phase 1 of implementation. See `openspec/changes/create-travel-itinerary-sharing-platform/tasks.md` for detailed task list.

### Completed
- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS configuration
- ✅ React Router setup
- ✅ i18n configuration (Japanese/English)
- ✅ Dark mode with system preference detection
- ✅ Basic Firebase configuration
- ✅ PWA configuration

### In Progress
- 🔄 Database schema and TypeScript models
- 🔄 Firebase Cloud Functions for API endpoints
- 🔄 Authentication flow

### Planned
- ⏳ Itinerary creation and editing
- ⏳ Real-time collaboration
- ⏳ Map integration with geocoding
- ⏳ AI time estimation
- ⏳ Offline support

## Contributing

This is a personal project, but suggestions and feedback are welcome! Please open an issue to discuss any changes.

## License

MIT

## Acknowledgments

- Built with ❤️ using React and Firebase
- Designed with simplicity and mobile-first in mind
- Icons from [emoji]
