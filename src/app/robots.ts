import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://agora.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth/login',
          '/auth/register',
          '/salles',
        ],
        disallow: [
          '/api/',
          '/reservations',
          '/profil',
          '/mairie/',
          '/auth/mot-de-passe-oublie',
          '/auth/nouveau-mot-de-passe',
          '/auth/verification-email',
          '/auth/verifier-email',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}