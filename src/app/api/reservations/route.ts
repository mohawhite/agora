import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { reservationSchema } from '@/lib/validations'
import { sendEmail, emailTemplates } from '@/lib/email'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logger from '@/lib/logger'

// GET /api/reservations - Récupérer les réservations de l'utilisateur connecté
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const salleId = searchParams.get('salleId')
      const status = searchParams.get('status')

      const where: any = {}

      if (user.role === 'USER') {
        where.userId = user.id
      } else if (user.role === 'MAIRIE') {
        // Pour les mairies, récupérer les réservations de leurs salles
        const mairie = await prisma.mairie.findUnique({
          where: { userId: user.id }
        })
        
        if (!mairie) {
          return NextResponse.json({ reservations: [] })
        }

        where.salle = {
          mairieId: mairie.id
        }
      }

      if (salleId) {
        where.salleId = salleId
      }

      if (status) {
        // Gérer les statuts multiples (format: "CONFIRMED,PENDING")
        const statusList = status.split(',').map(s => s.trim())
        where.status = { in: statusList }
      }

      const reservations = await prisma.reservation.findMany({
        where,
        include: {
          salle: {
            include: {
              mairie: {
                select: {
                  name: true,
                  phone: true,
                  email: true
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({ reservations })

    } catch (error) {
      logger.error('Erreur lors de la récupération des réservations:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// POST /api/reservations - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'USER') {
        return NextResponse.json(
          { error: 'Seuls les utilisateurs peuvent faire des réservations' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { salleId, ...reservationData } = body
      
      // Validation des données
      const result = reservationSchema.safeParse(reservationData)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: result.error.errors },
          { status: 400 }
        )
      }

      const { startDate, endDate, message } = result.data

      // Vérifier que la salle existe et est disponible
      const salle = await prisma.salle.findUnique({
        where: { id: salleId },
        include: { mairie: true }
      })

      if (!salle) {
        return NextResponse.json(
          { error: 'Salle non trouvée' },
          { status: 404 }
        )
      }

      if (!salle.available) {
        return NextResponse.json(
          { error: 'Cette salle n\'est pas disponible à la réservation' },
          { status: 400 }
        )
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      // Vérifier que les dates sont valides
      if (start <= new Date()) {
        return NextResponse.json(
          { error: 'La date de début doit être dans le futur' },
          { status: 400 }
        )
      }

      if (end <= start) {
        return NextResponse.json(
          { error: 'La date de fin doit être postérieure à la date de début' },
          { status: 400 }
        )
      }

      // Vérifier les conflits avec d'autres réservations
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          salleId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            {
              AND: [
                { startDate: { lte: start } },
                { endDate: { gt: start } }
              ]
            },
            {
              AND: [
                { startDate: { lt: end } },
                { endDate: { gte: end } }
              ]
            },
            {
              AND: [
                { startDate: { gte: start } },
                { endDate: { lte: end } }
              ]
            }
          ]
        }
      })

      if (conflictingReservation) {
        return NextResponse.json(
          { error: 'Cette salle est déjà réservée pour cette période' },
          { status: 409 }
        )
      }

      // Calculer le prix total (durée en heures * prix par heure)
      const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
      const totalPrice = durationHours * salle.price

      // Créer la réservation
      const reservation = await prisma.reservation.create({
        data: {
          userId: user.id,
          salleId,
          startDate: start,
          endDate: end,
          totalPrice,
          message: message || null,
          status: 'PENDING'
        },
        include: {
          salle: {
            include: {
              mairie: {
                select: {
                  name: true,
                  email: true
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

      logger.info(`Nouvelle réservation créée: ${reservation.id} par ${user.email}`)

      // Envoyer des emails de notification
      const startDateFormatted = format(start, 'dd MMMM yyyy à HH:mm', { locale: fr })
      const endDateFormatted = format(end, 'dd MMMM yyyy à HH:mm', { locale: fr })

      // Email pour l'utilisateur
      const userEmailData = emailTemplates.reservationCreated({
        userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
        salleName: reservation.salle.name,
        mairieNom: reservation.salle.mairie.name,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        totalPrice: reservation.totalPrice,
        reservationId: reservation.id
      })

      await sendEmail({
        to: reservation.user.email,
        subject: userEmailData.subject,
        html: userEmailData.html
      })

      // Email pour la mairie
      if (reservation.salle.mairie.email) {
        const mairieEmailData = emailTemplates.newReservationForMairie({
          mairieNom: reservation.salle.mairie.name,
          salleName: reservation.salle.name,
          userName: `${reservation.user.firstName} ${reservation.user.lastName}`,
          userEmail: reservation.user.email,
          userPhone: user.phone || undefined,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          totalPrice: reservation.totalPrice,
          message: reservation.message || undefined,
          reservationId: reservation.id
        })

        await sendEmail({
          to: reservation.salle.mairie.email,
          subject: mairieEmailData.subject,
          html: mairieEmailData.html
        })
      }

      return NextResponse.json({
        reservation,
        message: 'Demande de réservation envoyée avec succès'
      }, { status: 201 })

    } catch (error) {
      logger.error('Erreur lors de la création de la réservation:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}