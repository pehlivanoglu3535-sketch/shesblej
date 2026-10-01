import Link from 'next/link';
import Image from 'next/image';
import { categoryPhotoUri, listingHue } from '@/lib/photos';
import { daysRemaining, type Listing } from '@/lib/listings';
import { t, type LangCode } from '@/lib/i18n';
import CategoryIcon from '@/components/CategoryIcon';
import { isPartnerImage } from '@/lib/image-source';

export default function ListingCard({ listing, lang }: { listing: Listing; lang: LangCode }) {
  const hasPhoto = listing.photos && listing.photos.length > 0;
  const days = daysRemaining(listing.expires_at);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_4px_14px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(0,0,0,0.38)]"
    >
      <div className="relative h-[154px] overflow-hidden bg-[#1c1a12]">
        {hasPhoto ? (
          <Image
            src={listing.photos[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            unoptimized={isPartnerImage(listing.photos[0])}
            className="object-cover transition duration-300 group-hover:scale-[1.08]"
          />
        ) : (
          // Placeholders are inline SVG data URIs — nothing to fetch or optimize.
          <img
            src={categoryPhotoUri(listing.category)}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.08]"
            style={{ filter: `hue-rotate(${listingHue(listing.id)}deg) saturate(1.1)` }}
          />
        )}
        <span
          className={`absolute top-2.5 left-2.5 rounded-lg border border-glass-border px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${days <= 5 ? 'text-red-400 border-red-400/40' : 'text-[#d6d1c4]'}`}
          style={{ background: 'rgba(10,10,8,.72)' }}
        >
          ⏳ {days} {t('days_left_word', lang)}
        </span>
        {(listing.is_urgent || listing.is_highlighted) && (
          <span className="absolute bottom-2.5 right-2.5 flex gap-1.5">
            {listing.is_urgent && (
              <span className="rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {t('badge_urgent', lang)}
              </span>
            )}
            {listing.is_highlighted && (
              <span className="rounded-md bg-gradient-to-br from-primary to-primary-2 px-2 py-0.5 text-[10px] font-extrabold text-ink">
                {t('badge_highlighted', lang)}
              </span>
            )}
          </span>
        )}
        <span
          className="absolute top-2.5 right-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink shadow"
          style={{ background: 'rgba(253,210,2,.92)' }}
        >
          <CategoryIcon id={listing.category} />
        </span>
        <span
          className="absolute left-2.5 bottom-2.5 rounded-lg border border-primary/25 px-3 py-1.5 text-[14.5px] font-extrabold text-primary backdrop-blur-sm"
          style={{ background: 'rgba(10,10,8,.78)' }}
        >
          €{Number(listing.price).toLocaleString('tr-TR')}
        </span>
      </div>
      <div className="p-3.5">
        {/* Başlık tam iki satıra sabitleniyor. `min-h` tek satırlık başlıkları
            dengeliyordu ama uzun olanları sınırlamıyordu: kullanıcıların yazdığı
            üç satırlık başlık kartı uzatıp ızgaradaki komşularıyla hizasını
            bozuyor. Kırpmak, her kartın aynı yükseklikte kalmasını sağlıyor. */}
        <p className="mb-2 line-clamp-2 min-h-[34px] text-sm font-semibold">{listing.title}</p>
        <div className="flex justify-between text-xs text-muted">
          <span>{listing.city}</span>
          <span>{new Date(listing.created_at).toISOString().slice(0, 10)}</span>
        </div>
      </div>
    </Link>
  );
}
