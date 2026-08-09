import { cookies } from 'next/headers';
import { DEFAULT_LANG, LANGUAGES, type LangCode } from '@/lib/i18n';

const LANG_COOKIE = 'kp_lang';

export async function getLang(): Promise<LangCode> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LANG_COOKIE)?.value;
  const found = LANGUAGES.find((l) => l.code === value);
  return found ? found.code : DEFAULT_LANG;
}

export { LANG_COOKIE };
