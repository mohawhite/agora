import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: { mairie: true }
    })

    if (!user) {
      logger.warn(`Tentative de connexion avec email inexistant: ${email}`)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      logger.warn(`Tentative de connexion avec mot de passe incorrect pour: ${email}`)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer une session
    const token = await createSession(user.id)

    logger.info(`Connexion réussie pour: ${email}`)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        mairie: user.mairie
      },
      message: 'Connexion réussie'
    })

    // Définir le cookie de session
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    })

    return response

  } catch (error) {
    logger.error('Erreur lors de la connexion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}