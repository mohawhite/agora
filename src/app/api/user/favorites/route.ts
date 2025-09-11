import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

// GET /api/user/favorites - Récupérer les favoris de l'utilisateur
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          salle: {
            include: {
              mairie: {
                select: {
                  name: true,
                  city: true,
                  verified: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const formattedFavorites = favorites.map(favorite => ({
        id: favorite.salle.id,
        name: favorite.salle.name,
        description: favorite.salle.description,
        capacity: favorite.salle.capacity,
        price: favorite.salle.price,
        address: favorite.salle.address,
        city: favorite.salle.city,
        images: favorite.salle.images,
        amenities: favorite.salle.amenities,
        available: favorite.salle.available,
        mairie: {
          name: favorite.salle.mairie.name,
          city: favorite.salle.mairie.city,
          verified: favorite.salle.mairie.verified
        }
      }))

      return NextResponse.json({ favorites: formattedFavorites })

    } catch (error) {
      logger.error('Erreur lors de la récupération des favoris:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// POST /api/user/favorites - Ajouter une salle aux favoris
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { salleId } = body

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
        return NextResponse.json(
          { error: 'Salle déjà en favoris' },
          { status: 409 }
        )
      }

      // Ajouter aux favoris
      await prisma.favorite.create({
        data: {
          userId: user.id,
          salleId: salleId
        }
      })

      logger.info(`Favori ajouté: utilisateur ${user.email}, salle ${salleId}`)

      return NextResponse.json(
        { message: 'Salle ajoutée aux favoris' },
        { status: 201 }
      )

    } catch (error) {
      logger.error('Erreur lors de l\'ajout aux favoris:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}