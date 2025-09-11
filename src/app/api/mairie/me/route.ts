import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { mairieSchema } from '@/lib/validations'
import logger from '@/lib/logger'

// PATCH /api/mairie/me - Mettre à jour les informations de la mairie
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      if (user.role !== 'MAIRIE') {
        return NextResponse.json(
          { error: 'Accès réservé aux mairies' },
          { status: 403 }
        )
      }

      const body = await request.json()
      
      // Validation des données
      const result = mairieSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Données invalides', details: result.error.errors },
          { status: 400 }
        )
      }

      const { 
        name, 
        address, 
        city, 
        postalCode, 
        phone, 
        email, 
        website 
      } = result.data

      // Mettre à jour les informations de la mairie
      const updatedMairie = await prisma.mairie.update({
        where: { userId: user.id },
        data: {
          name,
          address,
          city,
          postalCode,
          phone: phone || null,
          email: email || null,
          website: website || null,
        }
      })

      // Récupérer l'utilisateur mis à jour avec les informations de la mairie
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          mairie: true
        }
      })

      logger.info(`Mairie mise à jour: ${name} par ${user.email}`)

      return NextResponse.json({
        user: updatedUser,
        message: 'Profil mis à jour avec succès'
      })

    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la mairie:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}