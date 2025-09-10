import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'
import { mairieSchema } from '@/lib/validations'
import logger from '@/lib/logger'

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

      return NextResponse.json({ mairie })

    } catch (error) {
      logger.error('Erreur lors de la récupération du profil mairie:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
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

      const { name, address, city, postalCode, description, phone, email, website, siret } = result.data

      // Vérifier si le profil existe déjà
      const existingMairie = await prisma.mairie.findUnique({
        where: { userId: user.id }
      })

      let mairie
      if (existingMairie) {
        // Mettre à jour
        mairie = await prisma.mairie.update({
          where: { userId: user.id },
          data: {
            name,
            address,
            city,
            postalCode,
            description,
            phone: phone || null,
            email: email || null,
            website: website || null,
            siret: siret || null,
          }
        })
      } else {
        // Créer
        mairie = await prisma.mairie.create({
          data: {
            userId: user.id,
            name,
            address,
            city,
            postalCode,
            description,
            phone: phone || null,
            email: email || null,
            website: website || null,
            siret: siret || null,
          }
        })
      }

      logger.info(`Profil mairie ${existingMairie ? 'mis à jour' : 'créé'} pour l'utilisateur: ${user.email}`)

      return NextResponse.json({
        mairie,
        message: `Profil mairie ${existingMairie ? 'mis à jour' : 'créé'} avec succès`
      })

    } catch (error) {
      logger.error('Erreur lors de la gestion du profil mairie:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}