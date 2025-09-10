import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import logger from '@/lib/logger'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur avec email et mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *                 example: monmotdepasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *         headers:
 *           Set-Cookie:
 *             description: Cookie de session
 *             schema:
 *               type: string
 *               example: session=abc123; HttpOnly; Secure; SameSite=Lax
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Email ou mot de passe incorrect
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

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