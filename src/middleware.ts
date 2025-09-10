import { NextRequest, NextResponse } from 'next/server'
import { withCors, getEnvironmentCors, rateLimitByOrigin } from './lib/cors'
import logger from './lib/logger'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // Apply CORS to API routes
  if (pathname.startsWith('/api/')) {
    // Check rate limiting
    if (!rateLimitByOrigin(100, 60000)(request)) {
      logger.logSecurity('Rate limit exceeded', {
        origin: request.headers.get('origin'),
        ip: request.headers.get('x-forwarded-for'),
        path: pathname
      }, 'warn')
      
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }

    // Apply CORS
    const corsHandler = withCors(getEnvironmentCors())
    
    // For OPTIONS requests, handle immediately
    if (request.method === 'OPTIONS') {
      return corsHandler(() => Promise.resolve(new NextResponse(null, { status: 204 })))(request)
    }

    // For other requests, let them proceed and add CORS headers
    const response = NextResponse.next()
    
    // Apply CORS headers
    const corsConfig = getEnvironmentCors()
    const origin = request.headers.get('origin')
    
    if (origin && corsConfig.origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    if (corsConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    // Log API request
    const responseTime = Date.now() - startTime
    logger.http(`API ${request.method} ${pathname}`, {
      method: request.method,
      path: pathname,
      origin: origin || 'direct',
      userAgent: request.headers.get('user-agent'),
      responseTime: `${responseTime}ms`
    })

    return response
  }

  // Security headers for all routes
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // CSP for enhanced security
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' *.stripe.com;"
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}