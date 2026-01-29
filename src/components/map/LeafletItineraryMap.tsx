import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ItineraryItem } from '../../types/itinerary'

// Fix default marker icon issue with Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

type LeafletIconDefaultWithUrl = L.Icon.Default & { _getIconUrl?: string }

delete (L.Icon.Default.prototype as LeafletIconDefaultWithUrl)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface ItineraryMapProps {
  items: ItineraryItem[]
  selectedItemId?: string | null
  onMarkerClick?: (item: ItineraryItem | null) => void
}

const defaultCenter: [number, number] = [35.6762, 139.6503] // Tokyo

export default function LeafletItineraryMap({ items, selectedItemId, onMarkerClick }: ItineraryMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 11,
      scrollWheelZoom: true,
    })

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // Add markers for items with coordinates
    const itemsWithCoords = items.filter(item => item.coordinates)

    if (itemsWithCoords.length === 0) {
      map.setView(defaultCenter, 5)
      return
    }

    itemsWithCoords.forEach((item) => {
      if (!item.coordinates) return

      const marker = L.marker([item.coordinates.lat, item.coordinates.lng])
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <p style="font-weight: 600; margin-bottom: 4px;">${item.title}</p>
            <p style="font-size: 12px; color: #666;">${item.location}</p>
          </div>
        `)

      marker.on('click', () => {
        onMarkerClick?.(item)
      })

      markersRef.current.set(item.id, marker)
    })

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(itemsWithCoords.map(item => [item.coordinates!.lat, item.coordinates!.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [items, onMarkerClick])

  useEffect(() => {
    if (!selectedItemId || !markersRef.current.has(selectedItemId)) return

    const marker = markersRef.current.get(selectedItemId)
    marker?.openPopup()
  }, [selectedItemId])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[360px] rounded-2xl border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 0 }}
    />
  )
}
