"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Euro, Phone, Mail, Globe, ArrowLeft, Calendar, Ruler, Building2, Check, Heart, GalleryVerticalEnd, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ReservationForm } from "@/components/reservation-form"
import BottomNavigation from "@/components/navigation/bottom-navigation"

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
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadSalle()
    loadUser()
  }, [params.id])

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

  const loadSalle = async () => {
    try {
      const response = await fetch(`/api/salles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSalle(data.salle)
        
        // Charger le statut favori
        try {
          const favResponse = await fetch('/api/user/favorites')
          if (favResponse.ok) {
            const favData = await favResponse.json()
            const favoriteIds = favData.favorites.map((salle: any) => salle.id)
            setIsFavorite(favoriteIds.includes(params.id))
          }
        } catch (favError) {
          console.error('Erreur favoris:', favError)
        }
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

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`/api/user/favorites/${params.id}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
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
              <p className="text-muted-foreground">Chargement...</p>
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

  if (!salle) {
    return null
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
            <div className="absolute top-6 left-6">
              <button 
                className="p-2 hover:bg-muted rounded-lg transition-colors" 
                type="button"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-5" />
              </button>
            </div>

            {/* En-tête salle */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{salle.name}</h1>
                    {salle.mairie.verified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="w-3 h-3" />
                    {salle.city}
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-3 h-3" />
                      {salle.capacity}
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Euro className="w-3 h-3" />
                      {salle.price}€/h
                    </div>
                    {salle.surface && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Ruler className="w-3 h-3" />
                        {salle.surface} m²
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Par {salle.mairie.name}
                  </div>
                </div>

                {user?.role !== 'MAIRIE' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={toggleFavorite}
                  >
                    <Heart 
                      className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </Button>
                )}
              </div>
              
              {user?.role !== 'MAIRIE' && (
                <Button 
                  className="w-full mb-4" 
                  onClick={() => setShowReservationForm(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Réserver maintenant
                </Button>
              )}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 overflow-y-auto pb-20">
              {/* Galerie d'images */}
              {salle.images && salle.images.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <div 
                    className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedImage(salle.images[0])
                      setCurrentImageIndex(0)
                    }}
                  >
                    <img
                      src={salle.images[0]}
                      alt={salle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {salle.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {salle.images.slice(1, 10).map((image, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedImage(image)
                            setCurrentImageIndex(index + 1)
                          }}
                        >
                          <img
                            src={image}
                            alt={`${salle.name} - ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {salle.images.length > 10 && (
                        <div 
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                          onClick={() => {
                            setSelectedImage(salle.images[9])
                            setCurrentImageIndex(9)
                          }}
                        >
                          <img
                            src={salle.images[9]}
                            alt={`${salle.name} - 10`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              +{salle.images.length - 9} photos
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-sm">Photos à venir</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {salle.description && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h2 className="font-semibold mb-2 text-sm">À propos de cette salle</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {salle.description}
                  </p>
                </div>
              )}

              {/* Équipements */}
              {salle.amenities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h2 className="font-semibold mb-3 text-sm">Équipements disponibles</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {salle.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibilités */}
              {salle.disponibilites.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h2 className="font-semibold mb-3 text-sm">Horaires d'ouverture</h2>
                  <div className="space-y-2">
                    {salle.disponibilites
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((dispo) => (
                        <div key={dispo.id} className="flex justify-between items-center py-1 text-xs">
                          <span className="font-medium">{DAYS_OF_WEEK[dispo.dayOfWeek]}</span>
                          <span className="text-gray-600">
                            {dispo.startTime} - {dispo.endTime}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Informations mairie */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h2 className="font-semibold mb-3 text-sm">Proposé par</h2>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{salle.mairie.name}</div>
                    <div className="text-xs text-gray-600">{salle.mairie.city}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {salle.mairie.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-3 h-3 text-gray-500" />
                      <span>{salle.mairie.phone}</span>
                    </div>
                  )}
                  {salle.mairie.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="w-3 h-3 text-gray-500" />
                      <span>{salle.mairie.email}</span>
                    </div>
                  )}
                  {salle.mairie.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3 h-3 text-gray-500" />
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
      
      {/* Formulaire de réservation */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Faire une réservation</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowReservationForm(false)}
              >
                Fermer
              </Button>
            </div>
            <div className="p-4">
              <ReservationForm 
                salle={{
                  id: salle.id,
                  name: salle.name,
                  price: salle.price,
                  capacity: salle.capacity
                }}
                onSuccess={(reservation) => {
                  setShowReservationForm(false)
                  router.push('/reservations')
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'agrandissement d'image */}
      {selectedImage && salle && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* Bouton précédent */}
            {currentImageIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation()
                  const newIndex = currentImageIndex - 1
                  setCurrentImageIndex(newIndex)
                  setSelectedImage(salle.images[newIndex])
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            
            {/* Bouton suivant */}
            {currentImageIndex < salle.images.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation()
                  const newIndex = currentImageIndex + 1
                  setCurrentImageIndex(newIndex)
                  setSelectedImage(salle.images[newIndex])
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            
            {/* Image */}
            <img
              src={selectedImage}
              alt="Image agrandie"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Indicateur de position */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {salle.images.length}
            </div>
          </div>
        </div>
      )}
      
      <BottomNavigation />
    </div>
  )
}