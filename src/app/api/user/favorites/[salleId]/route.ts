import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

interface RouteParams {
  params: {
    salleId: string
  }
}

// DELETE /api/user/favorites/[salleId] - Supprimer une salle des favoris
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req, user) => {
    try {
      const { salleId } = params

      if (!salleId) {
        return NextResponse.json(
          { error: 'ID de la salle requis' },
          { status: 400 }
        )
      }

      // Vérifier si le favori existe
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_salleId: {
            userId: user.id,
            salleId: salleId
          }
        }
      })

      if (!existingFavorite) {
        return NextResponse.json(
          { error: 'Favori non trouvé' },
          { status: 404 }
        )
      }

      // Supprimer des favoris
      await prisma.favorite.delete({
        where: {
          userId_salleId: {
            userId: user.id,
            salleId: salleId
          }
        }
      })

      logger.info(`Favori supprimé: utilisateur ${user.email}, salle ${salleId}`)

      return NextResponse.json(
        { message: 'Salle supprimée des favoris' },
        { status: 200 }
      )

    } catch (error) {
      logger.error('Erreur lors de la suppression du favori:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// POST /api/user/favorites/[salleId] - Ajouter/Toggle une salle aux favoris
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req, user) => {
    try {
      const { salleId } = params

      if (!salleId) {
        return NextResponse.json(
          { error: 'ID de la salle requis' },
          { status: 400 }
        )
      }

      // Vérifier que la salle existe
      const salle = await prisma.salle.findUnique({
        where: { id: salleId }
      })

      if (!salle) {
        return NextResponse.json(
          { error: 'Salle non trouvée' },
          { status: 404 }
        )
      }

      // Vérifier si déjà en favoris
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_salleId: {
            userId: user.id,
            salleId: salleId
          }
        }
      })

      if (existingFavorite) {
        // Supprimer des favoris (toggle)
        await prisma.favorite.delete({
          where: {
            userId_salleId: {
              userId: user.id,
              salleId: salleId
            }
          }
        })

        logger.info(`Favori supprimé (toggle): utilisateur ${user.email}, salle ${salleId}`)

        return NextResponse.json(
          { message: 'Salle supprimée des favoris', isFavorite: false },
          { status: 200 }
        )
      } else {
        // Ajouter aux favoris
        await prisma.favorite.create({
          data: {
            userId: user.id,
            salleId: salleId
          }
        })

        logger.info(`Favori ajouté (toggle): utilisateur ${user.email}, salle ${salleId}`)

        return NextResponse.json(
          { message: 'Salle ajoutée aux favoris', isFavorite: true },
          { status: 201 }
        )
      }

    } catch (error) {
      logger.error('Erreur lors du toggle favori:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}