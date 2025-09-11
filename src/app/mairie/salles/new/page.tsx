"use client"

import { useRouter } from 'next/navigation'
import { SalleForm } from "@/components/salle-form"
import BottomNavigation from "@/components/navigation/bottom-navigation"

export default function NewSallePage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/mairie/salles')
  }

  return (
    <div className="min-h-screen bg-background">
      <SalleForm onSuccess={handleSuccess} />
      <BottomNavigation />
    </div>
  )
}