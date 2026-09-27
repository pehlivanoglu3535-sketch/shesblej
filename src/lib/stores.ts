import { createClient } from '@/lib/supabase/server';

/**
 * Partner mağazaları.
 *
 * Mağaza, ilan sahibinden ayrı bir kavram: içe aktardığımız partner
 * envanterinin hepsi teknik olarak tek bir hesaba ait, ama kullanıcı açısından
 * Encar ile Auto Salloni Alberti ayrı satıcılar. `listings.store_id` bu ayrımı
 * taşıyor (migration_010).
 */
export type Store = {
  id: string;
  slug: string;
  name: string;
  about: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
};

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('id, slug, name, about, logo_url, website, phone, city')
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('getStoreBySlug:', error.message);
    return null;
  }
  return (data as Store) ?? null;
}

export async function getStoreById(id: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('id, slug, name, about, logo_url, website, phone, city')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('getStoreById:', error.message);
    return null;
  }
  return (data as Store) ?? null;
}

/** Mağaza listesi; her birinin aktif ilan sayısıyla. */
export async function getStoresWithCounts(): Promise<(Store & { listingCount: number })[]> {
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from('stores')
    .select('id, slug, name, about, logo_url, website, phone, city')
    .order('name');
  if (!stores?.length) return [];

  // Sayımlar tek sorguda: mağaza başına ayrı istek atmak, mağaza sayısı
  // arttıkça doğrusal olarak yavaşlardı.
  const { data: rows } = await supabase
    .from('listings')
    .select('store_id')
    .not('store_id', 'is', null)
    .gt('expires_at', new Date().toISOString());

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    const id = r.store_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (stores as Store[])
    .map((s) => ({ ...s, listingCount: counts.get(s.id) ?? 0 }))
    .filter((s) => s.listingCount > 0);
}
