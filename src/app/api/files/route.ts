import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { listFiles, deleteFile, getFileMetadata } from '@/lib/blob-storage'
import { withQueryValidation } from '@/lib/validation/middleware'
import Joi from 'joi'
import logger from '@/lib/logger'

/**
 * @swagger
 * /api/files:
 *   get:
 *     tags: [Files]
 *     summary: Lister les fichiers
 *     description: Récupère la liste des fichiers accessibles par l'utilisateur
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [salle, user, document]
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre maximum de fichiers à retourner
 *     responses:
 *       200:
 *         description: Liste des fichiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         format: uri
 *                       pathname:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       metadata:
 *                         type: object
 *                         properties:
 *                           originalName:
 *                             type: string
 *                           uploadedBy:
 *                             type: string
 *                           category:
 *                             type: string
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     tags: [Files]
 *     summary: Supprimer un fichier
 *     description: Supprime un fichier spécifique
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: URL du fichier à supprimer
 *     responses:
 *       200:
 *         description: Fichier supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fichier supprimé avec succès
 *       400:
 *         description: URL invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

const listFilesQuerySchema = Joi.object({
  category: Joi.string().valid('salle', 'user', 'document').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

const deleteFileQuerySchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'URL de fichier invalide',
    'any.required': 'URL de fichier requise'
  })
})

// GET /api/files - List files
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withQueryValidation(listFilesQuerySchema)(async (req, query) => {
      try {
        const { category, limit } = query
        
        // For regular users, only show their own files
        // For mairies, show files in their category
        let prefix = category
        if (user.role === 'USER' && category !== 'user') {
          prefix = `user/${user.id}`
        } else if (user.role === 'MAIRIE' && category !== 'salle') {
          prefix = `salle`
        }
        
        const files = await listFiles(prefix, limit)
        
        // Filter files by user ownership for additional security
        const filteredFiles = files.filter(file => {
          if (user.role === 'ADMIN') return true
          if (user.role === 'MAIRIE') {
            return file.pathname.startsWith('salle/') || 
                   (file.metadata?.uploadedBy === user.id)
          }
          return file.metadata?.uploadedBy === user.id
        })

        return NextResponse.json({
          files: filteredFiles,
          count: filteredFiles.length
        })

      } catch (error) {
        logger.error('Erreur lors de la récupération des fichiers:', error)
        return NextResponse.json(
          { error: 'Erreur serveur interne' },
          { status: 500 }
        )
      }
    })(request)
  })
}

// DELETE /api/files - Delete a file
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withQueryValidation(deleteFileQuerySchema)(async (req, query) => {
      try {
        const { url } = query
        
        // Get file metadata to check ownership
        const metadata = await getFileMetadata(url)
        
        // Check permissions
        const canDelete = user.role === 'ADMIN' || 
                         metadata.metadata?.uploadedBy === user.id
        
        if (!canDelete) {
          return NextResponse.json(
            { error: 'Permission refusée' },
            { status: 403 }
          )
        }
        
        const success = await deleteFile(url)
        
        if (!success) {
          return NextResponse.json(
            { error: 'Échec de la suppression du fichier' },
            { status: 500 }
          )
        }

        logger.logActivity(user.id, 'FILE_DELETE', {
          url,
          originalUploader: metadata.metadata?.uploadedBy
        })

        return NextResponse.json({
          success: true,
          message: 'Fichier supprimé avec succès'
        })

      } catch (error) {
        logger.error('Erreur lors de la suppression du fichier:', error)
        return NextResponse.json(
          { error: 'Erreur serveur interne' },
          { status: 500 }
        )
      }
    })(request)
  })
}