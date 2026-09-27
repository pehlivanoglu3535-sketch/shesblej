import { getLang } from '@/lib/get-lang';
import { getListings } from '@/lib/listings';
import { CITY_COORDS, type CategoryId } from '@/lib/constants';
import { t, catName } from '@/lib/i18n';
import Hero from '@/components/Hero';
import Filters from '@/components/Filters';
import ListingCard from '@/components/ListingCard';
import TestimonialsSection from '@/components/TestimonialsSection';

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const lang = await getLang();
  const sp = await searchParams;

  const category = str(sp.category) as CategoryId | undefined;
  const subcategory = str(sp.subcategory);
  const city = str(sp.city);
  const minPrice = num(sp.minPrice);
  const maxPrice = num(sp.maxPrice);
  const query = str(sp.q);
  const brand = str(sp.brand);
  const sort = str(sp.sort) as 'default' | 'price-asc' | 'price-desc' | 'nearest' | undefined;
  const lat = num(sp.lat);
  const lng = num(sp.lng);

  let listings = await getListings({
    category,
    subcategory,
    city,
    minPrice,
    maxPrice,
    query,
    brand,
    sort: sort === 'nearest' ? undefined : sort,
  });

  if (sort === 'nearest' && lat != null && lng != null) {
    listings = listings.slice().sort((a, b) => {
      const ca = CITY_COORDS[a.city];
      const cb = CITY_COORDS[b.city];
      const da = ca ? distanceKm(lat, lng, ca.lat, ca.lng) : Infinity;
      const db = cb ? distanceKm(lat, lng, cb.lat, cb.lng) : Infinity;
      return da - db;
    });
  }

  const listTitle = query
    ? `${t('results_for', lang)} "${query}"`
    : category
      ? catName(category, lang)
      : t('featured_title', lang);

  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      {!category && !query && <Hero lang={lang} />}

      <Filters lang={lang} category={category} />

      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="mb-1.5 block text-[11px] font-extrabold tracking-[0.14em] text-primary uppercase">
            {t('eyebrow_listings', lang)}
          </span>
          <h2 className="text-xl font-extrabold">{listTitle}</h2>
        </div>
        <span className="text-sm text-muted">
          {listings.length} {t('listing_count_suffix', lang)}
        </span>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-glass-border bg-surface p-10 text-center text-muted">
          {t('empty_results', lang)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} lang={lang} />
          ))}
        </div>
      )}

      {!category && !query && <TestimonialsSection lang={lang} />}
    </main>
  );
}
