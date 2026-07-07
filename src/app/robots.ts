import type { MetadataRoute } from 'next'
import { APP_URL } from '@/constants/app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/partner/register'],
      disallow: ['/admin', '/partner', '/warehouse', '/delivery', '/api', '/checkout', '/orders', '/account'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
