"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, addDays, isBefore, isAfter, isToday, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Euro, User } from "lucide-react"
import { z } from "zod"

const reservationFormSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  startTime: z.string().min(1, "Heure de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  message: z.string().optional(),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`)
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`)
  return endDateTime > startDateTime
}, {
  message: "La date/heure de fin doit être postérieure au début",
  path: ["endTime"],
})

type ReservationFormInput = z.infer<typeof reservationFormSchema>

interface Salle {
  id: string
  name: string
  price: number
  capacity: number
}

interface ReservationFormProps {
  salle: Salle
  onSuccess?: (reservation: any) => void
}

interface ExistingReservation {
  id: string
  startDate: string
  endDate: string
  status: string
}

export function ReservationForm({ salle, onSuccess }: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [duration, setDuration] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReservationFormInput>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      startTime: "09:00",
      endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      endTime: "12:00",
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    loadExistingReservations()
  }, [salle.id])

  useEffect(() => {
    calculatePrice()
  }, [watchedValues.startDate, watchedValues.startTime, watchedValues.endDate, watchedValues.endTime])

  const loadExistingReservations = async () => {
    try {
      const response = await fetch(`/api/reservations?salleId=${salle.id}&status=CONFIRMED,PENDING`)
      if (response.ok) {
        const data = await response.json()
        setExistingReservations(data.reservations)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
    }
  }

  const calculatePrice = () => {
    const { startDate, startTime, endDate, endTime } = watchedValues
    
    if (startDate && startTime && endDate && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = new Date(`${endDate}T${endTime}`)
      
      if (endDateTime > startDateTime) {
        const durationMs = endDateTime.getTime() - startDateTime.getTime()
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60))
        const total = durationHours * salle.price
        
        setDuration(durationHours)
        setTotalPrice(total)
      }
    }
  }

  const isTimeSlotConflicting = (startDate: string, startTime: string, endDate: string, endTime: string): boolean => {
    const requestStart = new Date(`${startDate}T${startTime}`)
    const requestEnd = new Date(`${endDate}T${endTime}`)

    return existingReservations.some(reservation => {
      const existingStart = new Date(reservation.startDate)
      const existingEnd = new Date(reservation.endDate)

      return (
        (reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') &&
        (
          (requestStart >= existingStart && requestStart < existingEnd) ||
          (requestEnd > existingStart && requestEnd <= existingEnd) ||
          (requestStart <= existingStart && requestEnd >= existingEnd)
        )
      )
    })
  }

  const onSubmit = async (data: ReservationFormInput) => {
    setIsLoading(true)
    
    try {
      // Vérifier les conflits côté client
      if (isTimeSlotConflicting(data.startDate, data.startTime, data.endDate, data.endTime)) {
        alert('Ce créneau est déjà réservé')
        setIsLoading(false)
        return
      }

      const startDateTime = new Date(`${data.startDate}T${data.startTime}`)
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`)

      const reservationData = {
        salleId: salle.id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        message: data.message,
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      })

      if (response.ok) {
        const result = await response.json()
        alert('Demande de réservation envoyée avec succès !')
        onSuccess?.(result.reservation)
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la réservation')
      }
    } catch (error) {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const isConflicting = watchedValues.startDate && watchedValues.startTime && 
                        watchedValues.endDate && watchedValues.endTime &&
                        isTimeSlotConflicting(watchedValues.startDate, watchedValues.startTime, 
                                            watchedValues.endDate, watchedValues.endTime)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Réserver {salle.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Date et heure de début */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="time"
                {...register("startTime")}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          {/* Date et heure de fin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="time"
                {...register("endTime")}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Alerte conflit */}
          {isConflicting && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ⚠️ Ce créneau est déjà réservé. Veuillez choisir une autre période.
              </p>
            </div>
          )}

          {/* Résumé de la réservation */}
          {duration > 0 && !isConflicting && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Résumé de votre réservation
              </h3>
              <div className="space-y-1 text-sm">
                <p><strong>Durée:</strong> {duration} heure{duration > 1 ? 's' : ''}</p>
                <p><strong>Prix par heure:</strong> {salle.price}€</p>
                <p><strong>Total:</strong> <span className="text-lg font-semibold text-primary">{totalPrice}€</span></p>
              </div>
            </div>
          )}

          {/* Message optionnel */}
          <div className="space-y-2">
            <Label htmlFor="message">Message pour la mairie (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre événement, vos besoins particuliers..."
              {...register("message")}
            />
          </div>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isLoading || isConflicting || duration === 0}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer la demande de réservation'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Votre demande sera examinée par la mairie.</p>
            <p>Vous recevrez une confirmation par email.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}