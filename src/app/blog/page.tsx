import Link from 'next/link';
import { getLang } from '@/lib/get-lang';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';

export default async function BlogListPage() {
  const lang = await getLang();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('blog_title', lang)}</h1>

      {!posts || posts.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('blog_empty', lang)}
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block overflow-hidden rounded-2xl border border-glass-border bg-surface p-5 hover:bg-white/6"
            >
              {post.cover_image && (
                <img src={post.cover_image} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />
              )}
              <h2 className="text-lg font-bold">{post.title}</h2>
              {post.excerpt && <p className="mt-1 text-sm text-muted">{post.excerpt}</p>}
              <p className="mt-2 text-xs text-muted">{new Date(post.created_at).toISOString().slice(0, 10)}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
