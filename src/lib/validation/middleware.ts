import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { validateWithJoi } from './joi-schemas'
import logger from '../logger'

export function withValidation<T>(schema: Joi.ObjectSchema) {
  return function(handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Parse request body
        let body: unknown
        try {
          body = await req.json()
        } catch (error) {
          logger.warn('Invalid JSON in request body')
          return NextResponse.json(
            { error: 'Corps de requête JSON invalide' },
            { status: 400 }
          )
        }

        // Validate with Joi
        const { value, error } = validateWithJoi<T>(schema, body)
        
        if (error) {
          logger.warn('Validation error:', error)
          return NextResponse.json(
            { 
              error: 'Données invalides',
              details: error
            },
            { status: 400 }
          )
        }

        // Call the handler with validated data
        return await handler(req, value)

      } catch (error) {
        logger.error('Validation middleware error:', error)
        return NextResponse.json(
          { error: 'Erreur serveur interne' },
          { status: 500 }
        )
      }
    }
  }
}

export function withQueryValidation<T>(schema: Joi.ObjectSchema) {
  return function(handler: (req: NextRequest, validatedQuery: T) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Parse query parameters
        const { searchParams } = new URL(req.url)
        const queryObject = Object.fromEntries(searchParams.entries())

        // Validate with Joi
        const { value, error } = validateWithJoi<T>(schema, queryObject)
        
        if (error) {
          logger.warn('Query validation error:', error)
          return NextResponse.json(
            { 
              error: 'Paramètres de requête invalides',
              details: error
            },
            { status: 400 }
          )
        }

        // Call the handler with validated query
        return await handler(req, value)

      } catch (error) {
        logger.error('Query validation middleware error:', error)
        return NextResponse.json(
          { error: 'Erreur serveur interne' },
          { status: 500 }
        )
      }
    }
  }
}

// Middleware pour validation des params d'URL
export function withParamsValidation<T>(schema: Joi.ObjectSchema) {
  return function(handler: (req: NextRequest, validatedParams: T, context: any) => Promise<NextResponse>) {
    return async function(req: NextRequest, context: any): Promise<NextResponse> {
      try {
        // Validate URL params
        const { value, error } = validateWithJoi<T>(schema, context.params)
        
        if (error) {
          logger.warn('Params validation error:', error)
          return NextResponse.json(
            { 
              error: 'Paramètres d\'URL invalides',
              details: error
            },
            { status: 400 }
          )
        }

        // Call the handler with validated params
        return await handler(req, value, context)

      } catch (error) {
        logger.error('Params validation middleware error:', error)
        return NextResponse.json(
          { error: 'Erreur serveur interne' },
          { status: 500 }
        )
      }
    }
  }
}

// Schemas pour les paramètres communs
export const idParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'L\'ID est requis'
  })
})

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
})