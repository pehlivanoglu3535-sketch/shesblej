import { getLang } from '@/lib/get-lang';
import { createClient } from '@/lib/supabase/server';
import GalleryClient, { type BusinessRow } from './GalleryClient';
import { getStoresWithCounts } from '@/lib/stores';
import Link from 'next/link';
import { t } from '@/lib/i18n';

export default async function GalleryPage() {
  const lang = await getLang();
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from('profiles_public')
    .select('id, name, company_name, company_logo_url')
    .eq('account_type', 'business');

  const businessIds = (businesses ?? []).map((b) => b.id);

  const { data: listingRows } = businessIds.length
    ? await supabase.from('listings').select('owner_id, category').in('owner_id', businessIds).gt('expires_at', new Date().toISOString())
    : { data: [] as { owner_id: string | null; category: string }[] };

  const vehicleCounts = new Map<string, number>();
  const realEstateCounts = new Map<string, number>();
  for (const row of listingRows ?? []) {
    if (!row.owner_id) continue;
    if (row.category === 'vasita') vehicleCounts.set(row.owner_id, (vehicleCounts.get(row.owner_id) ?? 0) + 1);
    if (row.category === 'emlak') realEstateCounts.set(row.owner_id, (realEstateCounts.get(row.owner_id) ?? 0) + 1);
  }

  const vehicleDealers: BusinessRow[] = (businesses ?? [])
    .filter((b) => (vehicleCounts.get(b.id) ?? 0) > 0)
    .map((b) => ({ ...b, listingCount: vehicleCounts.get(b.id) ?? 0 }));

  const realEstateCompanies: BusinessRow[] = (businesses ?? [])
    .filter((b) => (realEstateCounts.get(b.id) ?? 0) > 0)
    .map((b) => ({ ...b, listingCount: realEstateCounts.get(b.id) ?? 0 }));

  // Partner mağazaları da bu sayfada listeleniyor. Onlar profil değil ayrı bir
  // kayıt (migration_010), o yüzden ayrı bir bölüm olarak geçiyor — kaydolmuş
  // bir işletme ile içe aktardığımız partner envanteri aynı şey değil.
  const stores = await getStoresWithCounts();

  return (
    <>
      {stores.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pt-10">
          <h2 className="mb-4 text-lg font-extrabold">{t('stores_title', lang)}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/store/${s.slug}`}
                className="flex items-center gap-3 rounded-xl border border-glass-border bg-surface p-4 hover:border-primary/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-2 text-lg font-extrabold text-ink">
                  {s.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{s.name}</span>
                  <span className="block text-xs text-muted">
                    {s.listingCount} {t('listing_count_suffix', lang)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <GalleryClient lang={lang} vehicleDealers={vehicleDealers} realEstateCompanies={realEstateCompanies} />
    </>
  );
}
