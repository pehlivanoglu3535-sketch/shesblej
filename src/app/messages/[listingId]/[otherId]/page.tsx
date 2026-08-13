import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';
import MessageForm from '@/app/listing/[id]/MessageForm';
import { markMessagesReadAction } from '@/app/actions/messages';

export default async function MessageThreadPage({ params }: PageProps<'/messages/[listingId]/[otherId]'>) {
  const { listingId, otherId } = await params;
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const { data: listing } = await supabase.from('listings').select('id, title').eq('id', listingId).single();
  if (!listing) notFound();

  const { data: otherProfile } = await supabase.from('profiles_public').select('name').eq('id', otherId).single();

  await markMessagesReadAction(listingId, otherId);

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, text, created_at')
    .eq('listing_id', listingId)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/messages" className="mb-4 inline-block text-sm text-muted hover:underline">
        ← {t('nav_my_messages', lang)}
      </Link>

      <div className="rounded-2xl border border-glass-border bg-surface p-5">
        <div className="mb-4 border-b border-glass-border pb-3">
          <div className="text-sm font-bold">{otherProfile?.name ?? '—'}</div>
          <Link href={`/listing/${listing.id}`} className="text-xs text-muted hover:underline">
            {listing.title}
          </Link>
        </div>

        {!messages || messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('msg_empty_thread', lang)}</p>
        ) : (
          <div className="mb-4 space-y-2.5">
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm ${
                      mine ? 'bg-gradient-to-br from-primary to-primary-2 text-ink' : 'border border-glass-border bg-white/6'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-ink/70' : 'text-muted'}`}>
                      {new Date(m.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MessageForm listingId={listing.id} receiverId={otherId} listingTitle={listing.title} lang={lang} />
      </div>
    </main>
  );
}
