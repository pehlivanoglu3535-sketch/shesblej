import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getListings } from '@/lib/listings';
import { t, catName, catDesc } from '@/lib/i18n';
import ListingCard from '@/components/ListingCard';
import { getSiteUrl } from '@/lib/site';
import { CATEGORY_SLUGS, CITY_SLUGS, categoryPath, cityPath, isCategorySlug } from '@/lib/taxonomy';

/**
 * Kategori sayfası: /kategori/vasita
 *
 * Neden ayrı sayfa: ana sayfadaki kategori filtresi `/?category=vasita`
 * şeklinde çalışıyordu. Sorgu parametreleri arama motorlarında ayrı sayfa
 * sayılmaz, dolayısıyla "Kosova'da satılık vasıta" gibi bir aramada
 * gösterilecek bir sayfa yoktu. Bu adres o boşluğu dolduruyor.
 */
export const revalidate = 600;

const MAX_CARDS = 60;

export async function generateMetadata({ params }: PageProps<'/kategori/[slug]'>): Promise<Metadata> {
  const { slug } = await params;

  if (!isCategorySlug(slug)) {
    return { title: 'Sayfa bulunamadı', robots: { index: false, follow: true } };
  }

  const lang = await getLang();
  const name = catName(slug, lang);
  const description = catDesc(slug, lang);
  const listings = await getListings({ category: slug });
  const count = listings.length;
  const path = categoryPath(slug);

  return {
    title: `${name} — Kosova (${count} ilan)`,
    description: `${description} Kosova genelinde ${count} güncel ${name.toLowerCase()} ilanı. ShesBlej'de ücretsiz ilan verin.`,
    alternates: { canonical: path },
    // İlan yoksa sayfa ince içerik olur; indekslenmesin ama takip edilsin.
    robots: count > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: `${name} — Kosova`,
      description,
      url: path,
      images: ['/og-default.png'],
    },
  };
}

export default async function CategoryPage({ params }: PageProps<'/kategori/[slug]'>) {
  const { slug } = await params;
  if (!isCategorySlug(slug)) notFound();

  const lang = await getLang();
  const name = catName(slug, lang);
  const description = catDesc(slug, lang);
  const listings = await getListings({ category: slug });
  const siteUrl = getSiteUrl();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ShesBlej', item: siteUrl },
      { '@type': 'ListItem', position: 2, name, item: `${siteUrl}${categoryPath(slug)}` },
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
        <span>{name}</span>
      </nav>

      <h1 className="text-2xl font-extrabold sm:text-3xl">{name}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
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

      {/* İç linkleme: arama motoru botu ve kullanıcı buradan komşu sayfalara
          geçiyor. Yalnızca bu sayfanın alt yapısında duruyor, menüyü şişirmiyor. */}
      <section className="mt-10 border-t border-glass-border pt-6">
        <h2 className="text-sm font-extrabold tracking-wide uppercase">{t('categories_title', lang)}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_SLUGS.filter((other) => other !== slug).map((other) => (
            <Link
              key={other}
              href={categoryPath(other)}
              className="rounded-lg border border-glass-border bg-white/5 px-3 py-1.5 text-xs font-bold hover:border-primary/40"
            >
              {catName(other, lang)}
            </Link>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-extrabold tracking-wide uppercase">
          {t('filter_all_cities', lang)}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {CITY_SLUGS.map((entry) => (
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
