import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';
import CountUp from './CountUp';

/**
 * Ana sayfa sayaçları.
 *
 * Üç sayı da tek bir veritabanı fonksiyonundan geliyor (migration_017).
 * Daha önce üç ayrı sorgu vardı ve kullanıcı sayısı hep 0 dönüyordu:
 * `profiles` okuması kendi satırına kısıtlı, yani oturum açmamış
 * ziyaretçinin saydırabileceği profil yok. Sayı 11'ken 0 görünüyordu ve
 * "0 kullanıcı" yazan bir pazar yeri boş görünür.
 *
 * Fonksiyon yalnız üç toplam döndürüyor, hiçbir satır içeriği dışarı
 * çıkmıyor.
 */
export default async function StatsBar({ lang }: { lang: LangCode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('public_stats').maybeSingle<{
    listings: number;
    users: number;
    cities: number;
  }>();

  if (error) console.error('StatsBar:', error.message);

  // Sayılar okunamazsa şerit hiç basılmıyor. Sıfırlarla dolu bir sayaç,
  // olmayan sayaçtan kötü.
  if (!data || !data.listings) return null;

  const stats = [
    { value: data.listings, label: t('stats_active_listings', lang) },
    { value: data.users, label: t('stats_active_users', lang) },
    { value: data.cities, label: t('stats_cities_covered', lang) },
  ];

  return (
    <div className="mb-9 grid grid-cols-3 gap-3 rounded-2xl border border-glass-border bg-surface p-5 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-2xl font-extrabold text-primary sm:text-3xl">
            <CountUp to={s.value} />
          </div>
          <div className="mt-1 text-xs text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
