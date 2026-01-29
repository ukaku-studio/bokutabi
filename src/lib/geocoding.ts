export type GeocodingResult = {
  lat: number
  lng: number
  formattedAddress: string
}

export async function geocodeAddress(address: string, language?: string): Promise<GeocodingResult> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', address)
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  if (language) {
    url.searchParams.set('accept-language', language)
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`)
  }

  const data = await response.json()

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No results found for this location')
  }

  const result = data[0]

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formattedAddress: result.display_name
  }
}
