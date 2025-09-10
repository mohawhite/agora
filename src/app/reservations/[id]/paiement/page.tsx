"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PaymentForm from '@/components/payment-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Euro, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

interface Reservation {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: string
  salle: {
    name: string
    address: string
    city: string
  }
  user: {
    firstName: string
    lastName: string
  }
  payment?: {
    id: string
    status: string
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReservation()
  }, [params.id])

  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReservation(data.reservation)
        
        // Si la réservation est confirmée et pas encore payée, créer l'intention de paiement
        if (data.reservation.status === 'CONFIRMED' && 
            (!data.reservation.payment || data.reservation.payment.status !== 'COMPLETED')) {
          await createPaymentIntent(data.reservation.id)
        }
      } else {
        const error = await response.json()
        setError(error.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentIntent = async (reservationId: string) => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId }),
      })

      if (response.ok) {
        const data = await response.json()
        setClientSecret(data.clientSecret)
      } else {
        const error = await response.json()
        setError(error.error || 'Erreur lors de la création du paiement')
      }
    } catch (error) {
      setError('Erreur lors de la création du paiement')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold mb-2">Erreur</h1>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link href="/reservations">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux réservations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Si déjà payé
  if (reservation.payment?.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Euro className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold mb-2">Paiement déjà effectué</h1>
              <p className="text-muted-foreground mb-4">Cette réservation a déjà été payée.</p>
              <Link href="/reservations">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux réservations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Si pas confirmée
  if (reservation.status !== 'CONFIRMED') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold mb-2">Paiement non disponible</h1>
              <p className="text-muted-foreground mb-4">
                Cette réservation doit être confirmée par la mairie avant de pouvoir être payée.
              </p>
              <Link href="/reservations">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux réservations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/reservations">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux réservations
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Paiement de la réservation</h1>
        </div>

        {/* Récapitulatif de la réservation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{reservation.salle.name}</div>
                <div className="text-sm text-muted-foreground">
                  {reservation.salle.address}, {reservation.salle.city}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(new Date(reservation.startDate), 'dd MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(reservation.startDate), 'HH:mm')} - {format(new Date(reservation.endDate), 'HH:mm')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {reservation.user.firstName} {reservation.user.lastName}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-semibold">Total à payer:</span>
              <span className="text-xl font-bold text-primary">{reservation.totalPrice}€</span>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de paiement */}
        {clientSecret && (
          <PaymentForm
            clientSecret={clientSecret}
            amount={reservation.totalPrice}
            reservationId={reservation.id}
            onSuccess={() => router.push('/reservations?payment=success')}
          />
        )}
      </div>
    </div>
  )
}