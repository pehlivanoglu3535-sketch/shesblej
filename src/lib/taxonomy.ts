import { CITIES, CATEGORIES, type CategoryId } from '@/lib/constants';

/**
 * SEO sayfalarının URL sözlüğü.
 *
 * Kategori ve şehir sayfaları ayrı adreslerde yaşamalı: `/?category=vasita`
 * gibi sorgu parametreleri arama motorları tarafından ayrı sayfa olarak
 * indekslenmiyor ve her filtre kombinasyonu için sonsuz URL üretiyor.
 * Buradaki slug'lar sabit — bir kez indekslendikten sonra değiştirilmemeli,
 * değişirse 301 gerekir.
 */

export function slugifyCity(name: string): string {
  return name
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CITY_BY_SLUG: Record<string, string> = Object.fromEntries(
  CITIES.map((city) => [slugifyCity(city), city]),
);

export const CITY_SLUGS: { slug: string; city: string }[] = CITIES.map((city) => ({
  slug: slugifyCity(city),
  city,
}));

export const CATEGORY_SLUGS: CategoryId[] = CATEGORIES.map((c) => c.id);

export function isCategorySlug(slug: string): slug is CategoryId {
  return (CATEGORY_SLUGS as string[]).includes(slug);
}

export function categoryPath(slug: CategoryId): string {
  return `/kategori/${slug}`;
}

export function cityPath(city: string): string {
  return `/qyteti/${slugifyCity(city)}`;
}
