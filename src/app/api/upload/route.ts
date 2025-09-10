import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { uploadFile, uploadMultipleFiles } from '@/lib/blob-storage'
import logger from '@/lib/logger'

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Files]
 *     summary: Upload de fichiers
 *     description: Upload un ou plusieurs fichiers vers Vercel Blob Storage
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Fichiers à uploader (max 10 fichiers, 10MB chacun)
 *               category:
 *                 type: string
 *                 enum: [salle, user, document]
 *                 default: document
 *                 description: Catégorie des fichiers
 *     responses:
 *       200:
 *         description: Upload réussi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 file:
 *                   $ref: '#/components/schemas/FileUpload'
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               no_files:
 *                 value:
 *                   error: Aucun fichier fourni
 *               invalid_category:
 *                 value:
 *                   error: Catégorie invalide
 *               too_many_files:
 *                 value:
 *                   error: Maximum 10 fichiers autorisés
 *               file_too_large:
 *                 value:
 *                   error: Fichier trop volumineux (max 10MB)
 *               invalid_type:
 *                 value:
 *                   error: Type de fichier non autorisé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       413:
 *         description: Fichier trop volumineux
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const category = formData.get('category') as string || 'document'
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'Aucun fichier fourni' },
          { status: 400 }
        )
      }

      // Validate category
      if (!['salle', 'user', 'document'].includes(category)) {
        return NextResponse.json(
          { error: 'Catégorie invalide' },
          { status: 400 }
        )
      }

      // Validate file count (max 10 files)
      if (files.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 fichiers autorisés' },
          { status: 400 }
        )
      }

      // Single file upload
      if (files.length === 1) {
        const file = files[0]
        
        if (!file.name) {
          return NextResponse.json(
            { error: 'Nom de fichier requis' },
            { status: 400 }
          )
        }

        const result = await uploadFile(file, file.name, {
          filename: file.name,
          contentType: file.type,
          size: file.size,
          uploadedBy: user.id,
          category: category as 'salle' | 'user' | 'document'
        })

        logger.logActivity(user.id, 'FILE_UPLOAD', {
          filename: file.name,
          category,
          size: file.size
        })

        return NextResponse.json({
          success: true,
          file: result
        })
      }

      // Multiple files upload
      const fileData = files.map(file => ({
        file,
        filename: file.name
      }))

      const results = await uploadMultipleFiles(fileData, {
        contentType: files[0].type, // Assuming same type for simplicity
        uploadedBy: user.id,
        category: category as 'salle' | 'user' | 'document'
      })

      logger.logActivity(user.id, 'MULTIPLE_FILES_UPLOAD', {
        count: files.length,
        category,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      })

      return NextResponse.json({
        success: true,
        files: results
      })

    } catch (error) {
      logger.error('Erreur lors de l\'upload de fichier:', error)
      
      if (error.message.includes('Type de fichier non autorisé')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      if (error.message.includes('trop volumineux')) {
        return NextResponse.json(
          { error: error.message },
          { status: 413 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erreur serveur interne' },
        { status: 500 }
      )
    }
  })
}