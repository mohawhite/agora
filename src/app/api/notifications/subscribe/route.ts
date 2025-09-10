import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { subscription } = body

      if (!subscription || !subscription.endpoint) {
        return NextResponse.json(
          { error: 'Subscription invalide' },
          { status: 400 }
        )
      }

      // Vérifier si cette subscription existe déjà
      const existing = await prisma.pushSubscription.findFirst({
        where: {
          userId: user.id,
          endpoint: subscription.endpoint
        }
      })

      if (existing) {
        return NextResponse.json({
          message: 'Subscription déjà enregistrée'
        })
      }

      // Créer la nouvelle subscription
      await prisma.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth
        }
      })

      logger.info(`Push subscription créée pour utilisateur ${user.id}`)

      return NextResponse.json({
        message: 'Notifications push activées'
      })

    } catch (error) {
      logger.error('Erreur lors de la création de la push subscription:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { endpoint } = body

      if (!endpoint) {
        return NextResponse.json(
          { error: 'Endpoint requis' },
          { status: 400 }
        )
      }

      await prisma.pushSubscription.deleteMany({
        where: {
          userId: user.id,
          endpoint: endpoint
        }
      })

      logger.info(`Push subscription supprimée pour utilisateur ${user.id}`)

      return NextResponse.json({
        message: 'Notifications push désactivées'
      })

    } catch (error) {
      logger.error('Erreur lors de la suppression de la push subscription:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}