import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';

export default async function StatsBar({ lang }: { lang: LangCode }) {
  const supabase = await createClient();

  const [{ count: listingCount }, { count: userCount }, { data: cityRows }] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('city').gt('expires_at', new Date().toISOString()),
  ]);

  const cityCount = new Set((cityRows ?? []).map((r) => r.city)).size;

  const stats = [
    { value: listingCount ?? 0, label: t('stats_active_listings', lang) },
    { value: userCount ?? 0, label: t('stats_active_users', lang) },
    { value: cityCount, label: t('stats_cities_covered', lang) },
  ];

  return (
    <div className="mb-9 grid grid-cols-3 gap-3 rounded-2xl border border-glass-border bg-surface p-5 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</div>
          <div className="mt-1 text-xs text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
