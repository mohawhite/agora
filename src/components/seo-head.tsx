import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  ogImage?: string
  noIndex?: boolean
}

export default function SEOHead({
  title = 'Agora - Réservation de salles municipales',
  description = 'Réservez facilement des salles municipales pour vos événements. Interface simple, réservation en ligne, paiement sécurisé.',
  keywords = 'réservation, salle municipale, événement, mairie, location, salle des fêtes',
  canonical,
  ogImage = '/og-image.jpg',
  noIndex = false
}: SEOHeadProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://agora.com'
  const fullTitle = title.includes('Agora') ? title : `${title} | Agora`

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {!noIndex && <meta name="robots" content="index,follow" />}
      
      {canonical && <link rel="canonical" href={`${baseUrl}${canonical}`} />}
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:url" content={`${baseUrl}${canonical || ''}`} />
      <meta property="og:site_name" content="Agora" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      
      {/* Additional SEO tags */}
      <meta name="author" content="Agora" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Agora",
            "description": description,
            "url": baseUrl,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            },
            "provider": {
              "@type": "Organization",
              "name": "Agora"
            }
          })
        }}
      />
    </Head>
  )
}