import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLang } from '@/lib/get-lang';
import { getListingById, getRelatedListings, daysRemaining } from '@/lib/listings';
import { getCurrentUser } from '@/lib/get-user';
import { categoryPhotoUri, listingHue } from '@/lib/photos';
import { t, catName, subName } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from './DeleteButton';
import PhotoGallery from './PhotoGallery';
import MessageForm from './MessageForm';
import ReportButton from './ReportButton';
import ShareButtons from './ShareButtons';
import LoanCalculator from './LoanCalculator';
import FavoriteButton from '@/components/FavoriteButton';
import CategoryIcon from '@/components/CategoryIcon';
import ListingCard from '@/components/ListingCard';
import VehicleSpecTable from '@/components/VehicleSpecTable';
import VehicleFeatures from '@/components/VehicleFeatures';
import { getStoreById } from '@/lib/stores';
import { formatKm, fuelLabel, transmissionLabel } from '@/lib/vehicle';

/**
 * Araç ilanının başlığı iki kademeli.
 *
 * Üstte ilan sahibinin yazdığı başlık olduğu gibi duruyor ("VOLKSWAGEN
 * TIGUAN R-LINE 2.0 TDI AUTOMATIK DSG"), altta ise künyeden üretilen sade
 * ad ("Volkswagen Tiguan 2022"). Satıcı başlığı donanım koduyla doldurmayı
 * seviyor; sade ad olmadan sayfada aracın ne olduğunu bir bakışta söyleyen
 * hiçbir satır kalmıyor.
 */
function headline(listing: { brand: string | null; model: string | null; year: number | null; title: string }): string | null {
  const parts = [listing.brand, listing.model, listing.year != null ? String(listing.year) : null].filter(Boolean);
  if (parts.length < 2) return null;
  const built = parts.join(' ');
  return built.toLowerCase() === listing.title.toLowerCase() ? null : built;
}

