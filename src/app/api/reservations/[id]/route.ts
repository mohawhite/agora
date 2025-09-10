import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logger from '@/lib/logger'

// GET /api/reservations/[id] - Récupérer une réservation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: params.id },
        include: {
          salle: {
            include: {
              mairie: {
                select: {
                  name: true,
                  phone: true,
                  email: true,
                  website: true
                }
              }
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          payment: true
        }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 }
        )
      }

      // Vérifier les permissions
      const isMairie = user.role === 'MAIRIE' && user.mairie?.id === reservation.salle.mairie.id
      const isOwner = user.role === 'USER' && user.id === reservation.userId

      if (!isMairie && !isOwner) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        )
      }

      return NextResponse.json({ reservation })

    } catch (error) {
      logger.error('Erreur lors de la récupération de la réservation:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// PATCH /api/reservations/[id] - Mettre à jour le statut d'une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { status, reason } = body

      if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        )
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id: params.id },
        include: {
          salle: {
            include: {
              mairie: true
            }
          },
          user: true
        }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 }
        )
      }

      // Permissions pour changer le statut
      let canUpdate = false
      
      if (user.role === 'MAIRIE' && reservation.salle.mairie.userId === user.id) {
        // Les mairies peuvent confirmer/annuler leurs réservations
        canUpdate = ['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)
      } else if (user.role === 'USER' && reservation.userId === user.id) {
        // Les utilisateurs peuvent seulement annuler leurs réservations
        canUpdate = status === 'CANCELLED'
      }

      if (!canUpdate) {
        return NextResponse.json(
          { error: 'Vous n\'avez pas le droit de modifier cette réservation' },
          { status: 403 }
        )
      }

      // Vérifier les transitions de statut valides
      const validTransitions: { [key: string]: string[] } = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['CANCELLED', 'COMPLETED'],
        'CANCELLED': [],
        'COMPLETED': []
      }

      if (!validTransitions[reservation.status].includes(status)) {
        return NextResponse.json(
          { error: `Impossible de passer de ${reservation.status} à ${status}` },
          { status: 400 }
        )
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id: params.id },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          salle: {
            include: {
              mairie: {
                select: {
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      logger.info(`Réservation ${params.id} mise à jour vers ${status} par ${user.email}`)

      // Envoyer un email de notification selon le nouveau statut
      const startDateFormatted = format(new Date(reservation.startDate), 'dd MMMM yyyy à HH:mm', { locale: fr })
      const endDateFormatted = format(new Date(reservation.endDate), 'dd MMMM yyyy à HH:mm', { locale: fr })

      if (status === 'CONFIRMED') {
        const emailData = emailTemplates.reservationConfirmed({
          userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
          salleName: reservation.salle.name,
          mairieNom: reservation.salle.mairie.name,
          mairieEmail: reservation.salle.mairie.email || undefined,
          mairiePhone: reservation.salle.mairie.phone || undefined,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          totalPrice: reservation.totalPrice
        })

        await sendEmail({
          to: reservation.user.email,
          subject: emailData.subject,
          html: emailData.html
        })
      } else if (status === 'CANCELLED') {
        const emailData = emailTemplates.reservationCancelled({
          userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
          salleName: reservation.salle.name,
          mairieNom: reservation.salle.mairie.name,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          reason: reason || undefined
        })

        await sendEmail({
          to: reservation.user.email,
          subject: emailData.subject,
          html: emailData.html
        })
      }

      return NextResponse.json({
        reservation: updatedReservation,
        message: `Réservation ${status.toLowerCase()}`
      })

    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la réservation:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/reservations/[id] - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: params.id },
        include: {
          salle: {
            include: { mairie: true }
          }
        }
      })

      if (!reservation) {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 }
        )
      }

      // Seul le propriétaire de la réservation peut la supprimer
      if (reservation.userId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez supprimer que vos propres réservations' },
          { status: 403 }
        )
      }

      // On ne peut supprimer que les réservations annulées ou en attente
      if (!['CANCELLED', 'PENDING'].includes(reservation.status)) {
        return NextResponse.json(
          { error: 'Seules les réservations en attente ou annulées peuvent être supprimées' },
          { status: 400 }
        )
      }

      await prisma.reservation.delete({
        where: { id: params.id }
      })

      logger.info(`Réservation supprimée: ${params.id} par ${user.email}`)

      return NextResponse.json({
        message: 'Réservation supprimée avec succès'
      })

    } catch (error) {
      logger.error('Erreur lors de la suppression de la réservation:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}