import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { salleSchema } from '@/lib/validations'
import logger from '@/lib/logger'

// GET /api/salles/[id] - Récupérer une salle par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salle = await prisma.salle.findUnique({
      where: { id: params.id },
      include: {
        mairie: {
          select: {
            name: true,
            city: true,
            phone: true,
            email: true,
            website: true,
            verified: true
          }
        },
        disponibilites: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    })

    if (!salle) {
      return NextResponse.json(
        { error: 'Salle non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ salle })

  } catch (error) {
    logger.error('Erreur lors de la récupération de la salle:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// PUT /api/salles/[id] - Mettre à jour une salle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'MAIRIE') {
        return NextResponse.json(
          { error: 'Accès réservé aux mairies' },
          { status: 403 }
        )
      }

      // Vérifier que la salle appartient à la mairie
      const existingSalle = await prisma.salle.findUnique({
        where: { id: params.id },
        include: { mairie: true }
      })

      if (!existingSalle) {
        return NextResponse.json(
          { error: 'Salle non trouvée' },
          { status: 404 }
        )
      }

      if (existingSalle.mairie.userId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez modifier que vos propres salles' },
          { status: 403 }
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

      const salle = await prisma.salle.update({
        where: { id: params.id },
        data: {
          name,
          description,
          capacity,
          surface,
          price,
          address,
          city,
          postalCode,
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

      logger.info(`Salle mise à jour: ${name} par ${user.email}`)

      return NextResponse.json({
        salle,
        message: 'Salle mise à jour avec succès'
      })

    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la salle:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/salles/[id] - Supprimer une salle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'MAIRIE') {
        return NextResponse.json(
          { error: 'Accès réservé aux mairies' },
          { status: 403 }
        )
      }

      // Vérifier que la salle appartient à la mairie
      const existingSalle = await prisma.salle.findUnique({
        where: { id: params.id },
        include: { 
          mairie: true,
          reservations: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] },
              startDate: { gte: new Date() }
            }
          }
        }
      })

      if (!existingSalle) {
        return NextResponse.json(
          { error: 'Salle non trouvée' },
          { status: 404 }
        )
      }

      if (existingSalle.mairie.userId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez supprimer que vos propres salles' },
          { status: 403 }
        )
      }

      // Vérifier qu'il n'y a pas de réservations actives
      if (existingSalle.reservations.length > 0) {
        return NextResponse.json(
          { error: 'Impossible de supprimer une salle avec des réservations actives' },
          { status: 400 }
        )
      }

      await prisma.salle.delete({
        where: { id: params.id }
      })

      logger.info(`Salle supprimée: ${existingSalle.name} par ${user.email}`)

      return NextResponse.json({
        message: 'Salle supprimée avec succès'
      })

    } catch (error) {
      logger.error('Erreur lors de la suppression de la salle:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}