import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/lib/listings';

export default async function FavoritesPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data } = await supabase
    .from('favorites')
    .select('listing:listings(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const listings = ((data ?? []) as unknown as { listing: Listing | null }[])
    .map((row) => row.listing)
    .filter((l): l is Listing => l != null);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('nav_my_favorites', lang)}</h1>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('my_favorites_empty', lang)}
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
