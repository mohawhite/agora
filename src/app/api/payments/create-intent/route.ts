import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createPaymentIntent } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { reservationId } = body

      if (!reservationId) {
        return NextResponse.json(
          { error: 'ID de réservation requis' },
          { status: 400 }
        )
      }

      // Vérifier que la réservation existe et appartient à l'utilisateur
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          salle: {
            include: {
              mairie: true
            }
          }
        }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 }
        )
      }

      if (reservation.userId !== user.id) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        )
      }

      if (reservation.status !== 'CONFIRMED') {
        return NextResponse.json(
          { error: 'Seules les réservations confirmées peuvent être payées' },
          { status: 400 }
        )
      }

      // Vérifier si un paiement existe déjà
      const existingPayment = await prisma.payment.findFirst({
        where: { reservationId }
      })

      if (existingPayment && existingPayment.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Cette réservation a déjà été payée' },
          { status: 400 }
        )
      }

      // Créer l'intention de paiement Stripe
      const paymentIntent = await createPaymentIntent(
        reservation.totalPrice,
        {
          reservationId: reservation.id,
          userId: user.id,
          salleName: reservation.salle.name,
          mairieId: reservation.salle.mairie.id.toString()
        }
      )

      // Créer ou mettre à jour l'enregistrement de paiement
      const payment = await prisma.payment.upsert({
        where: { reservationId },
        update: {
          stripePaymentIntentId: paymentIntent.id,
          amount: reservation.totalPrice,
          status: 'PENDING',
          updatedAt: new Date()
        },
        create: {
          reservationId,
          stripePaymentIntentId: paymentIntent.id,
          amount: reservation.totalPrice,
          status: 'PENDING'
        }
      })

      logger.info(`Payment intent créé: ${paymentIntent.id} pour la réservation ${reservationId}`)

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id
      })

    } catch (error) {
      logger.error('Erreur lors de la création du payment intent:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}