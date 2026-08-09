'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LANGUAGES, type LangCode } from '@/lib/i18n';
import { LANG_COOKIE } from '@/lib/get-lang';

export async function setLanguageAction(lang: LangCode) {
  if (!LANGUAGES.some((l) => l.code === lang)) return;
  const cookieStore = await cookies();
  cookieStore.set(LANG_COOKIE, lang, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/');
}