export default async function ListingDetailPage({ params }: PageProps<'/listing/[id]'>) {
  const { id } = await params;
  const lang = await getLang();
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const isOwner = user && listing.owner_id === user.id;
  const hasPhoto = listing.photos && listing.photos.length > 0;
  const mainPhoto = hasPhoto ? listing.photos[0] : categoryPhotoUri(listing.category);
  const days = daysRemaining(listing.expires_at);
  const isVehicle = listing.category === 'vasita';

  const store = listing.store_id ? await getStoreById(listing.store_id) : null;
  const related = await getRelatedListings(listing);
  const subtitle = headline(listing);

  let ownerBusiness: { companyName: string | null } | null = null;
  if (listing.owner_id) {
    const supabase = await createClient();
    const { data: owner } = await supabase
      .from('profiles_public')
      .select('account_type, company_name')
      .eq('id', listing.owner_id)
      .single();
    if (owner?.account_type === 'business') ownerBusiness = { companyName: owner.company_name };
  }

  let isFavorited = false;
  if (user) {
    const supabase = await createClient();
    const { data: fav } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle();
    isFavorited = !!fav;
  }

  // Künyenin en çok sorulan üç alanı fotoğrafın hemen altında da duruyor;
  // alıcı yan sütundaki tabloya inmeden yıl/kilometre/yakıtı görüyor.
  const quickFacts = isVehicle
    ? ([
        listing.year != null ? String(listing.year) : null,
        listing.mileage_km != null ? formatKm(listing.mileage_km) : null,
        fuelLabel(listing.fuel, lang),
        transmissionLabel(listing.transmission, lang),
      ].filter(Boolean) as string[])
    : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          ShesBlej
        </Link>
        {' › '}
        <Link href={`/?category=${listing.category}`} className="hover:text-primary">
          {catName(listing.category, lang)}
        </Link>
        {' › '}
        <span>{subName(listing.subcategory, lang)}</span>
      </nav>

      <h1 className="text-2xl font-extrabold uppercase sm:text-3xl">{listing.title}</h1>
      {subtitle && <p className="mt-1 text-lg font-bold text-muted">{subtitle}</p>}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-glass-border bg-surface p-4">
            {hasPhoto ? (
              <PhotoGallery photos={listing.photos} title={listing.title} />
            ) : (
              <div className="relative h-[260px] overflow-hidden rounded-lg sm:h-[340px]">
                <img
                  src={mainPhoto}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ filter: `hue-rotate(${listingHue(listing.id)}deg) saturate(1.1)` }}
                />
                <span
                  className="absolute top-2.5 right-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink"
                  style={{ background: 'rgba(253,210,2,.92)' }}
                >
                  <CategoryIcon id={listing.category} />
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-block rounded-full bg-gradient-to-br from-primary to-primary-2 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
                {catName(listing.category, lang)} · {subName(listing.subcategory, lang)}
              </span>
              {store && (
                <a
                  href={`/store/${store.slug}`}
                  className="inline-block rounded-full bg-[#3f6fb0] px-2.5 py-0.5 text-[11px] font-extrabold text-white hover:bg-[#4b80c9]"
                >
                  {store.name}
                </a>
              )}
              {!store && ownerBusiness && (
                <span className="inline-block rounded-full bg-[#3f6fb0] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  {ownerBusiness.companyName || t('badge_business_account', lang)}
                </span>
              )}
              {listing.is_urgent && (
                <span className="inline-block rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  {t('badge_urgent', lang)}
                </span>
              )}
              {listing.is_highlighted && (
                <span className="inline-block rounded-full bg-gradient-to-br from-primary to-primary-2 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
                  {t('badge_highlighted', lang)}
                </span>
              )}
            </div>

            <div className="mt-3 text-[30px] leading-none font-extrabold text-primary">
              €{Number(listing.price).toLocaleString('de-DE')}
            </div>
            <div className="mt-2 text-sm text-muted">
              {listing.city}
              {listing.district ? ` · ${listing.district}` : ''} ·{' '}
              {new Date(listing.created_at).toISOString().slice(0, 10)}
              {listing.map_lat != null ? ` · 📍 ${t('marked_on_map', lang)}` : ''}
            </div>
            <p className="mt-1 text-xs text-muted">
              ⏳ {days} {t('detail_expiry_suffix', lang)}
            </p>

            {quickFacts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quickFacts.map((fact) => (
                  <span
                    key={fact}
                    className="rounded-lg border border-glass-border bg-white/5 px-2.5 py-1 text-xs font-bold"
                  >
                    {fact}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <a
                    href={`/post-ad/edit/${listing.id}`}
                    className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold"
                  >
                    {t('btn_edit', lang)}
                  </a>
                  <DeleteButton listingId={listing.id} lang={lang} />
                </>
              ) : (
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={isFavorited}
                  isLoggedIn={!!user}
                  label={t('btn_favorite', lang)}
                />
              )}
              <ShareButtons title={listing.title} lang={lang} />
              {!isOwner && <ReportButton listingId={listing.id} lang={lang} isLoggedIn={!!user} />}
            </div>
          </div>

          {listing.description && (
            <section className="rounded-2xl border border-glass-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-extrabold tracking-wide uppercase">
                {t('detail_description_title', lang)}
              </h2>
              <p className="leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </section>
          )}

          {isVehicle && <VehicleFeatures features={listing.features} lang={lang} />}
          {isVehicle && <LoanCalculator price={Number(listing.price)} lang={lang} />}
        </div>

        <aside className="space-y-5">
          {isVehicle && <VehicleSpecTable listing={listing} lang={lang} />}

          <section className="rounded-2xl border border-glass-border bg-surface p-5 text-sm">
            <h2 className="mb-2 text-sm font-extrabold tracking-wide uppercase">
              {t('detail_contact_label', lang)}
            </h2>
            {user ? (
              <a href={`tel:${listing.phone}`} className="text-lg font-extrabold text-primary">
                {listing.phone}
              </a>
            ) : (
              <>
                <span className="text-muted">{t('phone_locked_message', lang)}</span>
                <br />
                <a href="/login" className="mt-1 inline-block font-bold text-primary underline">
                  {t('phone_locked_cta', lang)}
                </a>
              </>
            )}
          </section>

          {store && (
            <a
              href={`/store/${store.slug}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-glass-border bg-surface px-5 py-4 text-sm hover:border-primary/40"
            >
              <span className="flex min-w-0 items-center gap-3">
                {store.logo_url && (
                  <span className="flex h-10 w-[104px] shrink-0 items-center justify-center rounded-lg bg-white/5 px-2">
                    <img src={store.logo_url} alt={store.name} className="h-5 w-auto object-contain" />
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block font-bold">{store.name}</strong>
                  <span className="text-muted">{t('store_see_all', lang)}</span>
                </span>
              </span>
              <span className="text-lg text-primary">›</span>
            </a>
          )}

          {!isOwner && listing.owner_id && (
            <div className="rounded-2xl border border-glass-border bg-surface p-5">
              <MessageForm
                listingId={listing.id}
                receiverId={listing.owner_id}
                listingTitle={listing.title}
                lang={lang}
              />
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-extrabold">{t('related_title', lang)}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
