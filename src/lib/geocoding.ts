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
  if (language) {
    url.searchParams.set('accept-language', language)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'BOKUTABI/1.0 (Travel Itinerary Planner)',
      ...(language ? { 'Accept-Language': language } : {})
    }
  })

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`)
  }

  const data = await response.json()

  if (!data || data.length === 0) {
    throw new Error('No results found for this location')
  }

  const result = data[0]

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formattedAddress: result.display_name
  }
}
