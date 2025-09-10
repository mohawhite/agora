import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getUserNotifications, markNotificationAsRead } from '@/lib/notifications'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '20')
      
      const notifications = await getUserNotifications(user.id, limit)

      return NextResponse.json({ notifications })

    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { notificationId } = body

      if (!notificationId) {
        return NextResponse.json(
          { error: 'ID de notification requis' },
          { status: 400 }
        )
      }

      await markNotificationAsRead(notificationId, user.id)

      return NextResponse.json({
        message: 'Notification marquée comme lue'
      })

    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la notification:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}