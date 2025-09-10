"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Users, Euro, Phone, Mail, Globe, ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SalleDetails {
  id: string
  name: string
  description: string | null
  capacity: number
  surface: number | null
  price: number
  address: string
  city: string
  postalCode: string
  images: string[]
  amenities: string[]
  available: boolean
  mairie: {
    name: string
    city: string
    phone: string | null
    email: string | null
    website: string | null
    verified: boolean
  }
  disponibilites: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
  }>
}

const DAYS_OF_WEEK = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
]

interface SallePageProps {
  params: { id: string }
}

export default function SallePage({ params }: SallePageProps) {
  const router = useRouter()
  const [salle, setSalle] = useState<SalleDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSalle()
  }, [params.id])

  const loadSalle = async () => {
    try {
      const response = await fetch(`/api/salles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSalle(data.salle)
      } else {
        if (response.status === 404) {
          alert('Salle non trouvée')
        } else {
          alert('Erreur lors du chargement de la salle')
        }
        router.push('/salles')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur de connexion')
      router.push('/salles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!salle) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{salle.name}</h1>
                {salle.mairie.verified && (
                  <Badge variant="secondary">Mairie vérifiée</Badge>
                )}
                {!salle.available && (
                  <Badge variant="destructive">Indisponible</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {salle.address}, {salle.city} {salle.postalCode}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Capacité {salle.capacity} personnes
                </div>
                {salle.surface && (
                  <div className="flex items-center gap-1">
                    📏 {salle.surface} m²
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold text-primary">
                {salle.price}€ <span className="text-base font-normal">par heure</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Réserver maintenant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galerie d'images (placeholder) */}
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🏛️</div>
                <p className="text-muted-foreground">Photos à venir</p>
              </div>
            </div>

            {/* Description */}
            {salle.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-3">À propos de cette salle</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {salle.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Équipements */}
            {salle.amenities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Équipements disponibles</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {salle.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disponibilités */}
            {salle.disponibilites.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Horaires d'ouverture</h2>
                  <div className="space-y-2">
                    {salle.disponibilites
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((dispo) => (
                        <div key={dispo.id} className="flex justify-between items-center py-2 border-b border-muted">
                          <span className="font-medium">{DAYS_OF_WEEK[dispo.dayOfWeek]}</span>
                          <span className="text-muted-foreground">
                            {dispo.startTime} - {dispo.endTime}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations de réservation */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {salle.price}€
                  </div>
                  <div className="text-sm text-muted-foreground">par heure</div>
                </div>

                <Button className="w-full mb-4" size="lg">
                  Faire une demande de réservation
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Vous ne serez pas débité immédiatement
                </div>
              </CardContent>
            </Card>

            {/* Informations mairie */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Proposé par</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      🏛️
                    </div>
                    <div>
                      <div className="font-semibold">{salle.mairie.name}</div>
                      <div className="text-sm text-muted-foreground">{salle.mairie.city}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    {salle.mairie.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{salle.mairie.phone}</span>
                      </div>
                    )}
                    {salle.mairie.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{salle.mairie.email}</span>
                      </div>
                    )}
                    {salle.mairie.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={salle.mairie.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}