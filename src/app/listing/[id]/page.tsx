import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getListingById, daysRemaining } from '@/lib/listings';
import { getCurrentUser } from '@/lib/get-user';
import { CATEGORIES } from '@/lib/constants';
import { categoryPhotoUri, listingHue } from '@/lib/photos';
import { t, catName, subName } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import DeleteButton from './DeleteButton';
import MessageForm from './MessageForm';
import ReportButton from './ReportButton';
import FavoriteButton from '@/components/FavoriteButton';

export default async function ListingDetailPage({ params }: PageProps<'/listing/[id]'>) {
  const { id } = await params;
  const lang = await getLang();
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const isOwner = user && listing.owner_id === user.id;
  const icon = CATEGORIES.find((c) => c.id === listing.category)?.icon ?? '📦';
  const hasPhoto = listing.photos && listing.photos.length > 0;
  const mainPhoto = hasPhoto ? listing.photos[0] : categoryPhotoUri(listing.category);
  const days = daysRemaining(listing.expires_at);

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
        <div className="relative h-[240px] overflow-hidden rounded-lg">
          <img
            src={mainPhoto}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: hasPhoto ? 'none' : `hue-rotate(${listingHue(listing.id)}deg) saturate(1.1)` }}
          />
          <span
            className="absolute top-2.5 right-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,.9)' }}
          >
            {icon}
          </span>
        </div>

        {hasPhoto && listing.photos.length > 1 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto">
            {listing.photos.map((p, i) => (
              <img key={i} src={p} className="h-14 w-14 flex-shrink-0 rounded-md object-cover" alt="" />
            ))}
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
          {ownerBusiness && (
            <span className="inline-block rounded-full bg-[#3f6fb0] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
              🏢 {ownerBusiness.companyName || t('badge_business_account', lang)}
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
          {t('detail_phone_label', lang)}: {listing.phone}
        </div>

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
