'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Book, Code, Download } from 'lucide-react'

// Import dynamique pour éviter les problèmes SSR avec Swagger UI
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Chargement de la documentation...</span>
    </div>
  )
})

export default function DocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSwaggerSpec()
  }, [])

  const fetchSwaggerSpec = async () => {
    try {
      const response = await fetch('/api/docs')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la documentation')
      }
      const data = await response.json()
      setSpec(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadSpec = () => {
    if (spec) {
      const dataStr = JSON.stringify(spec, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'agora-api-spec.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Book className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Documentation API Agora</h1>
                <p className="text-muted-foreground">
                  API REST pour la plateforme de réservation de salles municipales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                OpenAPI 3.0
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSpec}
                disabled={!spec}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Version API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">v1.0.0</p>
                <p className="text-xs text-muted-foreground">Version actuelle</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Authentification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">JWT Bearer</Badge>
                  <Badge variant="secondary" className="text-xs">Cookie Auth</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Commencer</CardTitle>
              <CardDescription>
                Guide rapide pour utiliser l&apos;API Agora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Authentification</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Commencez par créer un compte et obtenir un token d&apos;authentification :
                  </p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{`POST /api/auth/register
{
  "email": "user@example.com",
  "password": "motdepasse",
  "firstName": "John",
  "lastName": "Doe"
}`}</code>
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">2. Rechercher des salles</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Recherchez des salles disponibles :
                  </p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{`GET /api/salles?city=Paris&capacity=50
Authorization: Bearer <token>`}</code>
                  </pre>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Endpoints principaux</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <Badge variant="outline">/api/auth/*</Badge>
                  <Badge variant="outline">/api/salles</Badge>
                  <Badge variant="outline">/api/reservations</Badge>
                  <Badge variant="outline">/api/files</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Swagger UI */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Chargement de la documentation interactive...</span>
            </CardContent>
          </Card>
        ) : spec ? (
          <Card>
            <CardContent className="p-0">
              <SwaggerUI 
                spec={spec}
                tryItOutEnabled={true}
                supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
                docExpansion="list"
                defaultModelExpandDepth={2}
                showExtensions={true}
                showCommonExtensions={true}
                displayOperationId={false}
                filter={true}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Impossible de charger la documentation API
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchSwaggerSpec}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}