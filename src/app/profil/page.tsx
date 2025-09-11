"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GalleryVerticalEnd, User, Building2, Mail, Phone, LogOut, Edit, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

const userProfileSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().optional()
})

const mairieProfileSchema = z.object({
  name: z.string().min(1, 'Le nom de la mairie est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  city: z.string().min(1, 'La ville est requise'),
  postalCode: z.string().min(5, 'Code postal invalide').max(5, 'Code postal invalide'),
  phone: z.string().optional()
})

type UserProfileForm = z.infer<typeof userProfileSchema>
type MairieProfileForm = z.infer<typeof mairieProfileSchema>

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  createdAt: string
  mairie?: {
    id: string
    name: string
    address: string
    city: string
    postalCode: string
    phone: string | null
    email: string | null
    website: string | null
    verified: boolean
  }
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()

  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    formState: { errors: errorsUser },
    reset: resetUser
  } = useForm<UserProfileForm>({
    resolver: zodResolver(userProfileSchema)
  })

  const {
    register: registerMairie,
    handleSubmit: handleSubmitMairie,
    formState: { errors: errorsMairie },
    reset: resetMairie,
    setValue: setValueMairie
  } = useForm<MairieProfileForm>({
    resolver: zodResolver(mairieProfileSchema)
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        if (data.user.role === 'MAIRIE' && data.user.mairie) {
          resetMairie({
            name: data.user.mairie.name,
            address: data.user.mairie.address,
            city: data.user.mairie.city,
            postalCode: data.user.mairie.postalCode,
            phone: data.user.mairie.phone || ''
          })
        } else {
          resetUser({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            phone: data.user.phone || ''
          })
        }
      } else {
        console.error('Erreur lors du chargement du profil')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitUser = async (data: UserProfileForm) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        setIsEditing(false)
        // Mise à jour réussie sans alert
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur de connexion')
    } finally {
      setUpdating(false)
    }
  }

  const onSubmitMairie = async (data: MairieProfileForm) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/mairie/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        setIsEditing(false)
        // Mise à jour réussie sans alert
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur de connexion')
    } finally {
      setUpdating(false)
    }
  }

  const searchAddress = async (query: string) => {
    try {
      const response = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setAddressSuggestions(data.results || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error)
    }
  }

  const selectAddress = (suggestion: any) => {
    // Extraire seulement l'adresse sans le code postal et la ville
    const fullAddress = suggestion.address
    
    // Supprimer le code postal (5 chiffres) et la ville à la fin
    let streetAddress = fullAddress
    
    // Pattern pour détecter "code postal ville" à la fin
    const postalPattern = /\s+\d{5}\s+.+$/
    if (postalPattern.test(streetAddress)) {
      streetAddress = streetAddress.replace(postalPattern, '').trim()
    }
    
    // Utiliser setValue pour mettre à jour les champs react-hook-form
    setValueMairie('address', streetAddress)
    setValueMairie('city', suggestion.city || '')
    setValueMairie('postalCode', suggestion.postalCode || '')
    
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
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
              <p className="text-muted-foreground">Chargement du profil...</p>
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

  if (!user) {
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
              <h1 className="text-xl font-semibold mb-2">Erreur</h1>
              <p className="text-muted-foreground">Impossible de charger le profil</p>
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
          <div className="w-full max-w-xs">
            <div className="flex flex-col items-center gap-6">
              
              {/* En-tête profil */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {user.role === 'MAIRIE' ? (
                    <Building2 className="w-8 h-8 text-gray-600" />
                  ) : (
                    <User className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <h1 className="text-2xl font-bold">
                  {user.role === 'MAIRIE' ? user.mairie?.name || 'Mairie' : `${user.firstName} ${user.lastName}`}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {user.role === 'MAIRIE' ? 'Compte Mairie' : 'Utilisateur'}
                </p>
              </div>

              {/* Informations */}
              <div className="w-full space-y-4">
                {!isEditing ? (
                  <>
                    {/* Mode affichage */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">{user.phone}</span>
                        </div>
                      )}
                      
                      {user.role !== 'MAIRIE' && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Membre depuis le {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      )}
                      
                      {user.mairie && (
                        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <p className="text-sm text-gray-600">
                            {user.mairie.address}, {user.mairie.postalCode} {user.mairie.city}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Boutons actions */}
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier mes informations
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mode édition */}
                    {user.role === 'MAIRIE' ? (
                      <form onSubmit={handleSubmitMairie(onSubmitMairie)} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nom de la mairie</Label>
                          <Input
                            id="name"
                            {...registerMairie('name')}
                            placeholder="Nom de la mairie"
                          />
                          {errorsMairie.name && (
                            <p className="text-xs text-red-600 mt-1">{errorsMairie.name.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="address">Adresse</Label>
                          <div className="relative">
                            <Input
                              id="address"
                              {...registerMairie('address')}
                              placeholder="Adresse complète"
                              autoComplete="off"
                              onChange={(e) => {
                                registerMairie('address').onChange(e)
                                const value = e.target.value
                                if (value.length > 2) {
                                  searchAddress(value)
                                } else {
                                  setAddressSuggestions([])
                                  setShowSuggestions(false)
                                }
                              }}
                            />
                            {showSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                {addressSuggestions.map((suggestion, index) => (
                                  <div
                                    key={index}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => selectAddress(suggestion)}
                                  >
                                    <div className="font-medium text-sm">
                                      {suggestion.address}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {suggestion.city} {suggestion.postalCode}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {errorsMairie.address && (
                            <p className="text-xs text-red-600 mt-1">{errorsMairie.address.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city">Ville</Label>
                            <Input
                              id="city"
                              {...registerMairie('city')}
                              placeholder="Ville"
                            />
                            {errorsMairie.city && (
                              <p className="text-xs text-red-600 mt-1">{errorsMairie.city.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="postalCode">Code postal</Label>
                            <Input
                              id="postalCode"
                              {...registerMairie('postalCode')}
                              placeholder="75001"
                            />
                            {errorsMairie.postalCode && (
                              <p className="text-xs text-red-600 mt-1">{errorsMairie.postalCode.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone">Téléphone (optionnel)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...registerMairie('phone')}
                            placeholder="01 23 45 67 89"
                          />
                        </div>

                        <div className="space-y-3">
                          <Button type="submit" className="w-full" disabled={updating}>
                            {updating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Mise à jour...
                              </>
                            ) : (
                              'Enregistrer'
                            )}
                          </Button>
                          
                          <Button 
                            type="button"
                            variant="outline" 
                            className="w-full"
                            onClick={() => setIsEditing(false)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSubmitUser(onSubmitUser)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">Prénom</Label>
                            <Input
                              id="firstName"
                              {...registerUser('firstName')}
                              placeholder="Votre prénom"
                            />
                            {errorsUser.firstName && (
                              <p className="text-xs text-red-600 mt-1">{errorsUser.firstName.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                              id="lastName"
                              {...registerUser('lastName')}
                              placeholder="Votre nom"
                            />
                            {errorsUser.lastName && (
                              <p className="text-xs text-red-600 mt-1">{errorsUser.lastName.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone">Téléphone (optionnel)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...registerUser('phone')}
                            placeholder="06 12 34 56 78"
                          />
                        </div>

                        <div className="space-y-3">
                          <Button type="submit" className="w-full" disabled={updating}>
                            {updating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Mise à jour...
                              </>
                            ) : (
                              'Enregistrer'
                            )}
                          </Button>
                          
                          <Button 
                            type="button"
                            variant="outline" 
                            className="w-full"
                            onClick={() => setIsEditing(false)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
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
  )
}