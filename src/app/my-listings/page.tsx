import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { getListings, daysRemaining } from '@/lib/listings';
import { categoryPhotoUri, listingHue } from '@/lib/photos';
import { t } from '@/lib/i18n';
import DeleteButton from '../listing/[id]/DeleteButton';
import CategoryIcon from '@/components/CategoryIcon';

export default async function MyListingsPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const listings = await getListings({ ownerId: user.id, includeExpired: true });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('nav_my_listings', lang)}</h1>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('my_listings_empty', lang)}
        </p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const hasPhoto = listing.photos && listing.photos.length > 0;
            const days = daysRemaining(listing.expires_at);
            const expired = days <= 0;
            return (
              <div
                key={listing.id}
                className="flex items-center gap-3.5 rounded-xl border border-glass-border bg-surface p-3.5"
              >
                <Link href={`/listing/${listing.id}`} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#1c1a12]">
                  {hasPhoto ? (
                    <Image src={listing.photos[0]} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <img
                      src={categoryPhotoUri(listing.category)}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ filter: `hue-rotate(${listingHue(listing.id)}deg) saturate(1.1)` }}
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="flex items-center gap-1.5 truncate text-sm font-semibold hover:underline"
                  >
                    <CategoryIcon id={listing.category} className="shrink-0 text-primary" />
                    <span className="truncate">{listing.title}</span>
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span className="font-bold text-primary">€{Number(listing.price).toLocaleString('tr-TR')}</span>
                    <span>·</span>
                    <span>{listing.city}</span>
                    <span>·</span>
                    <span className={expired ? 'text-red-400' : ''}>
                      {expired ? t('already_removed', lang) : `⏳ ${days} ${t('days_left_word', lang)}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Link
                    href={`/post-ad/edit/${listing.id}`}
                    className="rounded-lg border border-glass-border bg-white/6 px-3 py-1.5 text-xs font-bold"
                  >
                    {t('btn_edit', lang)}
                  </Link>
                  <DeleteButton listingId={listing.id} lang={lang} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
