"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Users, Calendar, Settings } from "lucide-react"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  mairie?: {
    id: string
    name: string
    verified: boolean
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler la récupération des données utilisateur via une API
    // En attendant, on peut créer une API /api/user/me
    setLoading(false)
  }, [])

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard Agora</h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace personnel
          </p>
        </div>

        {/* Cartes d'actions pour les mairies */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          
          {/* Gestion du profil mairie */}
          <Link href="/mairie/profile">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">Profil Mairie</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gérez les informations de votre mairie
              </p>
            </div>
          </Link>

          {/* Gestion des salles */}
          <Link href="/mairie/salles">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold">Mes Salles</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ajoutez et gérez vos salles
              </p>
            </div>
          </Link>

          {/* Rechercher des salles (pour tous) */}
          <Link href="/salles">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold">Rechercher</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Trouvez la salle parfaite
              </p>
            </div>
          </Link>

          {/* Mes réservations */}
          <Link href="/reservations">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold">Mes Réservations</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Suivez vos réservations
              </p>
            </div>
          </Link>

          {/* Gestion réservations mairie */}
          <Link href="/mairie/reservations">
            <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold">Réservations reçues</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gérez les demandes de réservation
              </p>
            </div>
          </Link>

          {/* Paramètres */}
          <div className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold">Paramètres</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Gérez votre compte
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/mairie/salles/new">
              <Button>
                Ajouter une salle
              </Button>
            </Link>
            <Link href="/salles">
              <Button variant="outline">
                Rechercher des salles
              </Button>
            </Link>
            <Button variant="outline" onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' })
                .then(() => window.location.href = '/auth/login')
            }}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}