import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    logger.info('Déconnexion effectuée')

    const response = NextResponse.json({ message: 'Déconnexion réussie' })
    
    // Supprimer le cookie de session
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immédiatement
    })

    return response

  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}