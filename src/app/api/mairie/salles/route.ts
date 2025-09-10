import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import logger from '@/lib/logger'

// GET /api/mairie/salles - Récupérer les salles de la mairie connectée
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'MAIRIE') {
        return NextResponse.json(
          { error: 'Accès réservé aux mairies' },
          { status: 403 }
        )
      }

      const mairie = await prisma.mairie.findUnique({
        where: { userId: user.id }
      })

      if (!mairie) {
        return NextResponse.json(
          { error: 'Profil mairie non trouvé' },
          { status: 404 }
        )
      }

      const salles = await prisma.salle.findMany({
        where: { mairieId: mairie.id },
        include: {
          _count: {
            select: {
              reservations: {
                where: {
                  status: { in: ['PENDING', 'CONFIRMED'] }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({ salles })

    } catch (error) {
      logger.error('Erreur lors de la récupération des salles de la mairie:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}