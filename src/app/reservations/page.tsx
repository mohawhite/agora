"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Calendar, Clock, Euro, User, Building2, Phone, Mail, X, Check, CreditCard } from "lucide-react"
import Link from "next/link"

interface Reservation {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  message: string | null
  createdAt: string
  salle: {
    id: string
    name: string
    address: string
    city: string
    capacity: number
    price: number
    mairie: {
      name: string
      phone: string | null
      email: string | null
    }
  }
  user?: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  payment?: {
    id: string
    status: string
  }
}

const STATUS_CONFIG = {
  PENDING: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock 
  },
  CONFIRMED: { 
    label: 'Confirmée', 
    color: 'bg-green-100 text-green-800',
    icon: Check 
  },
  CANCELLED: { 
    label: 'Annulée', 
    color: 'bg-red-100 text-red-800',
    icon: X 
  },
  COMPLETED: { 
    label: 'Terminée', 
    color: 'bg-gray-100 text-gray-800',
    icon: Check 
  },
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/reservations')
      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations)
      } else {
        console.error('Erreur lors du chargement des réservations')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    const confirmMessage = newStatus === 'CANCELLED' 
      ? 'Êtes-vous sûr de vouloir annuler cette réservation ?'
      : `Confirmer le changement vers "${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}" ?`

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        loadReservations()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true
    return reservation.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des réservations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Mes réservations</h1>
          <p className="text-muted-foreground">
            Suivez l'état de vos demandes de réservation
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({reservations.length})
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = reservations.filter(r => r.status === status).length
            return (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {config.label} ({count})
              </Button>
            )
          })}
        </div>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Card>
              <CardContent className="p-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  {filter === 'all' 
                    ? 'Aucune réservation'
                    : `Aucune réservation ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()}`
                  }
                </h2>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all'
                    ? 'Vous n\'avez pas encore fait de réservation.'
                    : 'Aucune réservation ne correspond à ce filtre.'
                  }
                </p>
                {filter === 'all' && (
                  <Button asChild>
                    <a href="/salles">Rechercher des salles</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const statusConfig = STATUS_CONFIG[reservation.status]
              const StatusIcon = statusConfig.icon
              
              return (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{reservation.salle.name}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {reservation.salle.address}, {reservation.salle.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {reservation.salle.mairie.name}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(reservation.startDate), 'dd MMMM yyyy', { locale: fr })}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(reservation.startDate), 'HH:mm')} - {format(new Date(reservation.endDate), 'HH:mm')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Euro className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{reservation.totalPrice}€</div>
                              <div className="text-muted-foreground">Total</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(reservation.createdAt), 'dd/MM/yyyy')}
                              </div>
                              <div className="text-muted-foreground">Demandée le</div>
                            </div>
                          </div>
                        </div>

                        {reservation.message && (
                          <div className="bg-muted p-3 rounded-lg mb-4">
                            <p className="text-sm"><strong>Message:</strong> {reservation.message}</p>
                          </div>
                        )}

                        {/* Contact mairie */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {reservation.salle.mairie.phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {reservation.salle.mairie.phone}
                            </div>
                          )}
                          {reservation.salle.mairie.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {reservation.salle.mairie.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {reservation.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Annuler
                          </Button>
                        )}
                        {reservation.status === 'CONFIRMED' && (
                          <>
                            {(!reservation.payment || reservation.payment.status !== 'COMPLETED') && (
                              <Link href={`/reservations/${reservation.id}/paiement`}>
                                <Button size="sm" className="w-full mb-2">
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Payer
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              Annuler
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}