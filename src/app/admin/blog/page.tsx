import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';
import DeletePostButton from './DeletePostButton';

export default async function AdminBlogPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) redirect('/');

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, published, created_at')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t('blog_title', lang)}</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-extrabold text-ink"
        >
          + {t('nav_blog', lang)}
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('blog_empty', lang)}
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-surface p-3.5">
              <div>
                <Link href={`/blog/${post.slug}`} className="font-semibold hover:underline">
                  {post.title}
                </Link>
                <p className="text-xs text-muted">{new Date(post.created_at).toISOString().slice(0, 10)}</p>
              </div>
              <DeletePostButton id={post.id} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
