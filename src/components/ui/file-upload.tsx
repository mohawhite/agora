'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileText, Image, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  category: 'salle' | 'user' | 'document'
  onUploadComplete?: (files: any[]) => void
  maxFiles?: number
  accept?: string
  className?: string
}

export function FileUpload({ 
  category = 'document', 
  onUploadComplete, 
  maxFiles = 10, 
  accept = "image/*,.pdf,.doc,.docx,.txt",
  className 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadResults, setUploadResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} est trop volumineux (max 10MB)`)
        return false
      }
      return true
    })

    if (files.length + validFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    setFiles(prev => [...prev, ...validFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('category', category)

      // Simulate progress for better UX
      files.forEach((file, index) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.name] || 0
            if (current < 90) {
              return { ...prev, [file.name]: current + 10 }
            }
            clearInterval(interval)
            return prev
          })
        }, 200)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }

      // Complete progress
      files.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
      })

      setUploadResults(result.files || [result.file])
      onUploadComplete?.(result.files || [result.file])
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([])
        setUploadProgress({})
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de fichiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            uploading && "pointer-events-none opacity-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">
            Glissez-déposez vos fichiers ici
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou cliquez pour sélectionner des fichiers
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} fichiers, 10MB par fichier
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Fichiers sélectionnés ({files.length})</h4>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {uploading && uploadProgress[file.name] !== undefined && (
                    <Progress 
                      value={uploadProgress[file.name]} 
                      className="h-2 mt-2"
                    />
                  )}
                  
                  {/* Success Check */}
                  {uploadProgress[file.name] === 100 && (
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <Check className="h-3 w-3" />
                      <span className="text-xs">Uploadé avec succès</span>
                    </div>
                  )}
                </div>
                
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <Button 
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Upload en cours...' : `Uploader ${files.length} fichier(s)`}
          </Button>
        )}

        {/* Category Badge */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <Badge variant="secondary">
            Catégorie: {category}
          </Badge>
          <span>{files.length}/{maxFiles} fichiers</span>
        </div>
      </CardContent>
    </Card>
  )
}