import { NextRequest, NextResponse } from 'next/server'
import logger from './logger'

interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

const defaultOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: [],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}

function isOriginAllowed(origin: string, allowedOrigin: CorsOptions['origin']): boolean {
  if (allowedOrigin === true) return true
  if (allowedOrigin === false) return false
  if (typeof allowedOrigin === 'string') return origin === allowedOrigin
  if (Array.isArray(allowedOrigin)) return allowedOrigin.includes(origin)
  if (typeof allowedOrigin === 'function') return allowedOrigin(origin)
  return false
}

export function withCors(options: CorsOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return function corsMiddleware(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const origin = req.headers.get('origin') || ''
      const method = req.method

      // Handle preflight requests
      if (method === 'OPTIONS') {
        const response = new NextResponse(null, { 
          status: opts.optionsSuccessStatus || 204 
        })

        // Set origin
        if (opts.origin !== false) {
          if (isOriginAllowed(origin, opts.origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin || '*')
          }
        }

        // Set credentials
        if (opts.credentials) {
          response.headers.set('Access-Control-Allow-Credentials', 'true')
        }

        // Set methods
        if (opts.methods) {
          response.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '))
        }

        // Set headers
        if (opts.allowedHeaders) {
          response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '))
        }

        // Set max age
        if (opts.maxAge) {
          response.headers.set('Access-Control-Max-Age', opts.maxAge.toString())
        }

        logger.debug(`CORS preflight request from origin: ${origin}`)
        return response
      }

      // Handle actual request
      try {
        const response = await handler(req)

        // Set CORS headers on the response
        if (opts.origin !== false) {
          if (isOriginAllowed(origin, opts.origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin || '*')
          }
        }

        if (opts.credentials) {
          response.headers.set('Access-Control-Allow-Credentials', 'true')
        }

        if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
          response.headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '))
        }

        // Log successful CORS request
        logger.debug(`CORS request allowed from origin: ${origin}`)

        return response
      } catch (error) {
        logger.error('Error in CORS middleware:', error)
        throw error
      }
    }
  }
}

// Predefined CORS configurations
export const corsConfigs = {
  // Development - allow all origins
  development: {
    origin: true,
    credentials: true
  },

  // Production - specific origins only
  production: {
    origin: [
      'https://agora.vercel.app',
      'https://agora.com',
      'https://www.agora.com'
    ],
    credentials: true
  },

  // API only - no browser origins
  api: {
    origin: false,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },

  // Public API - allow all with restrictions
  public: {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
}

// Environment-based CORS
export function getEnvironmentCors(): CorsOptions {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    return corsConfigs.production
  }
  
  return corsConfigs.development
}

// Rate limiting by origin
const originRequestCounts = new Map<string, { count: number; lastReset: number }>()

export function rateLimitByOrigin(maxRequests: number = 100, windowMs: number = 60000) {
  return function(req: NextRequest): boolean {
    const origin = req.headers.get('origin') || req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const originData = originRequestCounts.get(origin)
    
    if (!originData || now - originData.lastReset > windowMs) {
      originRequestCounts.set(origin, { count: 1, lastReset: now })
      return true
    }
    
    if (originData.count >= maxRequests) {
      logger.logSecurity('Rate limit exceeded', { origin, count: originData.count }, 'warn')
      return false
    }
    
    originData.count++
    return true
  }
}

export default withCors