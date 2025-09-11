import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavigation from '@/components/navigation/bottom-navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Agora - Réservation de salles municipales',
    template: '%s | Agora'
  },
  description: 'Réservez facilement des salles municipales pour vos événements. Interface simple, réservation en ligne, paiement sécurisé.',
  keywords: ['réservation', 'salle municipale', 'événement', 'mairie', 'location', 'salle des fêtes'],
  authors: [{ name: 'Agora' }],
  creator: 'Agora',
  publisher: 'Agora',
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://agora.com'),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agora',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Agora',
    title: 'Agora - Réservation de salles municipales',
    description: 'Réservez facilement des salles municipales pour vos événements. Interface simple, réservation en ligne, paiement sécurisé.',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agora - Réservation de salles municipales',
    description: 'Réservez facilement des salles municipales pour vos événements. Interface simple, réservation en ligne, paiement sécurisé.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agora" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#e11d48" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={inter.className}>
        <main>
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  )
}
