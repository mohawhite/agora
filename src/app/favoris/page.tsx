"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GalleryVerticalEnd, MapPin, Users, Euro, Heart, Building2 } from "lucide-react"
import BottomNavigation from "@/components/navigation/bottom-navigation"

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
  mairie: {
    name: string
    city: string
    verified: boolean
  }
}

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoriteSalles, setFavoriteSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  // Ce useEffect n'est plus nécessaire car loadFavorites charge tout directement

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/user/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavoriteSalles(data.favorites)
        setFavorites(data.favorites.map((salle: Salle) => salle.id))
      } else {
        console.error('Erreur lors du chargement des favoris')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavoriteSalles = async () => {
    // Cette fonction n'est plus nécessaire car loadFavorites charge directement les salles
    return
  }

  const toggleFavorite = async (salleId: string) => {
    try {
      const response = await fetch(`/api/user/favorites/${salleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Retirer de l'état local
        const newFavorites = favorites.filter(id => id !== salleId)
        const newFavoriteSalles = favoriteSalles.filter(salle => salle.id !== salleId)
        setFavorites(newFavorites)
        setFavoriteSalles(newFavoriteSalles)
      } else {
        console.error('Erreur lors de la suppression du favori')
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Agora
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des favoris...</p>
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Agora
            </a>
          </div>
          
          <div className="flex flex-1 flex-col">
            {/* En-tête */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Mes favoris</h1>
              <p className="text-muted-foreground text-sm">
                {favoriteSalles.length} salle{favoriteSalles.length > 1 ? 's' : ''} en favori{favoriteSalles.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto pb-20">
              {favoriteSalles.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Aucun favori</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez des salles à vos favoris pour les retrouver ici
                  </p>
                  <Link href="/salles">
                    <Button>Explorer les salles</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteSalles.map((salle) => (
                    <Link key={salle.id} href={`/salles/${salle.id}`} className="block">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                        {/* Cœur en position absolue tout en haut à droite */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 absolute top-2 right-2 z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(salle.id)
                          }}
                        >
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                        </Button>
                        
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="w-32 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {salle.images && salle.images.length > 0 ? (
                              <img
                                src={salle.images[0]}
                                alt={salle.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Contenu */}
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold truncate text-sm">{salle.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  {salle.city}
                                </div>
                              </div>
                              {salle.mairie.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Users className="w-3 h-3" />
                                {salle.capacity}
                              </div>
                              <div className="flex items-center gap-1 font-medium">
                                <Euro className="w-3 h-3" />
                                {salle.price}€/h
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              Par {salle.mairie.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}