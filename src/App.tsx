import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import CreateItineraryPage from './pages/CreateItineraryPage'
import ItineraryAuthPage from './pages/ItineraryAuthPage'
import ItineraryPage from './pages/ItineraryPage'
import PreviewItineraryPage from './pages/PreviewItineraryPage'
import BasicAuth from './middleware/BasicAuth'

// Enable basic auth only in development/staging (not production)
const isBasicAuthEnabled = import.meta.env.MODE !== 'production'

function App() {
  const content = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateItineraryPage />} />
      <Route path="/itinerary/:id/auth" element={<ItineraryAuthPage />} />
      <Route path="/itinerary/:id/preview" element={<PreviewItineraryPage />} />
      <Route path="/itinerary/:id" element={<ItineraryPage />} />
      <Route path="/preview" element={<PreviewItineraryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  return (
    <BrowserRouter>
      <ThemeProvider>
        {isBasicAuthEnabled ? <BasicAuth>{content}</BasicAuth> : content}
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
