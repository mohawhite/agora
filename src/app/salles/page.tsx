"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Users, Euro, Wifi, Car, Coffee, Search, Filter } from "lucide-react"

interface Salle {
  id: string
  name: string
  description: string | null
  capacity: number
  price: number
  address: string
  city: string
  images: string[]
  amenities: string[]
  available: boolean
  mairie: {
    name: string
    city: string
    verified: boolean
  }
}

const AMENITY_ICONS: { [key: string]: any } = {
  "WiFi gratuit": Wifi,
  "Parking": Car,
  "Machine à café": Coffee,
  // On peut ajouter d'autres icônes plus tard
}

export default function SallesPage() {
  const [salles, setSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [searchCapacity, setSearchCapacity] = useState("")
  const [searchMaxPrice, setSearchMaxPrice] = useState("")

  useEffect(() => {
    loadSalles()
  }, [])

  const loadSalles = async () => {
    try {
      const params = new URLSearchParams()
      if (searchCity) params.append('city', searchCity)
      if (searchCapacity) params.append('capacity', searchCapacity)
      if (searchMaxPrice) params.append('maxPrice', searchMaxPrice)

      const response = await fetch(`/api/salles?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSalles(data.salles)
      } else {
        console.error('Erreur lors du chargement des salles')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    loadSalles()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des salles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec recherche */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Trouvez la salle parfaite</h1>
            <p className="text-muted-foreground">
              Découvrez des salles uniques proposées par les mairies
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Ville</label>
              <Input
                placeholder="Paris, Lyon, Marseille..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
            </div>
            <div className="min-w-[120px]">
              <label className="text-sm font-medium">Capacité min.</label>
              <Input
                type="number"
                placeholder="50"
                value={searchCapacity}
                onChange={(e) => setSearchCapacity(e.target.value)}
              />
            </div>
            <div className="min-w-[120px]">
              <label className="text-sm font-medium">Prix max. (€/h)</label>
              <Input
                type="number"
                placeholder="100"
                value={searchMaxPrice}
                onChange={(e) => setSearchMaxPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des salles */}
      <div className="max-w-7xl mx-auto p-6">
        {salles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm border">
              <h2 className="text-lg font-semibold mb-2">Aucune salle trouvée</h2>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche pour trouver plus de résultats.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-muted-foreground">
                {salles.length} salle{salles.length > 1 ? 's' : ''} disponible{salles.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {salles.map((salle) => (
                <Link key={salle.id} href={`/salles/${salle.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center">
                      <div className="text-6xl">🏛️</div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">{salle.name}</h3>
                          {salle.mairie.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {salle.city}
                        </p>
                      </div>

                      {salle.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {salle.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {salle.capacity} pers.
                        </div>
                        <div className="flex items-center gap-1 font-semibold">
                          <Euro className="w-4 h-4" />
                          {salle.price}€/h
                        </div>
                      </div>

                      {salle.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {salle.amenities.slice(0, 3).map((amenity) => {
                            const IconComponent = AMENITY_ICONS[amenity]
                            return (
                              <div
                                key={amenity}
                                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                                title={amenity}
                              >
                                {IconComponent && <IconComponent className="w-3 h-3" />}
                                <span className="truncate max-w-[60px]">{amenity}</span>
                              </div>
                            )
                          })}
                          {salle.amenities.length > 3 && (
                            <div className="text-xs bg-muted px-2 py-1 rounded">
                              +{salle.amenities.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Par {salle.mairie.name}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}