"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mairieSchema, type MairieInput } from "@/lib/validations"

interface MairieProfileFormProps {
  initialData?: MairieInput | null
  onSuccess?: () => void
}

export function MairieProfileForm({ initialData, onSuccess }: MairieProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MairieInput>({
    resolver: zodResolver(mairieSchema),
    defaultValues: initialData || {}
  })

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const onSubmit = async (data: MairieInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mairie/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        onSuccess?.()
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profil de la Mairie</h1>
        <p className="text-muted-foreground">
          Complétez les informations de votre mairie pour pouvoir proposer vos salles.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la mairie *</Label>
            <Input
              id="name"
              placeholder="Mairie de..."
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
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

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Décrivez votre mairie..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="01 23 45 67 89"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email public</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@mairie-exemple.fr"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              placeholder="https://www.mairie-exemple.fr"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              placeholder="12345678901234"
              {...register("siret")}
            />
            {errors.siret && (
              <p className="text-sm text-red-500">{errors.siret.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer le profil'}
        </Button>
      </form>
    </div>
  )
}