'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string[]
  onChange?: (urls: string[]) => void
  maxImages?: number
  className?: string
}

export function ImageUpload({ 
  value = [], 
  onChange, 
  maxImages = 10,
  className 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    setError(null)

    // Vérifier le nombre d'images
    if (value.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`)
      return
    }

    // Vérifier que ce sont des images
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== files.length) {
      setError('Seules les images sont autorisées')
      return
    }

    // Vérifier la taille (max 5MB par image)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Taille maximum 5MB par image')
      return
    }

    setUploading(true)

    try {
      // Convertir en Base64 pour stockage temporaire
      const newUrls: string[] = []
      
      for (const file of imageFiles) {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
        newUrls.push(dataUrl)
      }

      onChange?.([...value, ...newUrls])
    } catch (error) {
      setError('Erreur lors du traitement des images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange?.(newUrls)
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
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
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || value.length >= maxImages}
            />
            
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              Ajoutez des images
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Glissez-déposez vos images ici ou cliquez pour sélectionner
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline">
                {value.length}/{maxImages} images
              </Badge>
              <span>Max 5MB par image</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grille d'images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="text-center text-sm text-muted-foreground">
          Traitement des images en cours...
        </div>
      )}
    </div>
  )
}