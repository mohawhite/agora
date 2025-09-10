'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  User,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileManagerProps {
  category?: 'salle' | 'user' | 'document' | 'all'
  onFileSelect?: (file: any) => void
  showUploader?: boolean
  className?: string
}

interface FileItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
  metadata?: {
    originalName?: string
    uploadedBy?: string
    category?: string
    uploadedAt?: string
  }
}

export function FileManager({ 
  category = 'all', 
  onFileSelect, 
  showUploader = false,
  className 
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file?: FileItem }>({ open: false })
  const [deleting, setDeleting] = useState(false)

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/files?${params.toString()}`, {
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la récupération des fichiers')
      }

      setFiles(result.files || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [selectedCategory])

  const handleDelete = async (file: FileItem) => {
    setDeleting(true)

    try {
      const params = new URLSearchParams({ url: file.url })
      const response = await fetch(`/api/files?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      setFiles(prev => prev.filter(f => f.url !== file.url))
      setDeleteDialog({ open: false })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  const getFileIcon = (file: FileItem) => {
    const filename = file.metadata?.originalName || file.pathname
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'salle': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      case 'document': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Gestionnaire de fichiers
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => setSelectedCategory(value as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fichiers</SelectItem>
                <SelectItem value="salle">Salles</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFiles}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement des fichiers...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && files.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Aucun fichier trouvé</p>
            <p className="text-sm">
              {selectedCategory === 'all' 
                ? 'Aucun fichier disponible'
                : `Aucun fichier dans la catégorie "${selectedCategory}"`
              }
            </p>
          </div>
        )}

        {/* File List */}
        {!loading && files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {files.length} fichier{files.length > 1 ? 's' : ''}
              </p>
            </div>
            
            {files.map((file, index) => (
              <div
                key={file.url}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {getFileIcon(file)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.metadata?.originalName || file.pathname.split('/').pop()}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(file.uploadedAt)}
                    </span>
                    <span>{formatFileSize(file.size)}</span>
                    {file.metadata?.uploadedBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {file.metadata.uploadedBy}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                {file.metadata?.category && (
                  <Badge 
                    variant="secondary"
                    className={getCategoryColor(file.metadata.category)}
                  >
                    {file.metadata.category}
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, file })}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>

                  {onFileSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFileSelect(file)}
                    >
                      Sélectionner
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ open, file: open ? deleteDialog.file : undefined })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le fichier "
              {deleteDialog.file?.metadata?.originalName || deleteDialog.file?.pathname.split('/').pop()}" ?
              <br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false })}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.file && handleDelete(deleteDialog.file)}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}