import winston from 'winston'
import path from 'path'

const { combine, timestamp, errors, json, colorize, simple, printf } = winston.format

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

// Simple file transport (no rotation for Edge Runtime compatibility)
const createFileTransport = (filename: string, level?: string) => {
  return new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', filename),
    level,
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    ),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
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
    // Error logs
    createFileTransport('error.log', 'error'),
    
    // Combined logs
    createFileTransport('combined.log'),
    
    // API access logs
    createFileTransport('api.log', 'http'),
    
    // Security logs
    createFileTransport('security.log', 'warn'),
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    createFileTransport('exceptions.log')
  ],
  rejectionHandlers: [
    createFileTransport('rejections.log')
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