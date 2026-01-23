import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import CreateItineraryPage from './pages/CreateItineraryPage'
import ItineraryAuthPage from './pages/ItineraryAuthPage'
import ItineraryPage from './pages/ItineraryPage'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateItineraryPage />} />
          <Route path="/itinerary/:id/auth" element={<ItineraryAuthPage />} />
          <Route path="/itinerary/:id" element={<ItineraryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
