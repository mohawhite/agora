import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getUserActivities } from '@/lib/activity'
import logger from '@/lib/logger'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '50')
      
      const activities = await getUserActivities(user.id, limit)

      return NextResponse.json({ activities })

    } catch (error) {
      logger.error('Erreur lors de la récupération des activités:', error)
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}