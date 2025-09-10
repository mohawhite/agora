"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Building2, 
  Settings,
  PlusCircle,
  Bell
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
  {
    icon: Home,
    label: 'Accueil',
    href: '/dashboard',
    roles: ['USER', 'MAIRIE', 'ADMIN']
  },
  {
    icon: Search,
    label: 'Rechercher',
    href: '/salles',
    roles: ['USER', 'MAIRIE', 'ADMIN']
  },
  {
    icon: Calendar,
    label: 'Réservations',
    href: '/reservations',
    roles: ['USER']
  },
  {
    icon: Building2,
    label: 'Mes Salles',
    href: '/mairie/salles',
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
    roles: ['USER', 'MAIRIE', 'ADMIN']
  }
]

export default function BottomNavigation() {
  const [user, setUser] = useState<User | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    loadUser()
    loadNotificationCount()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadNotificationCount = async () => {
    try {
      const response = await fetch('/api/notifications?limit=100')
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.notifications?.filter((n: any) => !n.read).length || 0
        setNotificationCount(unreadCount)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  // Ne pas afficher sur les pages d'authentification
  if (pathname.startsWith('/auth/') || pathname === '/') {
    return null
  }

  // Filtrer les éléments de navigation selon le rôle utilisateur
  const filteredItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  // Ajout conditionnel d'éléments spéciaux
  const finalItems = [...filteredItems]

  // Ajouter le bouton "Ajouter" pour les mairies
  if (user?.role === 'MAIRIE') {
    const addButtonIndex = finalItems.findIndex(item => item.href === '/mairie/salles')
    if (addButtonIndex !== -1) {
      finalItems.splice(addButtonIndex + 1, 0, {
        icon: PlusCircle,
        label: 'Ajouter',
        href: '/mairie/salles/new',
        roles: ['MAIRIE']
      })
    }
  }

  // Ajouter les notifications si il y en a
  if (notificationCount > 0) {
    finalItems.unshift({
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      roles: ['USER', 'MAIRIE', 'ADMIN'],
      badge: notificationCount
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {finalItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (pathname.startsWith(item.href) && item.href !== '/dashboard')

            return (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs relative",
                  "transition-colors duration-200 ease-in-out",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-5 h-5 mb-1",
                    isActive && "text-primary"
                  )} />
                  
                  {/* Badge pour les notifications */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "truncate text-center leading-tight max-w-full",
                  isActive && "font-medium"
                )}>
                  {item.label}
                </span>
                
                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Espace de sécurité pour les notch sur mobile */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  )
}