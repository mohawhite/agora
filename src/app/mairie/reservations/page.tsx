"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Calendar, Clock, Euro, User, Phone, Mail, X, Check, AlertCircle } from "lucide-react"

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
  }
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
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

export default function MairieReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('PENDING')

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
    const confirmMessage = newStatus === 'CONFIRMED'
      ? 'Êtes-vous sûr de vouloir confirmer cette réservation ?'
      : newStatus === 'CANCELLED'
      ? 'Êtes-vous sûr de vouloir refuser cette réservation ?'
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

  const pendingCount = reservations.filter(r => r.status === 'PENDING').length

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Gestion des réservations</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de réservation pour vos salles
          </p>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente de traitement
              </span>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('PENDING')}
          >
            En attente ({reservations.filter(r => r.status === 'PENDING').length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({reservations.length})
          </Button>
          {Object.entries(STATUS_CONFIG).filter(([status]) => status !== 'PENDING').map(([status, config]) => {
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
                <p className="text-muted-foreground">
                  {filter === 'all'
                    ? 'Vous n\'avez pas encore reçu de demande de réservation.'
                    : 'Aucune réservation ne correspond à ce filtre.'
                  }
                </p>
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

                        {/* Informations client */}
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Client</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <strong>{reservation.user.firstName} {reservation.user.lastName}</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {reservation.user.email}
                            </div>
                            {reservation.user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {reservation.user.phone}
                              </div>
                            )}
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
                                {format(new Date(reservation.createdAt), 'dd/MM/yyyy HH:mm')}
                              </div>
                              <div className="text-muted-foreground">Demandée le</div>
                            </div>
                          </div>
                        </div>

                        {reservation.message && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-4">
                            <p className="text-sm"><strong>Message du client:</strong></p>
                            <p className="text-sm mt-1">{reservation.message}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {reservation.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(reservation.id, 'CONFIRMED')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accepter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </>
                        )}
                        {reservation.status === 'CONFIRMED' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(reservation.id, 'COMPLETED')}
                              className="text-green-600"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Marquer terminé
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4 mr-1" />
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