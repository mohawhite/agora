"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, MapPin, Users, Euro } from "lucide-react"

interface Salle {
  id: string
  name: string
  description: string | null
  capacity: number
  price: number
  city: string
  available: boolean
  _count: {
    reservations: number
  }
}

export default function MairieSallesPage() {
  const [salles, setSalles] = useState<Salle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSalles()
  }, [])

  const loadSalles = async () => {
    try {
      const response = await fetch('/api/mairie/salles')
      if (response.ok) {
        const data = await response.json()
        setSalles(data.salles)
      } else {
        console.error('Erreur lors du chargement des salles')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la salle "${name}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/salles/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Salle supprimée avec succès')
        loadSalles()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur de connexion')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des salles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mes salles</h1>
            <p className="text-muted-foreground">
              Gérez vos salles disponibles à la location
            </p>
          </div>
          <Link href="/mairie/salles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une salle
            </Button>
          </Link>
        </div>

        {salles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-card rounded-lg p-8 shadow-sm border">
              <h2 className="text-lg font-semibold mb-2">Aucune salle</h2>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore ajouté de salle. Commencez par créer votre première salle.
              </p>
              <Link href="/mairie/salles/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer ma première salle
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {salles.map((salle) => (
              <div key={salle.id} className="bg-card rounded-lg p-6 shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{salle.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        salle.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {salle.available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    
                    {salle.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {salle.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {salle.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {salle.capacity} personnes
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {salle.price}€/h
                      </div>
                    </div>

                    {salle._count.reservations > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-blue-600 font-medium">
                          {salle._count.reservations} réservation(s) active(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/mairie/salles/${salle.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(salle.id, salle.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}