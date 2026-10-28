import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSiteUrl } from '@/lib/site';
import { CATEGORY_SLUGS, CITY_SLUGS, categoryPath, cityPath } from '@/lib/taxonomy';

/**
 * /sitemap.xml
 *
 * Sitede sitemap yoktu; Google'a tek bir URL bile bildirilmiyordu. İlan
 * platformlarında trafiğin ana kaynağı organik arama olduğu için bu, en
 * yüksek getirili eksikti.
 *
 * Tasarım notları:
 * - Burada çerez okuyan `@/lib/supabase/server` yerine düz bir anon istemci
 *   kullanılıyor. Sebep: `cookies()` çağrısı rotayı istek başına dinamik
 *   yapar; sitemap ise saatte bir yeniden üretilip CDN'de durmalı. İlanlar
 *   zaten herkese açık (RLS: yayındaki ilanlar), oturum gerekmiyor.
 * - Sorgular try/catch içinde: Supabase bir an düşse bile sitemap 500
 *   dönmemeli, statik sayfalarla cevap vermeli.
 * - Google tek dosyada 50.000 URL kabul ediyor; şimdilik 5.000 ilanla
 *   sınırlandı, o sınıra gelindiğinde `generateSitemaps()` ile bölünmeli.
 */
const SITE_URL = getSiteUrl();

export const revalidate = 3600;

type Entry = {
  url: string;
  lastModified?: Date;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function listingEntries(): Promise<Entry[]> {
  const supabase = anonClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error || !data) return [];

    return data.map((row) => ({
      url: `${SITE_URL}/listing/${row.id}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

async function blogEntries(): Promise<Entry[]> {
  const supabase = anonClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !data) return [];

    return data.map((row) => ({
      url: `${SITE_URL}/blog/${row.slug}`,
      lastModified: new Date(row.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

async function storeEntries(): Promise<Entry[]> {
  const supabase = anonClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('stores').select('slug').limit(500);
    if (error || !data) return [];

    return data.map((row) => ({
      url: `${SITE_URL}/store/${row.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Kategori ve şehir sayfaları henüz ayrı URL değil (ana sayfada ?category=
  // sorgusu olarak çalışıyorlar), o yüzden burada yer almıyorlar. Ayrı
  // /kategori/[slug] sayfaları açıldığında buraya eklenmeli — yerel aramaların
  // asıl giriş kapısı onlar olacak.
  const staticEntries: Entry[] = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [listings, posts, stores] = await Promise.all([
    listingEntries(),
    blogEntries(),
    storeEntries(),
  ]);

  // Kategori ve şehir sayfaları: yerel aramaların ana giriş kapısı, bu yüzden
  // ilan listesinden hemen sonra geliyorlar.
  const taxonomyEntries: Entry[] = [
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}${categoryPath(slug)}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...CITY_SLUGS.map((entry) => ({
      url: `${SITE_URL}${cityPath(entry.city)}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];

  return [...staticEntries, ...taxonomyEntries, ...stores, ...posts, ...listings];
}
