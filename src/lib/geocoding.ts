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

// Geocoding: adresse → coordonnées avec l'API Adresse du gouvernement français
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodedAddress}&limit=1`,
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
    
    if (!data.features || data.features.length === 0) {
      logger.warn(`No geocoding results found for address: ${address}`)
      return null
    }

    const result = data.features[0]
    const properties = result.properties
    const coordinates = result.geometry.coordinates
    
    return {
      lat: coordinates[1], // Latitude
      lng: coordinates[0], // Longitude
      address: properties.label, // Adresse complète
      city: properties.city,
      postalCode: properties.postcode,
      country: 'France'
    }
  } catch (error) {
    logger.error('Geocoding error:', error)
    return null
  }
}

// Reverse geocoding: coordonnées → adresse avec l'API Adresse du gouvernement français
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lng}&limit=1`,
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
    
    if (!data.features || data.features.length === 0) {
      logger.warn(`No reverse geocoding results found for coordinates: ${lat}, ${lng}`)
      return null
    }

    const result = data.features[0]
    const properties = result.properties
    
    return {
      address: properties.label,
      city: properties.city,
      postalCode: properties.postcode,
      country: 'France'
    }
  } catch (error) {
    logger.error('Reverse geocoding error:', error)
    return null
  }
}

// Recherche de lieux par nom avec l'API Adresse du gouvernement français
export async function searchPlaces(query: string, limit: number = 5): Promise<GeocodingResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodedQuery}&limit=${limit}&type=housenumber`,
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
    
    return (data.features || []).map((result: any) => {
      const properties = result.properties
      const coordinates = result.geometry.coordinates
      
      return {
        lat: coordinates[1], // Latitude
        lng: coordinates[0], // Longitude  
        address: properties.label, // Adresse complète
        city: properties.city,
        postalCode: properties.postcode,
        country: 'France'
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

// Ces fonctions ne sont plus nécessaires car l'API Adresse retourne directement les données structurées

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