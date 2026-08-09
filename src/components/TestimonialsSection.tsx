import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/get-user';
import { t, type LangCode } from '@/lib/i18n';
import ReviewForm from './ReviewForm';

export default async function TestimonialsSection({ lang }: { lang: LangCode }) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('id, rating, text, user_id')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(9);

  const userIds = Array.from(new Set((testimonials ?? []).map((tr) => tr.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles_public').select('id, name').in('id', userIds)
    : { data: [] as { id: string; name: string }[] };
  const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <section className="mb-9">
      <h2 className="mb-4 text-xl font-extrabold">{t('testimonials_title', lang)}</h2>

      {!testimonials || testimonials.length === 0 ? (
        <p className="mb-4 rounded-2xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('testimonials_empty', lang)}
        </p>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((tst) => (
            <div key={tst.id} className="rounded-2xl border border-glass-border bg-surface p-4">
              <div className="mb-1.5 text-primary">{'★'.repeat(tst.rating)}{'☆'.repeat(5 - tst.rating)}</div>
              <p className="mb-2 text-sm text-[#cbc6ba]">{tst.text}</p>
              <p className="text-xs font-bold">{names[tst.user_id] ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {user && <ReviewForm lang={lang} />}
    </section>
  );
}
