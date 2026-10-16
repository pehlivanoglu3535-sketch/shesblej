'use server';

import { revalidatePath } from 'next/cache';
import { t, type LangCode } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';

export type RepublishState = { error: string | null; ok?: boolean };

/**
 * Süresi dolmuş bir ilanı yeniden yayına alır.
 *
 * İlanlar 29 gün sonra `expires_at` geçtiği için görünmez oluyor; satır
 * siliniyor değil. Yeniden yayınlamak, `expires_at`'i bugünden itibaren
 * yeniden hesaplamaktan ibaret — fotoğraflar, açıklama ve mesaj geçmişi
 * olduğu gibi kalıyor.
 *
 * `created_at` bilinçli olarak değiştirilmiyor: o alan ilanın gerçekten ne
 * zaman açıldığını söylüyor ve sıralama "en yeni" mantığını taşıyor. Yenilemeyi
 * yeni ilan gibi göstermek, listeyi sürekli yenileyen kullanıcılara haksız
 * öncelik verirdi.
 *
 * Limit kontrolü şart: ilan hakkı dolan biri, ilanlarının süresinin dolmasını
 * bekleyip hepsini yeniden yayınlayarak sınırı aşabilirdi. Bu yüzden yeniden
 * yayınlama da tıpkı yeni ilan gibi aktif ilan sayısına bakıyor — ve bu
 * kontrol veritabanı fonksiyonunun içinde duruyor.
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

  // Sahiplik, plan sınırı ve `expires_at` yazımı veritabanındaki
  // republish_listing fonksiyonunda. `expires_at` artık kullanıcıya kapalı
  // bir sütun (migration_016): açık bırakılsaydı ilan sonsuza uzatılabilirdi.
  // Kontroller de oraya taşındı, çünkü fonksiyon PostgREST üzerinden
  // doğrudan çağrılabiliyor — yalnızca burada kontrol etmek yetmezdi.
  const { error } = await supabase.rpc('republish_listing', { p_listing_id: listingId });

  if (error) {
    if (error.message.includes('listing limit reached')) {
      return { error: t('toast_listing_limit_reached', lang) };
    }
    console.error('republishListingAction:', error.message);
    return { error: t('error_generic', lang) };
  }

  revalidatePath('/my-listings');
  revalidatePath(`/listing/${listingId}`);
  revalidatePath('/');
  return { error: null, ok: true };
}
