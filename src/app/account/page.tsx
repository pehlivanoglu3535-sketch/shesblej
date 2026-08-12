import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';

export default async function AccountPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const [{ count: listingsCount }, { count: favoritesCount }, { data: messageRows }] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('favorites').select('listing_id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('messages')
      .select('listing_id, sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
  ]);

  const conversations = new Set(
    (messageRows ?? []).map((row) => {
      const otherId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
      return `${row.listing_id}:${otherId}`;
    })
  );

  const cards = [
    { href: '/my-listings', label: t('nav_my_listings', lang), count: listingsCount ?? 0 },
    { href: '/favorites', label: t('nav_my_favorites', lang), count: favoritesCount ?? 0 },
    { href: '/messages', label: t('nav_my_messages', lang), count: conversations.size },
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('account_title', lang)}</h1>

      <div className="mb-6 rounded-2xl border border-glass-border bg-surface p-5">
        <p className="text-lg font-bold">{user.name}</p>
        <p className="mt-1 text-sm text-muted">
          {t('account_email_label', lang)}: {user.email}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t('account_type_label', lang)}:{' '}
          {user.accountType === 'business'
            ? user.companyName || t('badge_business_account', lang)
            : t('account_type_individual', lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-glass-border bg-surface p-5 text-center hover:bg-white/6"
          >
            <div className="text-3xl font-extrabold text-primary">{c.count}</div>
            <div className="mt-1 text-sm font-semibold text-[#cbc6ba]">{c.label}</div>
            <div className="mt-2 text-xs text-muted">{t('account_view_all', lang)} →</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
