import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object

      // Récupérer le paiement en base
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: {
          reservation: {
            include: {
              salle: {
                include: {
                  mairie: true
                }
              },
              user: true
            }
          }
        }
      })

      if (!payment || !payment.reservation) {
        logger.error(`Payment non trouvé pour PaymentIntent: ${paymentIntent.id}`)
        return NextResponse.json({ received: true })
      }

      // Mettre à jour le statut du paiement
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date()
        }
      })

      logger.info(`Paiement confirmé: ${payment.id} pour réservation ${payment.reservationId}`)

      // Envoyer un email de confirmation de paiement
      const reservation = payment.reservation
      const startDateFormatted = format(new Date(reservation.startDate), 'dd MMMM yyyy à HH:mm', { locale: fr })
      const endDateFormatted = format(new Date(reservation.endDate), 'dd MMMM yyyy à HH:mm', { locale: fr })

      const emailData = {
        subject: `Paiement confirmé - ${reservation.salle.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">💳 Paiement confirmé</h1>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">Merci ${reservation.user.firstName} !</h2>
              
              <p>Votre paiement a été traité avec succès.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <h3 style="margin-top: 0; color: #059669;">Récapitulatif</h3>
                <p><strong>Salle:</strong> ${reservation.salle.name}</p>
                <p><strong>Mairie:</strong> ${reservation.salle.mairie.name}</p>
                <p><strong>Date:</strong> ${startDateFormatted} - ${endDateFormatted}</p>
                <p><strong>Montant payé:</strong> ${payment.amount}€</p>
              </div>
              
              <p>Votre réservation est maintenant entièrement confirmée. Vous pouvez vous présenter à la salle le jour prévu.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/reservations" 
                   style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir mes réservations
                </a>
              </div>
            </div>
          </div>
        `
      }

      await sendEmail({
        to: reservation.user.email,
        subject: emailData.subject,
        html: emailData.html
      })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error('Erreur webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    )
  }
}