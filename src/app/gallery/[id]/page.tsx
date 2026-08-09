import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { createClient } from '@/lib/supabase/server';
import { getListings } from '@/lib/listings';
import { t } from '@/lib/i18n';
import ListingCard from '@/components/ListingCard';

export default async function BusinessGalleryPage({ params }: PageProps<'/gallery/[id]'>) {
  const { id } = await params;
  const lang = await getLang();
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('profiles_public')
    .select('id, name, company_name, company_logo_url, account_type')
    .eq('id', id)
    .single();

  if (!business || business.account_type !== 'business') notFound();

  const listings = await getListings({ ownerId: id });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        {business.company_logo_url ? (
          <img src={business.company_logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-xl font-bold">
            {(business.company_name || business.name).slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="text-2xl font-extrabold">{business.company_name || business.name}</h1>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('empty_results', lang)}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} lang={lang} />
          ))}
        </div>
      )}
    </main>
  );
}
