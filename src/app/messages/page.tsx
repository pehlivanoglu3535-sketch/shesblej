import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';

type Row = {
  listing_id: string;
  sender_id: string;
  receiver_id: string | null;
  text: string;
  created_at: string;
  read_at: string | null;
};

export default async function MessagesInboxPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select('listing_id, sender_id, receiver_id, text, created_at, read_at')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as Row[];

  const conversations = new Map<
    string,
    { listingId: string; otherId: string; text: string; createdAt: string; unread: boolean }
  >();
  for (const row of rows) {
    const otherId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
    if (!otherId) continue;
    const key = `${row.listing_id}:${otherId}`;
    const unread = row.receiver_id === user.id && row.read_at === null;
    const existing = conversations.get(key);
    if (!existing) {
      conversations.set(key, { listingId: row.listing_id, otherId, text: row.text, createdAt: row.created_at, unread });
    } else if (unread) {
      existing.unread = true;
    }
  }

  const list = Array.from(conversations.values());
  const listingIds = Array.from(new Set(list.map((c) => c.listingId)));
  const otherIds = Array.from(new Set(list.map((c) => c.otherId)));

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    listingIds.length
      ? supabase.from('listings').select('id, title').in('id', listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    otherIds.length
      ? supabase.from('profiles_public').select('id, name').in('id', otherIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const listingTitles = new Map((listings ?? []).map((l) => [l.id, l.title]));
  const profileNames = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('nav_my_messages', lang)}</h1>

      {list.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('my_messages_empty', lang)}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <Link
              key={`${c.listingId}:${c.otherId}`}
              href={`/messages/${c.listingId}/${c.otherId}`}
              className={`block rounded-xl border p-3.5 hover:bg-white/6 ${
                c.unread ? 'border-primary/40 bg-primary/5' : 'border-glass-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-1.5">
                  {c.unread && <span className="h-2 w-2 rounded-full bg-red-500" />}
                  {profileNames.get(c.otherId) ?? '—'}
                </span>
                <span className="text-xs font-normal text-muted">{new Date(c.createdAt).toISOString().slice(0, 10)}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">{listingTitles.get(c.listingId) ?? ''}</div>
              <p className={`mt-1 truncate text-sm ${c.unread ? 'font-semibold text-white' : 'text-[#cbc6ba]'}`}>{c.text}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
