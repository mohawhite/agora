"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GalleryVerticalEnd, MapPin, Users, Euro, Search, Edit, Trash2, Building2, Plus } from "lucide-react"
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
  _count?: {
    reservations: number
  }
}

export default function MairieSallesPage() {
  const [salles, setSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredSalles, setFilteredSalles] = useState<Salle[]>([])

  useEffect(() => {
    loadSalles()
  }, [])

  useEffect(() => {
    // Filtrer les salles en fonction de la recherche
    if (searchQuery.trim() === "") {
      setFilteredSalles(salles)
    } else {
      const filtered = salles.filter(salle => 
        salle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salle.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salle.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSalles(filtered)
    }
  }, [searchQuery, salles])

  const loadSalles = async () => {
    try {
      const response = await fetch('/api/mairie/salles')
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la salle "${name}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/salles/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Salle supprimée avec succès')
        loadSalles()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const handleSearch = () => {
    // La recherche se fait automatiquement via useEffect
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
              <h1 className="text-2xl font-bold mb-2">Mes salles</h1>
              <p className="text-muted-foreground text-sm">
                Gérez vos salles disponibles à la location
              </p>
            </div>

            {/* Recherche */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher une salle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Résultats */}
            <div className="flex-1 overflow-y-auto pb-20">
              {filteredSalles.length === 0 && salles.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Aucune salle</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vous n'avez pas encore ajouté de salle. Commencez par créer votre première salle.
                  </p>
                  <Link href="/mairie/salles/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer ma première salle
                    </Button>
                  </Link>
                </div>
              ) : filteredSalles.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Aucune salle trouvée</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune salle ne correspond à votre recherche
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    {filteredSalles.length} salle{filteredSalles.length > 1 ? 's' : ''}
                  </div>

                  <div className="space-y-4">
                    {filteredSalles.map((salle) => (
                      <Link key={salle.id} href={`/salles/${salle.id}`} className="block">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                          {/* Boutons d'action en position absolue */}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Link href={`/mairie/salles/${salle.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 z-10" onClick={(e) => e.stopPropagation()}>
                                <Edit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 z-10"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDelete(salle.id, salle.name)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        
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
                          <div className="flex-1 min-w-0 pr-12">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold truncate text-sm">{salle.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  {salle.city}
                                </div>
                              </div>
                            </div>
                            
                            {salle.description && (
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                {salle.description}
                              </p>
                            )}
                            
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
                            
                            {salle._count && salle._count.reservations > 0 && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {salle._count.reservations} réservation{salle._count.reservations > 1 ? 's' : ''}
                                </Badge>
                              </div>
                            )}
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