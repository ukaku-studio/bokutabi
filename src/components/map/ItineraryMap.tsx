import type { ItineraryItem } from '../../types/itinerary'
import { GoogleMap, InfoWindow, Marker, useLoadScript } from '@react-google-maps/api'
import type { Library } from '@googlemaps/js-api-loader/dist/index'

const mapContainerStyle = { width: '100%', height: '360px' }
const libraries: Library[] = ['places']

interface ItineraryMapProps {
  items: ItineraryItem[]
  selectedItemId?: string | null
  onMarkerClick?: (item: ItineraryItem | null) => void
}

const defaultCenter = { lat: 35.6762, lng: 139.6503 }

export default function ItineraryMap({ items, selectedItemId, onMarkerClick }: ItineraryMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 p-6 text-sm text-gray-600 dark:text-gray-300">
        Google Maps API key is not configured. Set <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to view the map.
      </div>
    )
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries
  })

  if (loadError) {
    return (
      <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 dark:bg-red-900/30 p-6 text-sm text-red-700">
        Unable to load the map. Please check the API key and network connectivity.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 text-sm text-gray-500 dark:text-gray-400">
        Loading map…
      </div>
    )
  }

  const selectedItem = items.find((item) => item.id === selectedItemId)
  const center = items.length
    ? { lat: items[0].coordinates!.lat, lng: items[0].coordinates!.lng }
    : defaultCenter

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={items.length ? 11 : 5}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        minZoom: 4
      }}
    >
      {items.map((item) => (
        <Marker
          key={item.id}
          position={{ lat: item.coordinates!.lat, lng: item.coordinates!.lng }}
          label={{
            text: item.title,
            className: 'text-xs font-semibold text-white'
          }}
          onClick={() => onMarkerClick?.(item)}
        />
      ))}

      {selectedItem && selectedItem.coordinates && (
        <InfoWindow
          position={{ lat: selectedItem.coordinates.lat, lng: selectedItem.coordinates.lng }}
          onCloseClick={() => onMarkerClick?.(null)}
        >
          <div className="max-w-xs">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{selectedItem.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedItem.location}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
