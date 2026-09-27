import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getListingById, daysRemaining } from '@/lib/listings';
import { getCurrentUser } from '@/lib/get-user';
import { categoryPhotoUri, listingHue } from '@/lib/photos';
import { t, catName, subName } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from './DeleteButton';
import PhotoGallery from './PhotoGallery';
import MessageForm from './MessageForm';
import ReportButton from './ReportButton';
import FavoriteButton from '@/components/FavoriteButton';
import CategoryIcon from '@/components/CategoryIcon';
import { getStoreById } from '@/lib/stores';

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

  const store = listing.store_id ? await getStoreById(listing.store_id) : null;

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
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
          {listing.brand && (
            <span className="inline-block rounded-full border border-glass-border px-2.5 py-0.5 text-[11px] font-extrabold text-[#cbc6ba]">
              {listing.brand}
            </span>
          )}
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

        <h1 className="mt-2 mb-1 text-xl font-bold">{listing.title}</h1>
        <div className="text-[28px] font-extrabold text-primary">€{Number(listing.price).toLocaleString('tr-TR')}</div>
        <div className="mb-3 text-sm text-muted">
          {listing.city}
          {listing.district ? ` · ${listing.district}` : ''} · {new Date(listing.created_at).toISOString().slice(0, 10)}
          {listing.map_lat != null ? ` · 📍 ${t('marked_on_map', lang)}` : ''}
        </div>
        <p className="mb-3.5 text-xs text-muted">
          ⏳ {days} {t('detail_expiry_suffix', lang)}
        </p>
        <p className="leading-relaxed whitespace-pre-wrap">{listing.description}</p>

        {isOwner ? (
          <div className="mt-3.5 flex gap-2">
            <a
              href={`/post-ad/edit/${listing.id}`}
              className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold"
            >
              {t('btn_edit', lang)}
            </a>
            <DeleteButton listingId={listing.id} lang={lang} />
          </div>
        ) : (
          <div className="mt-3.5">
            <FavoriteButton
              listingId={listing.id}
              initialFavorited={isFavorited}
              isLoggedIn={!!user}
              label={t('btn_favorite', lang)}
            />
          </div>
        )}

        <div className="mt-4 rounded-xl border border-glass-border bg-white/4 p-3.5 text-sm">
          <strong>{t('detail_contact_label', lang)}</strong>
          <br />
          {user ? (
            <>
              {t('detail_phone_label', lang)}: {listing.phone}
            </>
          ) : (
            <>
              <span className="text-muted">{t('phone_locked_message', lang)}</span>
              <br />
              <a href="/login" className="mt-1 inline-block font-bold text-primary underline">
                {t('phone_locked_cta', lang)}
              </a>
            </>
          )}
        </div>

        {store && (
          <a
            href={`/store/${store.slug}`}
            className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-glass-border bg-white/4 px-4 py-3 text-sm hover:border-primary/40 hover:bg-white/6"
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
          <MessageForm
            listingId={listing.id}
            receiverId={listing.owner_id}
            listingTitle={listing.title}
            lang={lang}
          />
        )}

        {!isOwner && (
          <div className="mt-3 text-right">
            <ReportButton listingId={listing.id} lang={lang} isLoggedIn={!!user} />
          </div>
        )}
      </div>
    </main>
  );
}
