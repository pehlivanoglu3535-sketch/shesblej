import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

/**
 * /robots.txt
 *
 * Sitede robots.txt yoktu: Googlebot ve Bingbot'a neyi tarayacağı
 * söylenmiyor, sitemap de bildirilmiyordu. Bu dosya Next.js tarafından
 * statik olarak üretilir (app router dosya konvansiyonu).
 *
 * Kapalı tutulan yollar: oturum ve hesap sayfaları (içerik olarak değersiz,
 * tarama bütçesini yer), API rotaları ve arama sorgusu üreten /?q= varyantları
 * (sonsuz sayıda URL üretir).
 */
const SITE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/account-deletion',
          '/admin',
          '/api/',
          '/favorites',
          '/messages',
          '/my-listings',
          '/post-ad/edit',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/packages',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
