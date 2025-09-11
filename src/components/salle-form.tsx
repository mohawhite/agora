"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { salleSchema, type SalleInput } from "@/lib/validations"
import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"

interface SalleFormProps {
  initialData?: SalleInput | null
  onSuccess?: () => void
  salleId?: string
}

const AMENITIES_OPTIONS = [
  "WiFi gratuit",
  "Climatisation",
  "Chauffage",
  "Projecteur",
  "Écran",
  "Système audio",
  "Microphone",
  "Parking",
  "Accès PMR",
  "Cuisine équipée",
  "Réfrigérateur",
  "Machine à café",
  "Tables et chaises",
  "Tableau blanc",
  "Éclairage modulable"
]

export function SalleForm({ initialData, onSuccess, salleId }: SalleFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || [])
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SalleInput>({
    resolver: zodResolver(salleSchema),
    defaultValues: {
      ...initialData,
      amenities: initialData?.amenities || []
    }
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
      setSelectedAmenities(initialData.amenities || [])
    }
  }, [initialData, reset])

  const onSubmit = async (data: SalleInput) => {
    setIsLoading(true)
    try {
      const url = salleId ? `/api/salles/${salleId}` : '/api/salles'
      const method = salleId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Assurer que les cookies sont envoyés
        body: JSON.stringify((() => {
          const { id, ...submitData } = data
          return {
            ...submitData,
            amenities: selectedAmenities,
            available: true // Toujours disponible
          }
        })()),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        onSuccess?.()
        if (!salleId) {
          reset()
          setSelectedAmenities([])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities([...selectedAmenities, amenity])
    } else {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
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
    setValue('address', streetAddress)
    setValue('city', suggestion.city || '')
    setValue('postalCode', suggestion.postalCode || '')
    
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  return (
    <div className="grid lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Agora
          </Link>
        </div>
        <div className="flex flex-1 justify-center py-8 pb-24">
          <div className="w-full max-w-md">            
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">
                {salleId ? 'Modifier la salle' : 'Ajouter une salle'}
              </h1>
              <p className="text-muted-foreground text-sm">
                Renseignez les informations de votre salle pour la proposer à la location
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-600 text-sm font-medium mb-2">Erreurs de validation :</p>
                  {Object.entries(errors).map(([field, error]) => (
                    <p key={field} className="text-red-600 text-xs">
                      {field}: {error?.message}
                    </p>
                  ))}
                </div>
              )}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Nom de la salle *</Label>
                  <Input
                    id="name"
                    placeholder="Salle des fêtes..."
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre salle..."
                    className="min-h-[60px]"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="capacity">Capacité *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="50"
                      {...register("capacity", { valueAsNumber: true })}
                    />
                    {errors.capacity && (
                      <p className="text-xs text-red-500">{errors.capacity.message}</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="price">Prix/h (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      {...register("price", { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <p className="text-xs text-red-500">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="surface">Surface (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    placeholder="100"
                    {...register("surface", { valueAsNumber: true })}
                  />
                  {errors.surface && (
                    <p className="text-xs text-red-500">{errors.surface.message}</p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="address">Adresse *</Label>
                  <div className="relative">
                    <Input
                      id="address"
                      placeholder="123 Rue de la République"
                      {...register("address")}
                      autoComplete="off"
                      onChange={(e) => {
                        register("address").onChange(e)
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
                  {errors.address && (
                    <p className="text-xs text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      placeholder="Paris"
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="postalCode">Code postal *</Label>
                    <Input
                      id="postalCode"
                      placeholder="75001"
                      {...register("postalCode")}
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-red-500">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label>Équipements</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {AMENITIES_OPTIONS.slice(0, 8).map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleAmenityChange(amenity, !selectedAmenities.includes(amenity))}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label>Images de la salle (max 10)</Label>
                  <Controller
                    name="images"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        value={field.value || []}
                        onChange={field.onChange}
                        maxImages={10}
                      />
                    )}
                  />
                </div>

              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading 
                  ? (salleId ? 'Modification...' : 'Création...') 
                  : (salleId ? 'Modifier' : 'Créer la salle')
                }
              </Button>
            </form>
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