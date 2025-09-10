import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from './auth'
import { prisma } from './prisma'

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      )
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { mairie: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      )
    }

    return await handler(request, user)

  } catch (error) {
    console.error('Erreur middleware auth:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, user: any) => Promise<NextResponse>
  ) => {
    return withAuth(request, async (req, user) => {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        )
      }
      return handler(req, user)
    })
  }
}