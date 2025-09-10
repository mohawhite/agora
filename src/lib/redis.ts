import { createClient } from 'redis'
import logger from './logger'

const client = createClient({
    username: 'default',
    password: '8VcAPIQ43YZV64IfcQyBhEiAfV1Goykx',
    socket: {
        host: 'redis-11226.crce202.eu-west-3-1.ec2.redns.redis-cloud.com',
        port: 11226
    }
})

client.on('error', err => {
    logger.error('Redis Client Error:', err)
})

client.on('connect', () => {
    logger.info('Redis client connected')
})

client.on('disconnect', () => {
    logger.warn('Redis client disconnected')
})

let isConnected = false

export async function connectRedis() {
    if (!isConnected) {
        try {
            await client.connect()
            isConnected = true
            logger.info('Redis connection established')
        } catch (error) {
            logger.error('Failed to connect to Redis:', error)
            throw error
        }
    }
    return client
}

export async function disconnectRedis() {
    if (isConnected) {
        await client.disconnect()
        isConnected = false
        logger.info('Redis connection closed')
    }
}

// Session management
export async function setSession(sessionToken: string, userId: string, expiresIn: number = 3600) {
    try {
        if (!isConnected) {
            await connectRedis()
        }
        await client.setEx(`session:${sessionToken}`, expiresIn, userId)
        logger.info(`Session created for user ${userId}`)
    } catch (error) {
        logger.error('Error setting session:', error)
        // Ne pas throw l'erreur pour éviter de casser l'inscription
    }
}

export async function getSession(sessionToken: string): Promise<string | null> {
    try {
        if (!isConnected) {
            await connectRedis()
        }
        const userId = await client.get(`session:${sessionToken}`)
        return userId
    } catch (error) {
        logger.error('Error getting session:', error)
        return null
    }
}

export async function deleteSession(sessionToken: string) {
    try {
        if (!isConnected) {
            await connectRedis()
        }
        await client.del(`session:${sessionToken}`)
        logger.info('Session deleted')
    } catch (error) {
        logger.error('Error deleting session:', error)
        // Ne pas throw l'erreur
    }
}

// Cache management
export async function setCache(key: string, value: any, expiresIn: number = 300) {
    try {
        const serializedValue = JSON.stringify(value)
        await client.setEx(`cache:${key}`, expiresIn, serializedValue)
        logger.debug(`Cache set for key: ${key}`)
    } catch (error) {
        logger.error('Error setting cache:', error)
        throw error
    }
}

export async function getCache(key: string): Promise<any | null> {
    try {
        const value = await client.get(`cache:${key}`)
        if (value) {
            return JSON.parse(value)
        }
        return null
    } catch (error) {
        logger.error('Error getting cache:', error)
        return null
    }
}

export async function deleteCache(key: string) {
    try {
        await client.del(`cache:${key}`)
        logger.debug(`Cache deleted for key: ${key}`)
    } catch (error) {
        logger.error('Error deleting cache:', error)
        throw error
    }
}

export async function clearCachePattern(pattern: string) {
    try {
        const keys = await client.keys(`cache:${pattern}`)
        if (keys.length > 0) {
            await client.del(keys)
            logger.info(`Cleared ${keys.length} cache entries for pattern: ${pattern}`)
        }
    } catch (error) {
        logger.error('Error clearing cache pattern:', error)
        throw error
    }
}

// Rate limiting
export async function checkRateLimit(identifier: string, limit: number = 100, window: number = 3600): Promise<boolean> {
    try {
        const key = `rate_limit:${identifier}`
        const current = await client.incr(key)
        
        if (current === 1) {
            await client.expire(key, window)
        }
        
        return current <= limit
    } catch (error) {
        logger.error('Error checking rate limit:', error)
        return true // En cas d'erreur, on autorise la requête
    }
}

export { client as redisClient }