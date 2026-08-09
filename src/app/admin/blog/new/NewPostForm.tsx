'use client';

import { useActionState } from 'react';
import { createBlogPostAction, type BlogPostState } from '@/app/actions/blog';
import { t, type LangCode } from '@/lib/i18n';

export default function NewPostForm({ lang }: { lang: LangCode }) {
  const [state, formAction, pending] = useActionState<BlogPostState, FormData>(createBlogPostAction, { error: null });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{t('nav_blog', lang)}</h1>
        {state.error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">{t('label_post_title', lang)}</label>
            <input name="title" required className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">{t('label_cover_image', lang)}</label>
            <input name="coverImage" className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">{t('label_post_excerpt', lang)}</label>
            <input name="excerpt" className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">{t('label_post_content', lang)}</label>
            <textarea name="content" required className="min-h-[220px] w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm" />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-5 py-2 text-sm font-extrabold text-ink disabled:opacity-60"
          >
            {t('btn_publish_post', lang)}
          </button>
        </form>
      </div>
    </main>
  );
}
