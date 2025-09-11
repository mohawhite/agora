"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GalleryVerticalEnd, MapPin, Users, Euro, Wifi, Car, Coffee, Search, Filter, Map, List, Heart, Building2 } from "lucide-react"
import BottomNavigation from "@/components/navigation/bottom-navigation"

const SallesMap = dynamic(() => import("@/components/map/salles-map"), {
  ssr: false,
  loading: () => <div className="h-full bg-muted rounded-lg flex items-center justify-center">Chargement de la carte...</div>
})

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [user, setUser] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    loadSalles()
    loadUser()
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/user/favorites')
      if (response.ok) {
        const data = await response.json()
        const favoriteIds = data.favorites.map((salle: any) => salle.id)
        setFavorites(favoriteIds)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    }
  }

  const loadUser = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

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

  const toggleFavorite = async (salleId: string) => {
    try {
      const response = await fetch(`/api/user/favorites/${salleId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const newFavorites = data.isFavorite 
          ? [...favorites, salleId]
          : favorites.filter(id => id !== salleId)
        
        setFavorites(newFavorites)
      } else {
        console.error('Erreur lors du toggle favori')
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
              <p className="text-muted-foreground">Chargement des salles...</p>
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

  if (viewMode === 'map') {
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
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Carte des salles</h1>
                <p className="text-muted-foreground text-sm">
                  {salles.length} salle{salles.length > 1 ? 's' : ''} sur la carte
                </p>
              </div>

              {/* Recherche - seulement pour les utilisateurs */}
              {user?.role !== 'MAIRIE' && (
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Ville (Paris, Lyon...)"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Filtres conditionnels */}
                  {showFilters && (
                    <div className="flex gap-3 mt-3">
                      <Input
                        type="number"
                        placeholder="Capacité min"
                        value={searchCapacity}
                        onChange={(e) => setSearchCapacity(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Prix max (€/h)"
                        value={searchMaxPrice}
                        onChange={(e) => setSearchMaxPrice(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sélecteur de vue */}
              <div className="flex gap-2 mb-6 bg-gray-50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-2" />
                  Liste
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 bg-white shadow-sm"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Carte
                </Button>
              </div>

              {/* Carte */}
              <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden mb-20">
                <SallesMap
                  salles={salles.map(salle => ({
                    id: salle.id,
                    name: salle.name,
                    address: salle.address,
                    city: salle.city,
                    price: salle.price,
                    capacity: salle.capacity,
                    image: salle.images?.[0],
                    mairie: salle.mairie.name
                  }))}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onSalleClick={(salleId) => {
                    window.location.href = `/salles/${salleId}`
                  }}
                />
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
              <h1 className="text-2xl font-bold mb-2">
                {user?.role === 'MAIRIE' ? 'Toutes les salles' : 'Explorer les salles'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {user?.role === 'MAIRIE' 
                  ? 'Découvrez les salles disponibles sur la plateforme'
                  : 'Trouvez la salle parfaite pour votre événement'
                }
              </p>
            </div>

            {/* Recherche - seulement pour les utilisateurs */}
            {user?.role !== 'MAIRIE' && (
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Ville (Paris, Lyon...)"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSearch} size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Filtres conditionnels */}
                {showFilters && (
                  <div className="flex gap-3 mt-3">
                    <Input
                      type="number"
                      placeholder="Capacité min"
                      value={searchCapacity}
                      onChange={(e) => setSearchCapacity(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Prix max (€/h)"
                      value={searchMaxPrice}
                      onChange={(e) => setSearchMaxPrice(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sélecteur de vue */}
            <div className="flex gap-2 mb-6 bg-gray-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 bg-white shadow-sm"
              >
                <List className="w-4 h-4 mr-2" />
                Liste
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('map')}
              >
                <Map className="w-4 h-4 mr-2" />
                Carte
              </Button>
            </div>

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto pb-20">
              {salles.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Aucune salle trouvée</h3>
                  <p className="text-sm text-muted-foreground">
                    Essayez d'autres critères de recherche
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    {salles.length} salle{salles.length > 1 ? 's' : ''} trouvée{salles.length > 1 ? 's' : ''}
                  </div>

                  <div className="space-y-4">
                    {salles.map((salle) => (
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
                            <Heart 
                              className={`w-3 h-3 ${favorites.includes(salle.id) ? 'fill-red-500 text-red-500' : ''}`}
                            />
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
                </>
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