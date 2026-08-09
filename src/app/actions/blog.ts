'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type BlogPostState = { error: string | null };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export async function createBlogPostAction(_prev: BlogPostState, formData: FormData): Promise<BlogPostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_logged_in' };

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return { error: 'not_admin' };

  const title = String(formData.get('title') || '').trim().slice(0, 200);
  const excerpt = String(formData.get('excerpt') || '').trim().slice(0, 300);
  const content = String(formData.get('content') || '').trim().slice(0, 20000);
  const coverImage = String(formData.get('coverImage') || '').trim().slice(0, 500);

  if (!title || !content) return { error: 'missing_fields' };

  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { error } = await supabase.from('blog_posts').insert({
    slug,
    title,
    excerpt: excerpt || null,
    content,
    cover_image: coverImage || null,
    author_id: user.id,
  });

  if (error) {
    console.error('createBlogPostAction failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/blog');
  redirect(`/blog/${slug}`);
}

export async function deleteBlogPostAction(id: string) {
  const supabase = await createClient();
  await supabase.from('blog_posts').delete().eq('id', id);
  revalidatePath('/blog');
  redirect('/admin/blog');
}
