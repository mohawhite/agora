import { setCache, getCache, deleteCache, clearCachePattern } from './redis'
import logger from './logger'

// Cache management utilities
export class CacheManager {
  // Cache salles for search performance
  static async cacheSalles(city?: string, page: number = 1): Promise<any[]> {
    const cacheKey = `salles:${city || 'all'}:page:${page}`
    
    try {
      const cached = await getCache(cacheKey)
      if (cached) {
        logger.debug(`Cache hit for salles: ${cacheKey}`)
        return cached
      }
      
      // Si pas en cache, on retourne null et le composant fera l'appel API
      return null
    } catch (error) {
      logger.error('Error getting salles cache:', error)
      return null
    }
  }

  static async setSallesCache(salles: any[], city?: string, page: number = 1, ttl: number = 300) {
    const cacheKey = `salles:${city || 'all'}:page:${page}`
    
    try {
      await setCache(cacheKey, salles, ttl)
      logger.debug(`Salles cached: ${cacheKey}`)
    } catch (error) {
      logger.error('Error setting salles cache:', error)
    }
  }

  static async invalidateSallesCache(city?: string) {
    try {
      if (city) {
        await clearCachePattern(`salles:${city}:*`)
      } else {
        await clearCachePattern('salles:*')
      }
      logger.info(`Salles cache invalidated for city: ${city || 'all'}`)
    } catch (error) {
      logger.error('Error invalidating salles cache:', error)
    }
  }

  // Cache user data
  static async cacheUser(userId: string, userData: any, ttl: number = 300) {
    try {
      await setCache(`user:${userId}`, userData, ttl)
      logger.debug(`User cached: ${userId}`)
    } catch (error) {
      logger.error('Error caching user:', error)
    }
  }

  static async getCachedUser(userId: string): Promise<any | null> {
    try {
      const cached = await getCache(`user:${userId}`)
      if (cached) {
        logger.debug(`Cache hit for user: ${userId}`)
      }
      return cached
    } catch (error) {
      logger.error('Error getting user cache:', error)
      return null
    }
  }

  static async invalidateUserCache(userId: string) {
    try {
      await deleteCache(`user:${userId}`)
      logger.debug(`User cache invalidated: ${userId}`)
    } catch (error) {
      logger.error('Error invalidating user cache:', error)
    }
  }

  // Cache reservations
  static async cacheReservations(userId: string, reservations: any[], ttl: number = 60) {
    try {
      await setCache(`reservations:${userId}`, reservations, ttl)
      logger.debug(`Reservations cached for user: ${userId}`)
    } catch (error) {
      logger.error('Error caching reservations:', error)
    }
  }

  static async getCachedReservations(userId: string): Promise<any[] | null> {
    try {
      const cached = await getCache(`reservations:${userId}`)
      if (cached) {
        logger.debug(`Cache hit for reservations: ${userId}`)
      }
      return cached
    } catch (error) {
      logger.error('Error getting reservations cache:', error)
      return null
    }
  }

  static async invalidateReservationsCache(userId?: string) {
    try {
      if (userId) {
        await deleteCache(`reservations:${userId}`)
      } else {
        await clearCachePattern('reservations:*')
      }
      logger.debug(`Reservations cache invalidated for user: ${userId || 'all'}`)
    } catch (error) {
      logger.error('Error invalidating reservations cache:', error)
    }
  }

  // Generic cache utilities
  static async set(key: string, value: any, ttl: number = 300) {
    try {
      await setCache(key, value, ttl)
      logger.debug(`Cache set: ${key}`)
    } catch (error) {
      logger.error(`Error setting cache ${key}:`, error)
    }
  }

  static async get(key: string): Promise<any | null> {
    try {
      return await getCache(key)
    } catch (error) {
      logger.error(`Error getting cache ${key}:`, error)
      return null
    }
  }

  static async delete(key: string) {
    try {
      await deleteCache(key)
      logger.debug(`Cache deleted: ${key}`)
    } catch (error) {
      logger.error(`Error deleting cache ${key}:`, error)
    }
  }

  static async clear(pattern: string) {
    try {
      await clearCachePattern(pattern)
      logger.info(`Cache cleared for pattern: ${pattern}`)
    } catch (error) {
      logger.error(`Error clearing cache pattern ${pattern}:`, error)
    }
  }
}