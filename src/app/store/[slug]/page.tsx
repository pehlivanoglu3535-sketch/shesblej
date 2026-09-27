import { notFound } from 'next/navigation';
import ListingCard from '@/components/ListingCard';
import { getLang } from '@/lib/get-lang';
import { t } from '@/lib/i18n';
import { getListings } from '@/lib/listings';
import { getStoreBySlug } from '@/lib/stores';

/**
 * Partner mağaza sayfası.
 *
 * `/gallery/[id]` sayfasından ayrı duruyor: o, sitede kaydolmuş bir işletme
 * profilini gösteriyor ve ilanları sahibine göre çekiyor. Burada ise mağaza
 * ilan sahibinden bağımsız — içe aktarılan envanterin tamamı tek bir hesaba
 * ait olduğu için sahibe göre ayırmak mümkün değil.
 */
export default async function StorePage({ params }: PageProps<'/store/[slug]'>) {
  const { slug } = await params;
  const lang = await getLang();

  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const listings = await getListings({ storeId: store.id });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-7 rounded-2xl border border-glass-border bg-surface p-6">
        <div className="flex flex-wrap items-center gap-4">
          {store.logo_url ? (
            // Logolar geniş kelime markası (600x160); kare bir kutuya
            // kırpmak hepsini okunmaz yapardı, o yüzden kendi oranında
            // duruyor ve yükseklik sabit.
            <span className="flex h-16 w-[180px] shrink-0 items-center justify-center rounded-xl bg-white/5 px-4">
              <img src={store.logo_url} alt={store.name} className="h-9 w-auto object-contain" />
            </span>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-2 text-2xl font-extrabold text-ink">
              {store.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{store.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {listings.length} {t('listing_count_suffix', lang)}
              {store.city ? ` · ${store.city}` : ''}
            </p>
          </div>
        </div>

        {store.about && <p className="mt-4 text-sm leading-relaxed text-[#cbc6ba]">{store.about}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-bold text-ink"
            >
              {store.phone}
            </a>
          )}
          {store.website && (
            <a
              href={store.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold"
            >
              {new URL(store.website).hostname.replace(/^www\./, '')}
            </a>
          )}
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('empty_results', lang)}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} lang={lang} />
          ))}
        </div>
      )}
    </main>
  );
}
