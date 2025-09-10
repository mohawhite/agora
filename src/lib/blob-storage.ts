import { put, del, list, head } from '@vercel/blob'
import logger from './logger'

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
  contentDisposition: string
  size: number
}

export interface FileMetadata {
  filename: string
  contentType: string
  size: number
  uploadedBy: string
  category: 'salle' | 'user' | 'document'
}

// Uploading a file to Vercel Blob Storage
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  metadata: FileMetadata
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!isValidFileType(metadata.contentType)) {
      throw new Error('Type de fichier non autorisé')
    }

    // Validate file size (max 10MB)
    if (metadata.size > 10 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux (max 10MB)')
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const extension = getFileExtension(filename)
    const uniqueFilename = `${metadata.category}/${timestamp}-${sanitizeFilename(filename)}${extension}`

    const blob = await put(uniqueFilename, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: metadata.contentType,
      metadata: {
        originalName: filename,
        uploadedBy: metadata.uploadedBy,
        category: metadata.category,
        uploadedAt: new Date().toISOString()
      }
    })

    logger.info('File uploaded to Blob Storage', {
      filename: uniqueFilename,
      size: metadata.size,
      uploadedBy: metadata.uploadedBy,
      url: blob.url
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: metadata.contentType,
      contentDisposition: `inline; filename="${filename}"`,
      size: metadata.size
    }
  } catch (error) {
    logger.error('Error uploading file to Blob Storage:', error)
    throw new Error(`Erreur lors de l'upload: ${error.message}`)
  }
}

// Delete a file from Vercel Blob Storage
export async function deleteFile(url: string): Promise<boolean> {
  try {
    await del(url)
    
    logger.info('File deleted from Blob Storage', { url })
    return true
  } catch (error) {
    logger.error('Error deleting file from Blob Storage:', error)
    return false
  }
}

// List files in a category
export async function listFiles(category?: string, limit: number = 100) {
  try {
    const options = {
      limit,
      prefix: category ? `${category}/` : undefined
    }

    const result = await list(options)
    
    logger.debug('Files listed from Blob Storage', {
      category,
      count: result.blobs.length
    })

    return result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      metadata: blob.metadata
    }))
  } catch (error) {
    logger.error('Error listing files from Blob Storage:', error)
    throw new Error(`Erreur lors de la récupération des fichiers: ${error.message}`)
  }
}

// Get file metadata
export async function getFileMetadata(url: string) {
  try {
    const result = await head(url)
    
    return {
      size: result.size,
      contentType: result.contentType,
      cacheControl: result.cacheControl,
      metadata: result.metadata
    }
  } catch (error) {
    logger.error('Error getting file metadata from Blob Storage:', error)
    throw new Error(`Erreur lors de la récupération des métadonnées: ${error.message}`)
  }
}

// Upload multiple files
export async function uploadMultipleFiles(
  files: Array<{ file: File | Buffer; filename: string }>,
  metadata: Omit<FileMetadata, 'filename' | 'size'>
): Promise<UploadResult[]> {
  try {
    const uploadPromises = files.map(({ file, filename }) => {
      const size = file instanceof File ? file.size : file.length
      return uploadFile(file, filename, {
        ...metadata,
        filename,
        size
      })
    })

    const results = await Promise.all(uploadPromises)
    
    logger.info('Multiple files uploaded to Blob Storage', {
      count: results.length,
      uploadedBy: metadata.uploadedBy
    })

    return results
  } catch (error) {
    logger.error('Error uploading multiple files to Blob Storage:', error)
    throw new Error(`Erreur lors de l'upload multiple: ${error.message}`)
  }
}

// Utility functions
function isValidFileType(contentType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
  
  return allowedTypes.includes(contentType)
}

function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : ''
}

function sanitizeFilename(filename: string): string {
  // Remove extension and special characters
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
  return nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

// Clean up old files (for maintenance)
export async function cleanupOldFiles(categoryPrefix: string, daysOld: number = 30): Promise<number> {
  try {
    const files = await listFiles(categoryPrefix)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const filesToDelete = files.filter(file => 
      new Date(file.uploadedAt) < cutoffDate
    )
    
    const deletePromises = filesToDelete.map(file => deleteFile(file.url))
    await Promise.all(deletePromises)
    
    logger.info('Old files cleaned up from Blob Storage', {
      category: categoryPrefix,
      deletedCount: filesToDelete.length,
      daysOld
    })
    
    return filesToDelete.length
  } catch (error) {
    logger.error('Error cleaning up old files from Blob Storage:', error)
    throw new Error(`Erreur lors du nettoyage: ${error.message}`)
  }
}