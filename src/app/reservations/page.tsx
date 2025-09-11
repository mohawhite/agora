"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Calendar, Clock, Euro, Building2, Phone, Mail, X, Check, CreditCard, GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import BottomNavigation from "@/components/navigation/bottom-navigation"

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
  const router = useRouter()
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
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des réservations...</p>
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
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Mes réservations</h1>
              <p className="text-muted-foreground text-sm">
                Suivez l'état de vos demandes de réservation
              </p>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
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
                    className="text-xs"
                  >
                    {config.label} ({count})
                  </Button>
                )
              })}
            </div>

            {/* Contenu principal */}
            <div className="flex-1 overflow-y-auto pb-20">
              {filteredReservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h2 className="text-xl font-semibold mb-3 text-gray-900">
                      {filter === 'all' 
                        ? 'Aucune réservation'
                        : `Aucune réservation ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()}`
                      }
                    </h2>
                    <p className="text-gray-600 mb-6">
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
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => {
                    const statusConfig = STATUS_CONFIG[reservation.status]
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-semibold text-gray-900">{reservation.salle.name}</h3>
                              <Badge className={`${statusConfig.color} text-xs font-medium`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {reservation.salle.address}, {reservation.salle.city}
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {reservation.salle.mairie.name}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {format(new Date(reservation.startDate), 'dd MMMM yyyy', { locale: fr })}
                                  </div>
                                  <div className="text-gray-600 text-sm">
                                    {format(new Date(reservation.startDate), 'HH:mm')} - {format(new Date(reservation.endDate), 'HH:mm')}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <Euro className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-gray-900">{reservation.totalPrice}€</div>
                                  <div className="text-gray-600 text-sm">Total</div>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {format(new Date(reservation.createdAt), 'dd/MM/yyyy')}
                                  </div>
                                  <div className="text-gray-600 text-sm">Demandée le</div>
                                </div>
                              </div>
                            </div>

                            {reservation.message && (
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                                <p className="text-sm text-blue-800"><strong>Message:</strong> {reservation.message}</p>
                              </div>
                            )}

                            {/* Contact mairie */}
                            <div className="flex flex-wrap gap-6 text-sm">
                              {reservation.salle.mairie.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{reservation.salle.mairie.phone}</span>
                                </div>
                              )}
                              {reservation.salle.mairie.email && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span>{reservation.salle.mairie.email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-3 ml-6">
                            {reservation.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                              >
                                Annuler
                              </Button>
                            )}
                            {reservation.status === 'CONFIRMED' && (
                              <>
                                {(!reservation.payment || reservation.payment.status !== 'COMPLETED') && (
                                  <Link href={`/reservations/${reservation.id}/paiement`}>
                                    <Button size="sm" className="w-full">
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Payer
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(reservation.id, 'CANCELLED')}
                                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 w-full"
                                >
                                  Annuler
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
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