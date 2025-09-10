import { prisma } from './prisma'
import logger from './logger'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'RESERVATION' | 'PAYMENT' | 'SYSTEM'
  relatedId?: string
  actionUrl?: string
}

export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedId: data.relatedId,
        actionUrl: data.actionUrl,
        read: false
      }
    })

    logger.info(`Notification créée: ${notification.id} pour utilisateur ${data.userId}`)
    
    // Optionnel: Envoyer push notification si l'utilisateur a donné son consentement
    await sendPushNotification(data.userId, {
      title: data.title,
      body: data.message,
      url: data.actionUrl
    })

    return notification
  } catch (error) {
    logger.error('Erreur lors de la création de notification:', error)
    throw error
  }
}

export async function sendPushNotification(userId: string, payload: {
  title: string
  body: string
  url?: string
}) {
  try {
    // Récupérer les subscriptions push de l'utilisateur
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) {
      return // Pas de subscription, pas de push
    }

    // Envoyer à toutes les subscriptions actives
    const promises = subscriptions.map(async (sub) => {
      try {
        const webpush = await import('web-push')
        
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
          logger.error('Clés VAPID manquantes')
          return
        }

        webpush.setVapidDetails(
          'mailto:contact@agora.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        )

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dhKey,
              auth: sub.authKey
            }
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            url: payload.url || '/',
            timestamp: Date.now()
          })
        )

        logger.info(`Push notification envoyée à ${userId}`)
      } catch (error) {
        logger.error('Erreur push notification:', error)
        
        // Si la subscription est invalide, la supprimer
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          })
        }
      }
    })

    await Promise.allSettled(promises)
  } catch (error) {
    logger.error('Erreur système push notifications:', error)
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
  } catch (error) {
    logger.error('Erreur marquer notification comme lue:', error)
    throw error
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return notifications
  } catch (error) {
    logger.error('Erreur récupération notifications:', error)
    throw error
  }
}