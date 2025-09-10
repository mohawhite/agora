"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, BellOff, X } from 'lucide-react'

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      checkSubscription()
      
      // Afficher le prompt si jamais demandé
      if (Notification.permission === 'default') {
        setTimeout(() => setShowPrompt(true), 3000) // 3 secondes après le chargement
      }
    }
  }, [])

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        }
      } catch (error) {
        console.error('Erreur vérification subscription:', error)
      }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Ce navigateur ne supporte pas les notifications')
      return
    }

    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('Erreur demande permission:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    try {
      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Créer la subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      // Envoyer au serveur
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      })

      setIsSubscribed(true)
    } catch (error) {
      console.error('Erreur subscription push:', error)
    }
  }

  const unsubscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          
          // Informer le serveur
          await fetch('/api/notifications/subscribe', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })
        }
      }
      setIsSubscribed(false)
    } catch (error) {
      console.error('Erreur désabonnement:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!showPrompt && (permission === 'granted' || permission === 'denied')) {
    return null
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Activer les notifications</h3>
              <p className="text-sm text-blue-700 mt-1">
                Recevez des alertes en temps réel pour vos réservations et les nouvelles importantes.
              </p>
              <div className="flex gap-2 mt-3">
                {permission === 'default' && (
                  <Button
                    size="sm"
                    onClick={requestPermission}
                    disabled={loading}
                  >
                    Activer
                  </Button>
                )}
                {permission === 'granted' && !isSubscribed && (
                  <Button
                    size="sm"
                    onClick={subscribeToPush}
                    disabled={loading}
                  >
                    S'abonner
                  </Button>
                )}
                {permission === 'granted' && isSubscribed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={unsubscribe}
                    disabled={loading}
                  >
                    <BellOff className="w-4 h-4 mr-1" />
                    Désactiver
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPrompt(false)}
                >
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPrompt(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}