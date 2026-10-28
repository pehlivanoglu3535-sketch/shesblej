import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getListings } from '@/lib/listings';
import { t, catName, type LangCode } from '@/lib/i18n';
import ListingCard from '@/components/ListingCard';
import { getSiteUrl } from '@/lib/site';
import { CATEGORY_SLUGS, CITY_BY_SLUG, CITY_SLUGS, categoryPath, cityPath, slugifyCity } from '@/lib/taxonomy';

/**
 * Şehir sayfası: /qyteti/prishtine
 *
 * Yerel arama niyeti burada yakalanıyor: "banesa me qira Prishtinë",
 * "makina në shitje Prizren". Sorgu parametresiyle üretilen bu liste daha
 * önce indekslenemiyordu.
 */
export const revalidate = 600;

const MAX_CARDS = 60;

/**
 * Şehir sayfasının giriş cümlesi. Kısa ama dile duyarlı: Arnavutça ana pazar
 * olduğu için ilk sırada, diğer diller sitenin mevcut dil listesiyle aynı.
 */
const CITY_INTRO: Record<LangCode, (city: string) => string> = {
  sq: (c) => `Shpallje aktive në ${c}: banesa, makina dhe artikuj të përdorur. Kontaktoni shitësin direkt, pa ndërmjetës.`,
  sr: (c) => `Aktivni oglasi u ${c}: stanovi, automobili i polovna roba. Kontaktirajte prodavca direkt.`,
  tr: (c) => `${c} şehrinde güncel ilanlar: konut, araç ve ikinci el eşya. Satıcıyla doğrudan iletişime geçin.`,
  en: (c) => `Active listings in ${c}: homes, cars and second-hand goods. Contact the seller directly.`,
  de: (c) => `Aktuelle Anzeigen in ${c}: Immobilien, Fahrzeuge und Gebrauchtwaren. Direkt mit dem Verkäufer Kontakt aufnehmen.`,
  fr: (c) => `Annonces actives à ${c} : logements, voitures et articles d'occasion. Contactez directement le vendeur.`,
  it: (c) => `Annunci attivi a ${c}: case, auto e articoli usati. Contatta direttamente il venditore.`,
  bs: (c) => `Aktivni oglasi u ${c}: stanovi, automobili i polovna roba. Kontaktirajte prodavca direktno.`,
  el: (c) => `Ενεργές αγγελίες στην ${c}: σπίτια, αυτοκίνητα και μεταχειρισμένα είδη. Επικοινωνήστε απευθείας με τον πωλητή.`,
  ru: (c) => `Активные объявления в ${c}: жилье, автомобили и товары с рук. Свяжитесь с продавцом напрямую.`,
};

export async function generateMetadata({ params }: PageProps<'/qyteti/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];

  if (!city) {
    return { title: 'Sayfa bulunamadı', robots: { index: false, follow: true } };
  }

  const lang = await getLang();
  const listings = await getListings({ city });
  const count = listings.length;
  const path = cityPath(city);

  return {
    title: `${city} — ${count} ilan (konut, araç, eşya)`,
    description: `${city} şehrinde ${count} güncel ilan: satılık/kiralık konut, araç ve ikinci el eşya. ShesBlej — Kosova'nın ilan platformu.`,
    alternates: { canonical: path },
    robots: count > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: `${city} — güncel ilanlar`,
      description: CITY_INTRO[lang](city),
      url: path,
      images: ['/og-default.png'],
    },
  };
}

export default async function CityPage({ params }: PageProps<'/qyteti/[slug]'>) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) notFound();

  const lang = await getLang();
  const listings = await getListings({ city });
  const siteUrl = getSiteUrl();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ShesBlej', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: city, item: `${siteUrl}${cityPath(city)}` },
    ],
  };

  const itemList =
    listings.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          numberOfItems: listings.length,
          itemListElement: listings.slice(0, MAX_CARDS).map((listing, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${siteUrl}/listing/${listing.id}`,
            name: listing.title,
          })),
        }
      : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, '\\u003c') }}
        />
      )}

      <nav className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          ShesBlej
        </Link>
        {' › '}
        <span>{city}</span>
      </nav>

      <h1 className="text-2xl font-extrabold sm:text-3xl">{city}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{CITY_INTRO[lang](city)}</p>
      <p className="mt-2 text-xs text-muted">
        {listings.length} {t('listing_count_suffix', lang)}
      </p>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-glass-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">{t('empty_results', lang)}</p>
          <Link
            href="/post-ad"
            className="mt-4 inline-block rounded-lg bg-gradient-to-br from-primary to-primary-2 px-5 py-2.5 text-sm font-extrabold text-ink"
          >
            {t('post_ad_button', lang)}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.slice(0, MAX_CARDS).map((listing) => (
            <ListingCard key={listing.id} listing={listing} lang={lang} />
          ))}
        </div>
      )}

      <section className="mt-10 border-t border-glass-border pt-6">
        <h2 className="text-sm font-extrabold tracking-wide uppercase">{t('categories_title', lang)}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_SLUGS.map((category) => (
            <Link
              key={category}
              href={categoryPath(category)}
              className="rounded-lg border border-glass-border bg-white/5 px-3 py-1.5 text-xs font-bold hover:border-primary/40"
            >
              {catName(category, lang)}
            </Link>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-extrabold tracking-wide uppercase">
          {t('filter_all_cities', lang)}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CITY_SLUGS.filter((entry) => entry.slug !== slugifyCity(city)).map((entry) => (
            <Link
              key={entry.slug}
              href={cityPath(entry.city)}
              className="rounded-lg border border-glass-border bg-white/5 px-3 py-1.5 text-xs font-bold hover:border-primary/40"
            >
              {entry.city}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
