import { connectMongoDB } from './mongodb'
import { Activity, IActivity } from '@/models/Activity'
import logger from './logger'

export async function logActivity(data: {
  userId: string
  type: IActivity['type']
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await connectMongoDB()
    
    const activity = new Activity({
      userId: data.userId,
      type: data.type,
      description: data.description,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    })

    await activity.save()
    logger.debug(`Activity logged: ${data.type} for user ${data.userId}`)
  } catch (error) {
    logger.error('Error logging activity:', error)
    // Ne pas faire échouer la requête principale si le logging échoue
  }
}

export async function getUserActivities(userId: string, limit: number = 50): Promise<IActivity[]> {
  try {
    await connectMongoDB()
    
    const activities = await Activity
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return activities
  } catch (error) {
    logger.error('Error getting user activities:', error)
    return []
  }
}

export async function getRecentActivities(limit: number = 100): Promise<IActivity[]> {
  try {
    await connectMongoDB()
    
    const activities = await Activity
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return activities
  } catch (error) {
    logger.error('Error getting recent activities:', error)
    return []
  }
}

export async function getActivitiesByType(type: IActivity['type'], limit: number = 50): Promise<IActivity[]> {
  try {
    await connectMongoDB()
    
    const activities = await Activity
      .find({ type })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return activities
  } catch (error) {
    logger.error(`Error getting activities by type ${type}:`, error)
    return []
  }
}

export async function cleanOldActivities(daysToKeep: number = 90) {
  try {
    await connectMongoDB()
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate }
    })
    
    logger.info(`Cleaned ${result.deletedCount} old activities`)
    return result.deletedCount
  } catch (error) {
    logger.error('Error cleaning old activities:', error)
    throw error
  }
}