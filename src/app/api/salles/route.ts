import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { salleSchema } from '@/lib/validations'
import logger from '@/lib/logger'

// GET /api/salles - Récupérer toutes les salles avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const capacity = searchParams.get('capacity')
    const maxPrice = searchParams.get('maxPrice')
    const available = searchParams.get('available')

    const where: any = {}
    
    if (available !== 'false') {
      where.available = true
    }
    
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      }
    }
    
    if (capacity) {
      where.capacity = {
        gte: parseInt(capacity)
      }
    }
    
    if (maxPrice) {
      where.price = {
        lte: parseFloat(maxPrice)
      }
    }

    const salles = await prisma.salle.findMany({
      where,
      include: {
        mairie: {
          select: {
            name: true,
            city: true,
            verified: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ salles })

  } catch (error) {
    logger.error('Erreur lors de la récupération des salles:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST /api/salles - Créer une nouvelle salle
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'MAIRIE') {
        return NextResponse.json(
          { error: 'Accès réservé aux mairies' },
          { status: 403 }
        )
      }

      // Vérifier que la mairie a un profil complet
      const mairie = await prisma.mairie.findUnique({
        where: { userId: user.id }
      })

      if (!mairie) {
        return NextResponse.json(
          { error: 'Veuillez d\'abord compléter votre profil mairie' },
          { status: 400 }
        )
      }

      const body = await request.json()
      
      // Validation des données
      const result = salleSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: result.error.errors },
          { status: 400 }
        )
      }

      const { 
        name, 
        description, 
        capacity, 
        surface, 
        price, 
        address, 
        city, 
        postalCode, 
        amenities, 
        available 
      } = result.data

      const salle = await prisma.salle.create({
        data: {
          mairieId: mairie.id,
          name,
          description,
          capacity,
          surface,
          price,
          address,
          city,
          postalCode,
          images: [], // Sera géré plus tard avec l'upload d'images
          amenities,
          available,
        },
        include: {
          mairie: {
            select: {
              name: true,
              city: true
            }
          }
        }
      })

      logger.info(`Nouvelle salle créée: ${name} par ${user.email}`)

      return NextResponse.json({
        salle,
        message: 'Salle créée avec succès'
      }, { status: 201 })

    } catch (error) {
      logger.error('Erreur lors de la création de la salle:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}