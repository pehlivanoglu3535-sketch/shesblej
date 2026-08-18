'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { registerAction, type AuthState } from '../actions';
import { t, type LangCode } from '@/lib/i18n';

export default function RegisterForm({ lang }: { lang: LangCode }) {
  const [accountType, setAccountType] = useState<'individual' | 'business'>('individual');
  const boundAction = registerAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(boundAction, {
    error: null,
  });

  if (state.success) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="rounded-2xl border border-glass-border bg-surface p-8">
          <p className="text-lg font-bold text-primary">{t('toast_check_email_confirm', lang)}</p>
          <Link href="/login" className="mt-6 inline-block text-sm text-muted underline">
            {t('back_to_login', lang)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{t('register_title', lang)}</h1>
        {state.error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <Field label={t('label_fullname', lang)} name="name" required />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">
              {t('label_account_type', lang)}
            </label>
            <select
              name="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'individual' | 'business')}
              className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
            >
              <option value="individual" className="text-black">{t('option_individual', lang)}</option>
              <option value="business" className="text-black">{t('option_business', lang)}</option>
            </select>
          </div>

          {accountType === 'business' && (
            <Field label={t('label_company_name', lang)} name="companyName" required />
          )}

          <Field label={t('label_email', lang)} name="email" type="email" required />
          <Field label={t('label_phone_optional', lang)} name="phone" />


          <div className="grid grid-cols-2 gap-3">
            <Field label={t('label_password', lang)} name="password" type="password" required />
            <Field
              label={t('label_password_confirm', lang)}
              name="passwordConfirm"
              type="password"
              required
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" name="consent" className="mt-0.5" />
            {t('label_consent', lang)}
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-2 py-3 font-extrabold text-ink disabled:opacity-60"
          >
            {t('btn_register', lang)}
          </button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-xs text-muted underline">
          {t('switch_to_login', lang)}
        </Link>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm text-text placeholder:text-[#5c6779] focus:border-primary focus:outline-none"
      />
    </div>
  );
}
