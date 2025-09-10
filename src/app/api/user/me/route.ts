import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          mairie: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
              phone: true,
              email: true,
              website: true,
              verified: true
            }
          }
        }
      })

      if (!userData) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      return NextResponse.json({ user: userData })

    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json()
      const { firstName, lastName, phone } = body

      // Validation basique
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'Le prénom et le nom sont requis' },
          { status: 400 }
        )
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          phone: phone || null,
          updatedAt: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          mairie: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
              phone: true,
              email: true,
              website: true,
              verified: true
            }
          }
        }
      })

      logger.info(`Profil mis à jour: ${user.email}`)

      return NextResponse.json({
        user: updatedUser,
        message: 'Profil mis à jour avec succès'
      })

    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}