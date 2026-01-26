export type GeocodingResult = {
  lat: number
  lng: number
  formattedAddress: string
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`)
  }

  const data = await response.json()

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(`Geocoding failed: ${data.status}`)
  }

  const result = data.results[0]
  const { lat, lng } = result.geometry.location

  return {
    lat,
    lng,
    formattedAddress: result.formatted_address
  }
}
