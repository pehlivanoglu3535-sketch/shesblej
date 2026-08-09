'use client';

import { useActionState, useState } from 'react';
import { submitTestimonialAction, type TestimonialState } from '@/app/actions/testimonials';
import { t, type LangCode } from '@/lib/i18n';

export default function ReviewForm({ lang }: { lang: LangCode }) {
  const boundAction = submitTestimonialAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<TestimonialState, FormData>(boundAction, { error: null });
  const [rating, setRating] = useState(5);
  const [open, setOpen] = useState(false);

  if (state.submitted) {
    return <p className="text-sm text-green-400">{t('toast_review_submitted', lang)}</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold hover:bg-white/12"
      >
        {t('btn_leave_review', lang)}
      </button>
    );
  }

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-3 rounded-2xl border border-glass-border bg-surface p-5 text-left">
      <input type="hidden" name="rating" value={rating} />
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#cbc6ba]">{t('label_rating', lang)}</label>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? 'text-primary' : 'text-white/20'}>
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#cbc6ba]">{t('label_your_review', lang)}</label>
        <textarea name="text" required className="min-h-[80px] w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-60"
      >
        {t('btn_leave_review', lang)}
      </button>
    </form>
  );
}
