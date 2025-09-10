import logger from './logger'

export interface GeocodingResult {
  lat: number
  lng: number
  address: string
  city?: string
  postalCode?: string
  country?: string
}

export interface ReverseGeocodingResult {
  address: string
  city?: string
  postalCode?: string
  country?: string
}

// Geocoding: adresse → coordonnées
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=fr`,
      {
        headers: {
          'User-Agent': 'Agora/1.0 (contact@agora.com)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.length === 0) {
      logger.warn(`No geocoding results found for address: ${address}`)
      return null
    }

    const result = data[0]
    
    // Parse address components
    const addressParts = result.display_name.split(', ')
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      city: extractCity(addressParts),
      postalCode: extractPostalCode(addressParts),
      country: extractCountry(addressParts)
    }
  } catch (error) {
    logger.error('Geocoding error:', error)
    return null
  }
}

// Reverse geocoding: coordonnées → adresse
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Agora/1.0 (contact@agora.com)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.display_name) {
      logger.warn(`No reverse geocoding results found for coordinates: ${lat}, ${lng}`)
      return null
    }

    const address = data.address || {}
    
    return {
      address: data.display_name,
      city: address.city || address.town || address.village || address.municipality,
      postalCode: address.postcode,
      country: address.country
    }
  } catch (error) {
    logger.error('Reverse geocoding error:', error)
    return null
  }
}

// Recherche de lieux par nom
export async function searchPlaces(query: string, limit: number = 5): Promise<GeocodingResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=${limit}&countrycodes=fr&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Agora/1.0 (contact@agora.com)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Places search API error: ${response.status}`)
    }

    const data = await response.json()
    
    return data.map((result: any) => {
      const addressParts = result.display_name.split(', ')
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name,
        city: extractCity(addressParts),
        postalCode: extractPostalCode(addressParts),
        country: extractCountry(addressParts)
      }
    })
  } catch (error) {
    logger.error('Places search error:', error)
    return []
  }
}

// Calculer la distance entre deux points (formule Haversine)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Fonctions utilitaires pour extraire les composants d'adresse
function extractCity(addressParts: string[]): string | undefined {
  // Recherche de patterns typiques pour les villes françaises
  for (const part of addressParts) {
    if (part.match(/^\d{5}/)) {
      // Si on trouve un code postal, la ville est généralement juste après
      const index = addressParts.indexOf(part)
      if (index > 0) {
        return addressParts[index - 1]
      }
    }
  }
  
  // Fallback: prendre le 3ème élément s'il existe
  return addressParts[2]
}

function extractPostalCode(addressParts: string[]): string | undefined {
  for (const part of addressParts) {
    if (part.match(/^\d{5}$/)) {
      return part
    }
  }
  return undefined
}

function extractCountry(addressParts: string[]): string | undefined {
  // Le pays est généralement le dernier élément
  return addressParts[addressParts.length - 1]
}

// Valider que les coordonnées sont en France
export function isInFrance(lat: number, lng: number): boolean {
  // Approximation des frontières de la France métropolitaine
  return (
    lat >= 41.0 && lat <= 51.5 &&
    lng >= -5.5 && lng <= 10.0
  )
}

// Obtenir la région française basée sur les coordonnées (approximatif)
export function getFrenchRegion(lat: number, lng: number): string | null {
  if (!isInFrance(lat, lng)) return null
  
  // Régions simplifiées basées sur les coordonnées
  if (lat > 49.0) return 'Hauts-de-France'
  if (lat > 47.5 && lng < 2.0) return 'Normandie'
  if (lat > 47.5 && lng < 4.0) return 'Île-de-France'
  if (lat > 47.0 && lng < 2.0) return 'Pays de la Loire'
  if (lat > 47.0 && lng < 4.0) return 'Centre-Val de Loire'
  if (lat > 45.5 && lng < 2.0) return 'Nouvelle-Aquitaine'
  if (lat > 45.5 && lng < 4.0) return 'Auvergne-Rhône-Alpes'
  if (lat > 43.0 && lng < 2.0) return 'Occitanie'
  if (lat > 43.0) return 'Provence-Alpes-Côte d\'Azur'
  
  return 'France' // Fallback
}