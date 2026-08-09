import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { createClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n';

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const lang = await getLang();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, content, cover_image, created_at, published')
    .eq('slug', slug)
    .single();

  if (!post || !post.published) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/blog" className="mb-4 inline-block text-sm text-muted hover:underline">
        ← {t('blog_back', lang)}
      </Link>

      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        {post.cover_image && <img src={post.cover_image} alt="" className="mb-4 h-56 w-full rounded-lg object-cover" />}
        <h1 className="mb-1 text-2xl font-extrabold">{post.title}</h1>
        <p className="mb-4 text-xs text-muted">{new Date(post.created_at).toISOString().slice(0, 10)}</p>
        <div className="whitespace-pre-wrap leading-relaxed">{post.content}</div>
      </div>
    </main>
  );
}
