"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { SalleForm } from "@/components/salle-form"

interface EditSallePageProps {
  params: { id: string }
}

export default function EditSallePage({ params }: EditSallePageProps) {
  const router = useRouter()
  const [salleData, setSalleData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('EditSallePage mounted, params.id:', params.id)
    loadSalle()
  }, [params.id])

  const loadSalle = async () => {
    try {
      console.log('Loading salle with ID:', params.id)
      const response = await fetch(`/api/salles/${params.id}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Salle data loaded:', data.salle)
        setSalleData(data.salle)
      } else {
        console.error('Failed to load salle, status:', response.status)
        alert('Salle non trouvée')
        router.push('/mairie/salles')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement de la salle')
      router.push('/mairie/salles')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/mairie/salles')
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

  return (
    <div className="min-h-screen bg-background">
      <SalleForm 
        initialData={salleData} 
        salleId={params.id}
        onSuccess={handleSuccess} 
      />
    </div>
  )
}