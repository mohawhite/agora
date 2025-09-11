"use client"

import { GalleryVerticalEnd, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterUserPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('register_email')
    if (!savedEmail) {
      router.push('/auth/register')
      return
    }
    setEmail(savedEmail)
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    try {
      console.log('Données envoyées:', {
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.trim() || null,
        role: 'USER'
      })
      
      // Créer une Promise avec timeout
      const fetchWithTimeout = fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone.trim() || null,
          role: 'USER'
        }),
      })

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000) // 10 secondes
      )

      const response = await Promise.race([fetchWithTimeout, timeout]) as Response

      const data = await response.json()
      console.log('Réponse API:', data)

      if (response.ok) {
        sessionStorage.removeItem('register_email')
        router.push('/salles') // Page principale pour utilisateur
      } else {
        console.error('Erreur API:', data)
        setError(data.error || data.details?.[0]?.message || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      console.error('Erreur catch:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }
  return (
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
          <div className="w-full max-w-xs">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="absolute top-6 left-6">
                <Link href="/auth/register/role">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors" type="button">
                    <ArrowLeft className="size-5" />
                  </button>
                </Link>
              </div>
              
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Informations utilisateur</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Complétez vos informations pour créer votre compte
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Jean" 
                      value={formData.firstName}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Dupont" 
                      value={formData.lastName}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input 
                    id="birthDate" 
                    type="date" 
                    value={formData.birthDate}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="06 12 34 56 78" 
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre mot de passe" 
                      value={formData.password}
                      onChange={handleChange}
                      required 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmez votre mot de passe" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer le compte'}
                </Button>
              </div>
              
              <div className="text-center text-sm">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Se connecter
                </Link>
              </div>
            </form>
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
  )
}