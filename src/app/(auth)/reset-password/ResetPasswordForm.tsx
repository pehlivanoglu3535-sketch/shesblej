'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type AuthState } from '../actions';
import { t, type LangCode } from '@/lib/i18n';

export default function ResetPasswordForm({ lang }: { lang: LangCode }) {
  const boundAction = resetPasswordAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(boundAction, {
    error: null,
  });

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{t('btn_reset_password', lang)}</h1>
        {state.error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">
              {t('label_new_password', lang)}
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">
              {t('label_new_password_confirm', lang)}
            </label>
            <input
              name="passwordConfirm"
              type="password"
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
      </div>
    </main>
  );
}
