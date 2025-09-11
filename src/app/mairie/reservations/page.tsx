"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { GalleryVerticalEnd, MapPin, Calendar, Clock, Euro, User, Phone, Mail, X, Check, AlertCircle, List, Grid3X3 } from "lucide-react"
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
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  } | null>(null)
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean
    message: string
  } | null>(null)
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    message: string
  } | null>(null)

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
    const statusLabels = {
      'CONFIRMED': 'confirmer',
      'CANCELLED': 'refuser', 
      'COMPLETED': 'marquer comme terminée'
    }
    
    const confirmMessage = `Êtes-vous sûr de vouloir ${statusLabels[newStatus as keyof typeof statusLabels]} cette réservation ?`
    
    setActionDialog({
      open: true,
      title: 'Confirmation',
      description: confirmMessage,
      action: async () => {
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
            setSuccessDialog({
              open: true,
              message: result.message
            })
            loadReservations()
          } else {
            const error = await response.json()
            setErrorDialog({
              open: true,
              message: error.error || 'Erreur lors de la mise à jour'
            })
          }
        } catch (error) {
          setErrorDialog({
            open: true,
            message: 'Erreur de connexion'
          })
        }
        setActionDialog(null)
      }
    })
  }

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true
    return reservation.status === filter
  })

  const pendingCount = reservations.filter(r => r.status === 'PENDING').length
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED')

  const generateCalendarDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || days.length < 35) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getReservationsForDay = (date: Date) => {
    return confirmedReservations.filter(reservation => {
      const reservationDate = new Date(reservation.startDate)
      return reservationDate.toDateString() === date.toDateString()
    })
  }

  const openReservationModal = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedReservation(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
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
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
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
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Gestion des réservations</h1>
              <p className="text-muted-foreground text-sm">
                Gérez les demandes de réservation pour vos salles
              </p>
              {pendingCount > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-6 justify-center">
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Liste
              </Button>
              <Button
                variant={view === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('calendar')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Calendrier
              </Button>
            </div>

            {view === 'list' && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
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
            )}

            <div className="flex-1 overflow-y-auto pb-20">
              {view === 'list' ? (
                <>
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">
                        {filter === 'all' 
                          ? 'Aucune réservation'
                          : `Aucune réservation ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()}`
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {filter === 'all'
                          ? 'Vous n\'avez pas encore reçu de demande de réservation.'
                          : 'Aucune réservation ne correspond à ce filtre.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredReservations.map((reservation) => {
                        const statusConfig = STATUS_CONFIG[reservation.status]
                        const StatusIcon = statusConfig.icon
                        
                        return (
                          <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">{reservation.salle.name}</h3>
                                  <Badge className={statusConfig.color}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>

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
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-1">
                      {format(new Date(), 'MMMM yyyy', { locale: fr })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Réservations confirmées ({confirmedReservations.length})
                    </p>
                  </div>

                  {confirmedReservations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">Aucune réservation confirmée</h3>
                      <p className="text-sm text-muted-foreground">
                        Aucune réservation confirmée à afficher dans le calendrier.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-7 border-b border-gray-200">
                        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                          <div key={day} className="p-2 text-center font-medium text-sm bg-gray-50">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7">
                        {generateCalendarDays().map((date, index) => {
                          const dayReservations = getReservationsForDay(date)
                          const isCurrentMonth = date.getMonth() === new Date().getMonth()
                          const isToday = date.toDateString() === new Date().toDateString()

                          return (
                            <div
                              key={index}
                              className={`min-h-[80px] p-1 border-b border-r border-gray-200 ${
                                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                              } ${isToday ? 'bg-blue-50' : ''}`}
                            >
                              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayReservations.slice(0, 2).map((reservation) => (
                                  <div
                                    key={reservation.id}
                                    className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-green-200 transition-colors"
                                    title={`${reservation.salle.name} - ${reservation.user.firstName} ${reservation.user.lastName}`}
                                    onClick={() => openReservationModal(reservation)}
                                  >
                                    {format(new Date(reservation.startDate), 'HH:mm')} {reservation.salle.name}
                                  </div>
                                ))}
                                {dayReservations.length > 2 && (
                                  <div 
                                    className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                                    onClick={() => {
                                      if (dayReservations[2]) {
                                        openReservationModal(dayReservations[2])
                                      }
                                    }}
                                  >
                                    +{dayReservations.length - 2} autre{dayReservations.length > 3 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
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

      {/* Modal de détail de réservation avec Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail de la réservation</DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  Salle
                </h4>
                <p className="font-semibold">{selectedReservation.salle.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedReservation.salle.address}, {selectedReservation.salle.city}
                </p>
                <p className="text-sm text-gray-600">
                  Capacité: {selectedReservation.salle.capacity} personnes
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  Client
                </h4>
                <p className="font-semibold">
                  {selectedReservation.user.firstName} {selectedReservation.user.lastName}
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedReservation.user.email}
                  </div>
                  {selectedReservation.user.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedReservation.user.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  Date et heure
                </h4>
                <p className="font-semibold">
                  {format(new Date(selectedReservation.startDate), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedReservation.startDate), 'HH:mm')} - {format(new Date(selectedReservation.endDate), 'HH:mm')}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Euro className="w-4 h-4 text-gray-600" />
                  Tarification
                </h4>
                <p className="font-semibold text-lg">{selectedReservation.totalPrice}€</p>
                <p className="text-sm text-gray-600">
                  Prix total de la réservation
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Statut</h4>
                <Badge className={STATUS_CONFIG[selectedReservation.status].color}>
                  {selectedReservation.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                  {selectedReservation.status === 'CONFIRMED' && <Check className="w-3 h-3 mr-1" />}
                  {selectedReservation.status === 'CANCELLED' && <X className="w-3 h-3 mr-1" />}
                  {selectedReservation.status === 'COMPLETED' && <Check className="w-3 h-3 mr-1" />}
                  {STATUS_CONFIG[selectedReservation.status].label}
                </Badge>
              </div>

              {selectedReservation.message && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Message du client</h4>
                  <p className="text-sm">{selectedReservation.message}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
                Demande effectuée le {format(new Date(selectedReservation.createdAt), 'dd/MM/yyyy à HH:mm')}
              </div>

              {selectedReservation.status === 'CONFIRMED' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStatusChange(selectedReservation.id, 'COMPLETED')
                      closeModal()
                    }}
                    className="text-green-600 flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Marquer terminé
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleStatusChange(selectedReservation.id, 'CANCELLED')
                      closeModal()
                    }}
                    className="text-red-600 flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog pour les confirmations d'actions */}
      {actionDialog && (
        <AlertDialog open={actionDialog.open} onOpenChange={() => setActionDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={actionDialog.action}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* AlertDialog pour les messages de succès */}
      {successDialog && (
        <AlertDialog open={successDialog.open} onOpenChange={() => setSuccessDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-green-600">Succès</AlertDialogTitle>
              <AlertDialogDescription>
                {successDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setSuccessDialog(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* AlertDialog pour les messages d'erreur */}
      {errorDialog && (
        <AlertDialog open={errorDialog.open} onOpenChange={() => setErrorDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Erreur</AlertDialogTitle>
              <AlertDialogDescription>
                {errorDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorDialog(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}