import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkEmailSchema = z.object({
  email: z.string().email('Email invalide')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = checkEmailSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    const { email } = result.data

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    return NextResponse.json({
      exists: !!existingUser
    })

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}