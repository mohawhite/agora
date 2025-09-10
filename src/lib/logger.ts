import winston from 'winston'
import path from 'path'
import { createStream } from 'rotating-file-stream'

const { combine, timestamp, errors, json, colorize, simple, printf, prettyPrint } = winston.format

// Custom format for detailed logging
const customFormat = printf(({ timestamp, level, message, service, stack, ...meta }) => {
  let log = `${timestamp} [${service}] ${level.toUpperCase()}: ${message}`
  
  if (stack) {
    log += `\n${stack}`
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`
  }
  
  return log
})

// Rotating file stream for logs
const createRotatingTransport = (filename: string, level?: string) => {
  const stream = createStream(filename, {
    size: '10M', // 10MB per file
    interval: '1d', // rotate daily
    maxFiles: 30, // keep 30 days
    path: path.join(process.cwd(), 'logs')
  })

  return new winston.transports.Stream({
    stream,
    level,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    )
  })
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { 
    service: 'agora',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs with rotation
    createRotatingTransport('error.log', 'error'),
    
    // Combined logs with rotation
    createRotatingTransport('combined.log'),
    
    // API access logs
    createRotatingTransport('api.log', 'http'),
    
    // Security logs
    createRotatingTransport('security.log', 'warn'),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    createRotatingTransport('exceptions.log')
  ],
  rejectionHandlers: [
    createRotatingTransport('rejections.log')
  ],
  exitOnError: false
})

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`
        if (stack) {
          log += `\n${stack}`
        }
        return log
      })
    )
  }))
}

// Add request logging capabilities
logger.logRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    contentLength: res.get('content-length') || 0
  }
  
  logger.http('API Request', logData)
}

// Add security logging
logger.logSecurity = (event: string, details: any, severity: 'warn' | 'error' = 'warn') => {
  logger.log(severity, `Security Event: ${event}`, {
    securityEvent: true,
    event,
    ...details,
    timestamp: new Date().toISOString()
  })
}

// Add performance logging
logger.logPerformance = (operation: string, duration: number, metadata?: any) => {
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    performanceEvent: true,
    operation,
    duration,
    ...metadata
  })
}

// Add user activity logging
logger.logActivity = (userId: string, action: string, details?: any) => {
  logger.info(`User Activity: ${action}`, {
    activityEvent: true,
    userId,
    action,
    ...details
  })
}

export default logger