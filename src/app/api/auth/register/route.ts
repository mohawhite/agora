import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.errors },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, phone, role, mairieNom, mairieAdresse, mairieVille, mairieCodePostal, mairiePhone } = result.data

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password)

    let user;

    if (role === 'MAIRIE') {
      // Créer l'utilisateur et la mairie en une transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Créer l'utilisateur
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: 'Mairie',
            lastName: 'Admin',
            phone: mairiePhone || null,
            role,
          }
        })

        // Créer la mairie
        const mairie = await prisma.mairie.create({
          data: {
            name: mairieNom!,
            address: mairieAdresse!,
            city: mairieVille!,
            postalCode: mairieCodePostal!,
            phone: mairiePhone || null,
            userId: newUser.id,
          }
        })

        return { user: newUser, mairie }
      })

      user = result.user
    } else {
      // Créer l'utilisateur normal
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName!,
          lastName: lastName!,
          phone: phone || null,
          role,
        }
      })
    }

    // Créer une session
    const token = await createSession(user.id)

    logger.info(`Nouvel utilisateur créé: ${email} (${role})`)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified
      },
      message: 'Compte créé avec succès'
    }, { status: 201 })

    // Définir le cookie de session
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    })

    return response

  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}