import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import AdminTabs from './AdminTabs';

export default async function AdminPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) redirect('/');

  const supabase = await createClient();

  const [{ data: members }, { data: messages }, { data: reports }, { data: testimonials }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, phone, birth_date, consent_given, account_type, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('id, sender_id, listing_id, text, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('reports')
      .select('id, reporter_id, listing_id, reason, details, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('testimonials')
      .select('id, user_id, rating, text, approved, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const listingIds = Array.from(
    new Set([...(messages ?? []).map((m) => m.listing_id), ...(reports ?? []).map((r) => r.listing_id)])
  );
  const userIds = Array.from(
    new Set([
      ...(messages ?? []).map((m) => m.sender_id),
      ...(reports ?? []).map((r) => r.reporter_id),
      ...(testimonials ?? []).map((tr) => tr.user_id),
    ])
  );

  const [{ data: listingRows }, { data: userRows }] = await Promise.all([
    listingIds.length
      ? supabase.from('listings').select('id, title').in('id', listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    userIds.length
      ? supabase.from('profiles').select('id, name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const listingTitles = Object.fromEntries((listingRows ?? []).map((l) => [l.id, l.title]));
  const userNames = Object.fromEntries((userRows ?? []).map((u) => [u.id, u.name]));

  return (
    <AdminTabs
      lang={lang}
      members={members ?? []}
      messages={(messages ?? []).map((m) => ({
        ...m,
        senderName: userNames[m.sender_id] ?? '—',
        listingTitle: listingTitles[m.listing_id] ?? '—',
      }))}
      reports={(reports ?? []).map((r) => ({
        ...r,
        reporterName: userNames[r.reporter_id] ?? '—',
        listingTitle: listingTitles[r.listing_id] ?? '—',
      }))}
      testimonials={(testimonials ?? []).map((tr) => ({
        ...tr,
        userName: userNames[tr.user_id] ?? '—',
      }))}
    />
  );
}
