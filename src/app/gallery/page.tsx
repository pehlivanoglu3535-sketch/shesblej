import { getLang } from '@/lib/get-lang';
import { createClient } from '@/lib/supabase/server';
import GalleryClient, { type BusinessRow } from './GalleryClient';

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

  return <GalleryClient lang={lang} vehicleDealers={vehicleDealers} realEstateCompanies={realEstateCompanies} />;
}
