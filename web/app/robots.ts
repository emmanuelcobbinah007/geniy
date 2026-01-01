import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://geniy.aurorasoftwarelabs.io'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/create-survey/',
          '/onboarding/',
          '/payment/',
          '/s/', // Survey response pages (private)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
