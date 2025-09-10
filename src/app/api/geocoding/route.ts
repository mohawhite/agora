import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress, reverseGeocode, searchPlaces } from '@/lib/geocoding'
import { withQueryValidation } from '@/lib/validation/middleware'
import Joi from 'joi'
import logger from '@/lib/logger'

const geocodeQuerySchema = Joi.object({
  address: Joi.string().min(3).max(200).required().messages({
    'string.min': 'L\'adresse doit contenir au moins 3 caractères',
    'string.max': 'L\'adresse ne peut pas dépasser 200 caractères',
    'any.required': 'L\'adresse est requise'
  })
})

const reverseGeocodeQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude invalide',
    'number.max': 'Latitude invalide',
    'any.required': 'La latitude est requise'
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude invalide',
    'number.max': 'Longitude invalide',
    'any.required': 'La longitude est requise'
  })
})

const searchQuerySchema = Joi.object({
  q: Joi.string().min(2).max(100).required().messages({
    'string.min': 'La recherche doit contenir au moins 2 caractères',
    'string.max': 'La recherche ne peut pas dépasser 100 caractères',
    'any.required': 'Le terme de recherche est requis'
  }),
  limit: Joi.number().integer().min(1).max(20).default(5).messages({
    'number.min': 'Limite minimum: 1',
    'number.max': 'Limite maximum: 20'
  })
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'geocode':
        return await handleGeocode(request)
      case 'reverse':
        return await handleReverseGeocode(request)
      case 'search':
        return await handleSearch(request)
      default:
        return NextResponse.json(
          { error: 'Action invalide. Utilisez: geocode, reverse, ou search' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Erreur API geocoding:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

async function handleGeocode(request: NextRequest) {
  return withQueryValidation(geocodeQuerySchema)(async (req, query) => {
    const { address } = query
    
    const startTime = Date.now()
    const result = await geocodeAddress(address)
    const duration = Date.now() - startTime
    
    logger.logPerformance('Geocoding', duration, { address, found: !!result })
    
    if (!result) {
      return NextResponse.json(
        { error: 'Adresse non trouvée' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ result })
  })(request)
}

async function handleReverseGeocode(request: NextRequest) {
  return withQueryValidation(reverseGeocodeQuerySchema)(async (req, query) => {
    const { lat, lng } = query
    
    const startTime = Date.now()
    const result = await reverseGeocode(lat, lng)
    const duration = Date.now() - startTime
    
    logger.logPerformance('Reverse Geocoding', duration, { lat, lng, found: !!result })
    
    if (!result) {
      return NextResponse.json(
        { error: 'Coordonnées non trouvées' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ result })
  })(request)
}

async function handleSearch(request: NextRequest) {
  return withQueryValidation(searchQuerySchema)(async (req, query) => {
    const { q, limit } = query
    
    const startTime = Date.now()
    const results = await searchPlaces(q, limit)
    const duration = Date.now() - startTime
    
    logger.logPerformance('Places Search', duration, { query: q, count: results.length })
    
    return NextResponse.json({ results })
  })(request)
}