'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';

export type AuthState = { error: string | null; success?: boolean };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function registerAction(
  lang: LangCode,
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get('name') || '').trim();
  const accountType = String(formData.get('accountType') || 'individual');
  const companyName = String(formData.get('companyName') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const phone = String(formData.get('phone') || '').trim();
  const idNumber = String(formData.get('idNumber') || '').trim();
  const birthDate = String(formData.get('birthDate') || '');
  const consent = formData.get('consent') === 'on';
  const password = String(formData.get('password') || '');
  const passwordConfirm = String(formData.get('passwordConfirm') || '');

  if (!name || !email || !idNumber || !birthDate || !password || !passwordConfirm) {
    return { error: t('toast_fill_required', lang) };
  }
  if (accountType === 'business' && !companyName) {
    return { error: t('toast_company_name_required', lang) };
  }
  if (!isValidEmail(email)) {
    return { error: t('toast_invalid_email', lang) };
  }
  if (password.length < 6) {
    return { error: t('toast_password_short', lang) };
  }
  if (password !== passwordConfirm) {
    return { error: t('toast_passwords_mismatch', lang) };
  }
  if (!consent) {
    return { error: t('toast_consent_required', lang) };
  }
  if (!isSupabaseConfigured()) return { error: t('error_generic', lang) };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/login`,
        data: {
          name,
          phone,
          id_number: idNumber,
          birth_date: birthDate,
          consent_given: true,
          account_type: accountType,
          company_name: accountType === 'business' ? companyName : null,
        },
      },
    });
    if (error) return { error: error.message };
    return { error: null, success: true };
  } catch (err) {
    console.error('registerAction failed:', err);
    return { error: t('error_generic', lang) };
  }
}

export async function loginAction(
  lang: LangCode,
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { error: t('toast_fill_required', lang) };
  if (!isValidEmail(email)) return { error: t('toast_invalid_email', lang) };
  if (!isSupabaseConfigured()) return { error: t('error_generic', lang) };

  let shouldRedirect = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: t('toast_wrong_password', lang) };
    shouldRedirect = true;
  } catch (err) {
    console.error('loginAction failed:', err);
    return { error: t('error_generic', lang) };
  }
  if (shouldRedirect) redirect('/');
  return { error: null };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('logoutAction failed:', err);
    }
  }
  redirect('/');
}

export async function forgotPasswordAction(
  lang: LangCode,
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) return { error: t('toast_invalid_email', lang) };
  if (!isSupabaseConfigured()) return { error: t('error_generic', lang) };

  try {
    const supabase = await createClient();
    // Intentionally ignore the error result (besides logging) so we never reveal
    // whether an email address is registered — same response either way.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    if (error) console.error('resetPasswordForEmail error:', error.message);
    return { error: null, success: true };
  } catch (err) {
    console.error('forgotPasswordAction failed:', err);
    return { error: t('error_generic', lang) };
  }
}

export async function resetPasswordAction(
  lang: LangCode,
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get('password') || '');
  const passwordConfirm = String(formData.get('passwordConfirm') || '');

  if (!password || !passwordConfirm) return { error: t('toast_fill_required', lang) };
  if (password.length < 6) return { error: t('toast_password_short', lang) };
  if (password !== passwordConfirm) return { error: t('toast_passwords_mismatch', lang) };
  if (!isSupabaseConfigured()) return { error: t('error_generic', lang) };

  let shouldRedirect = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: t('error_generic', lang) };
    shouldRedirect = true;
  } catch (err) {
    console.error('resetPasswordAction failed:', err);
    return { error: t('error_generic', lang) };
  }
  if (shouldRedirect) redirect('/login');
  return { error: null };
}
