"use client"

import { useState, useEffect } from "react"
import { MairieProfileForm } from "@/components/mairie-profile-form"
import { redirect } from 'next/navigation'

export default function MairieProfilePage() {
  const [mairieData, setMairieData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      // Vérifier l'auth via l'API profil mairie
      const response = await fetch('/api/mairie/profile')
      
      if (!response.ok) {
        if (response.status === 401) {
          redirect('/auth/login')
          return
        }
        if (response.status === 403) {
          redirect('/dashboard')
          return
        }
      }

      const data = await response.json()
      setMairieData(data.mairie)
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      redirect('/auth/login')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <MairieProfileForm 
        initialData={mairieData} 
        onSuccess={() => {
          checkAuthAndLoadProfile()
        }}
      />
    </div>
  )
}