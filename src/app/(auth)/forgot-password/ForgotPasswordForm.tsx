'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type AuthState } from '../actions';
import { t, type LangCode } from '@/lib/i18n';

export default function ForgotPasswordForm({ lang }: { lang: LangCode }) {
  const boundAction = forgotPasswordAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(boundAction, {
    error: null,
  });

  if (state.success) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="rounded-2xl border border-glass-border bg-surface p-8">
          <p className="text-lg font-bold text-primary">{t('toast_check_email_reset', lang)}</p>
          <Link href="/login" className="mt-6 inline-block text-sm text-muted underline">
            {t('back_to_login', lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-2 text-2xl font-extrabold">{t('switch_to_forgot', lang)}</h1>
        <p className="mb-5 text-xs text-muted">{t('forgot_note', lang)}</p>
        {state.error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">
              {t('label_email', lang)}
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-2 py-3 font-extrabold text-ink disabled:opacity-60"
          >
            {t('btn_reset_password', lang)}
          </button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-xs text-muted underline">
          {t('back_to_login', lang)}
        </Link>
      </div>
    </main>
  );
}
