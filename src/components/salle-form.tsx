"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { salleSchema, type SalleInput } from "@/lib/validations"

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

  const {
    register,
    handleSubmit,
    reset,
    control,
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
        body: JSON.stringify({
          ...data,
          amenities: selectedAmenities
        }),
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {salleId ? 'Modifier la salle' : 'Ajouter une nouvelle salle'}
        </h1>
        <p className="text-muted-foreground">
          Renseignez les informations de votre salle pour la proposer à la location.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la salle *</Label>
            <Input
              id="name"
              placeholder="Salle des fêtes, Salle de réunion..."
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre salle, son ambiance, ses spécificités..."
              className="min-h-[100px]"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacité *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="50"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-sm text-red-500">{errors.capacity.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                step="0.1"
                placeholder="100.5"
                {...register("surface", { valueAsNumber: true })}
              />
              {errors.surface && (
                <p className="text-sm text-red-500">{errors.surface.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">Prix par heure (€) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="25.00"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              placeholder="123 Rue de la République"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="Paris"
                {...register("city")}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                placeholder="75001"
                {...register("postalCode")}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <Label>Équipements disponibles</Label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label
                    htmlFor={amenity}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="available"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="available"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="available" className="cursor-pointer">
              Salle disponible à la location
            </Label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading 
            ? (salleId ? 'Modification...' : 'Création...') 
            : (salleId ? 'Modifier la salle' : 'Créer la salle')
          }
        </Button>
      </form>
    </div>
  )
}