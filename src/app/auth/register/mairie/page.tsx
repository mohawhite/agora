"use client"

import { GalleryVerticalEnd, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterMairiePage() {
  const [formData, setFormData] = useState({
    mairieNom: '',
    mairieAdresse: '',
    mairieVille: '',
    mairieCodePostal: '',
    mairiePhone: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
    
    // Autocomplétion pour l'adresse
    if (id === 'mairieAdresse' && value.length > 2) {
      searchAddress(value)
    } else if (id === 'mairieAdresse' && value.length <= 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  const searchAddress = async (query: string) => {
    try {
      const response = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setAddressSuggestions(data.results || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error)
    }
  }

  const selectAddress = (suggestion: any) => {
    // Extraire seulement l'adresse sans le code postal et la ville
    const fullAddress = suggestion.address
    
    // Supprimer le code postal (5 chiffres) et la ville à la fin
    let streetAddress = fullAddress
    
    // Pattern pour détecter "code postal ville" à la fin
    const postalPattern = /\s+\d{5}\s+.+$/
    if (postalPattern.test(streetAddress)) {
      streetAddress = streetAddress.replace(postalPattern, '').trim()
    }
    
    setFormData(prev => ({
      ...prev,
      mairieAdresse: streetAddress,
      mairieVille: suggestion.city || '',
      mairieCodePostal: suggestion.postalCode || ''
    }))
    setShowSuggestions(false)
    setAddressSuggestions([])
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: 'MAIRIE',
          mairieNom: formData.mairieNom,
          mairieAdresse: formData.mairieAdresse,
          mairieVille: formData.mairieVille,
          mairieCodePostal: formData.mairieCodePostal,
          mairiePhone: formData.mairiePhone.trim() || null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        sessionStorage.removeItem('register_email')
        router.push('/mairie/salles') // Page principale pour mairie
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
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
                <h1 className="text-2xl font-bold">Informations de la mairie</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Complétez les informations de votre mairie
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="mairieNom">Nom de la mairie</Label>
                  <Input 
                    id="mairieNom" 
                    placeholder="Mairie de Paris" 
                    value={formData.mairieNom}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="mairieAdresse">Adresse</Label>
                  <div className="relative">
                    <Input 
                      id="mairieAdresse" 
                      placeholder="1 Place de l'Hôtel de Ville" 
                      value={formData.mairieAdresse}
                      onChange={handleChange}
                      autoComplete="off"
                      required 
                    />
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectAddress(suggestion)}
                          >
                            <div className="font-medium text-sm">
                              {suggestion.address}
                            </div>
                            <div className="text-xs text-gray-500">
                              {suggestion.city} {suggestion.postalCode}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="mairieVille">Ville</Label>
                    <Input 
                      id="mairieVille" 
                      placeholder="Paris" 
                      value={formData.mairieVille}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="mairieCodePostal">Code postal</Label>
                    <Input 
                      id="mairieCodePostal" 
                      placeholder="75004" 
                      value={formData.mairieCodePostal}
                      onChange={handleChange}
                      maxLength={5}
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="mairiePhone">Téléphone (optionnel)</Label>
                  <Input 
                    id="mairiePhone" 
                    type="tel" 
                    placeholder="01 42 76 40 40" 
                    value={formData.mairiePhone}
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