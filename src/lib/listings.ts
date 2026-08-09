import { createClient } from '@/lib/supabase/server';
import type { CategoryId } from '@/lib/constants';

export type Listing = {
  id: string;
  owner_id: string | null;
  category: CategoryId;
  subcategory: string;
  title: string;
  price: number;
  city: string;
  district: string | null;
  map_lat: number | null;
  map_lng: number | null;
  phone: string;
  description: string;
  photos: string[];
  created_at: string;
  expires_at: string;
  is_urgent: boolean;
  is_highlighted: boolean;
  uses_showcase: boolean;
  brand: string | null;
};

export type ListingFilters = {
  category?: CategoryId;
  subcategory?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sort?: 'default' | 'price-asc' | 'price-desc';
  ownerId?: string;
  includeExpired?: boolean;
  brand?: string;
};

/** Strip characters that have special meaning in PostgREST filter syntax before
 *  embedding user input into an `.or()` filter string. */
function sanitizeForFilter(input: string): string {
  return input.replace(/[,()%_]/g, ' ').trim();
}

export function daysRemaining(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const supabase = await createClient();
  let q = supabase.from('listings').select('*');

  if (!filters.includeExpired) q = q.gt('expires_at', new Date().toISOString());
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.subcategory) q = q.eq('subcategory', filters.subcategory);
  if (filters.city) q = q.eq('city', filters.city);
  if (filters.ownerId) q = q.eq('owner_id', filters.ownerId);
  if (filters.brand) q = q.eq('brand', filters.brand);
  if (filters.minPrice != null) q = q.gte('price', filters.minPrice);
  if (filters.maxPrice != null) q = q.lte('price', filters.maxPrice);
  if (filters.query) {
    const term = sanitizeForFilter(filters.query);
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%`);
  }

  if (filters.sort === 'price-asc') q = q.order('price', { ascending: true });
  else if (filters.sort === 'price-desc') q = q.order('price', { ascending: false });
  else q = q.order('is_highlighted', { ascending: false }).order('is_urgent', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) {
    console.error('getListings failed:', error.message);
    return [];
  }
  return data as Listing[];
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
    if (error) return null;
    return data as Listing;
  } catch (err) {
    console.error('getListingById failed:', err);
    return null;
  }
}
