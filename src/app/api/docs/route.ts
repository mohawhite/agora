import { NextRequest, NextResponse } from 'next/server'
import swaggerSpec from '@/lib/swagger'

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Récupère la spécification OpenAPI
 *     description: Retourne la documentation API complète au format OpenAPI 3.0
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Spécification OpenAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Spécification OpenAPI 3.0
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    console.error('Error generating API documentation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la documentation' },
      { status: 500 }
    )
  }
}