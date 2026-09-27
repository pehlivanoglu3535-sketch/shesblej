'use server';

import { revalidatePath } from 'next/cache';
import { LISTING_EXPIRY_DAYS } from '@/lib/constants';
import { t, type LangCode } from '@/lib/i18n';
import { listingLimit, type PlanProfile } from '@/lib/plan';
import { createClient } from '@/lib/supabase/server';

export type RepublishState = { error: string | null; ok?: boolean };

/**
 * Süresi dolmuş bir ilanı yeniden yayına alır.
 *
 * İlanlar LISTING_EXPIRY_DAYS gün sonra `expires_at` geçtiği için görünmez
 * oluyor; satır siliniyor değil. Yeniden yayınlamak, `expires_at`'i bugünden
 * itibaren yeniden hesaplamaktan ibaret — fotoğraflar, açıklama ve mesaj
 * geçmişi olduğu gibi kalıyor.
 *
 * `created_at` bilinçli olarak değiştirilmiyor: o alan ilanın gerçekten ne
 * zaman açıldığını söylüyor ve sıralama "en yeni" mantığını taşıyor. Yenilemeyi
 * yeni ilan gibi göstermek, listeyi sürekli yenileyen kullanıcılara haksız
 * öncelik verirdi.
 *
 * Limit kontrolü şart: ilan hakkı dolan biri, ilanlarının süresinin dolmasını
 * bekleyip hepsini yeniden yayınlayarak sınırı aşabilirdi. Bu yüzden yeniden
 * yayınlama da tıpkı yeni ilan gibi aktif ilan sayısına bakıyor.
 */
export async function republishListingAction(
  lang: LangCode,
  listingId: string,
): Promise<RepublishState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const { data: listing } = await supabase
    .from('listings')
    .select('id, owner_id, expires_at')
    .eq('id', listingId)
    .maybeSingle();

  if (!listing || listing.owner_id !== user.id) {
    return { error: t('error_generic', lang) };
  }

  // Hâlâ yayındaysa yapacak bir şey yok; düğme de gösterilmiyor ama istek
  // doğrudan gelebilir.
  if (new Date(listing.expires_at).getTime() > Date.now()) {
    return { error: null, ok: true };
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at, credit_extra_listing, credit_extra_showcase')
    .eq('id', user.id)
    .maybeSingle();

  const profile: PlanProfile = {
    plan: (profileRow?.plan as PlanProfile['plan']) ?? 'standard',
    planExpiresAt: profileRow?.plan_expires_at ?? null,
    creditExtraListing: profileRow?.credit_extra_listing ?? 0,
    creditExtraShowcase: profileRow?.credit_extra_showcase ?? 0,
  };

  const { count: activeCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .gt('expires_at', new Date().toISOString());

  if ((activeCount ?? 0) >= listingLimit(profile)) {
    return { error: t('toast_listing_limit_reached', lang) };
  }

  const next = new Date(Date.now() + LISTING_EXPIRY_DAYS * 86400000).toISOString();
  const { error } = await supabase
    .from('listings')
    .update({ expires_at: next })
    .eq('id', listingId)
    .eq('owner_id', user.id);

  if (error) {
    console.error('republishListingAction:', error.message);
    return { error: t('error_generic', lang) };
  }

  revalidatePath('/my-listings');
  revalidatePath(`/listing/${listingId}`);
  revalidatePath('/');
  return { error: null, ok: true };
}
