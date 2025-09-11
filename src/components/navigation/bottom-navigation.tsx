"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Calendar, 
  User, 
  Building2, 
  PlusCircle,
  Heart,
  MessageCircle
} from 'lucide-react'

interface User {
  id: string
  role: 'USER' | 'MAIRIE' | 'ADMIN'
  firstName: string
  lastName: string
}

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  roles: string[]
  badge?: number
}

const navigationItems: NavigationItem[] = [
  // Pour les utilisateurs
  {
    icon: Search,
    label: 'Explorer',
    href: '/salles',
    roles: ['USER']
  },
  {
    icon: Heart,
    label: 'Favoris',
    href: '/favoris',
    roles: ['USER']
  },
  {
    icon: Calendar,
    label: 'Réservations',
    href: '/reservations',
    roles: ['USER']
  },
  {
    icon: MessageCircle,
    label: 'Messages',
    href: '/messages',
    roles: ['USER']
  },
  {
    icon: User,
    label: 'Profil',
    href: '/profil',
    roles: ['USER']
  },
  // Pour les mairies
  {
    icon: Building2,
    label: 'Mes Salles',
    href: '/mairie/salles',
    roles: ['MAIRIE']
  },
  {
    icon: PlusCircle,
    label: 'Ajouter',
    href: '/mairie/salles/new',
    roles: ['MAIRIE']
  },
  {
    icon: Calendar,
    label: 'Réservations',
    href: '/mairie/reservations',
    roles: ['MAIRIE']
  },
  {
    icon: User,
    label: 'Profil',
    href: '/profil',
    roles: ['MAIRIE']
  }
]

export default function BottomNavigation() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    loadUser()
  }, [])

  // Reload user data when pathname changes (after login redirect)
  useEffect(() => {
    if (pathname.startsWith('/mairie/') || pathname === '/salles' || pathname === '/reservations') {
      loadUser()
    }
  }, [pathname])

  const loadUser = async () => {
    try {
      const response = await fetch('/api/user/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ne pas afficher sur les pages d'authentification
  if (pathname.startsWith('/auth/') || pathname === '/') {
    return null
  }

  // Ne pas afficher si nous sommes en train de charger ou si aucun utilisateur
  if (loading || !user) {
    return null
  }

  // Filtrer les éléments de navigation selon le rôle utilisateur
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {filteredItems.map((item, index) => {
          const Icon = item.icon
          // Logique spéciale pour les pages /new - seule l'icône "Ajouter" doit être active
          const isActive = pathname.includes('/new') 
            ? item.href.includes('/new') 
            : (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/'))

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1"
            >
              <Icon className={cn(
                "w-4 h-4 mb-1",
                isActive ? "text-primary" : "text-gray-500"
              )} />
              
              <span className={cn(
                "text-xs text-center",
                isActive ? "font-medium text-primary" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}