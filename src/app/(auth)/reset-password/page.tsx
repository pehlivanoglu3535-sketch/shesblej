import { getLang } from '@/lib/get-lang';
import ResetPasswordForm from './ResetPasswordForm';

export default async function Page() {
  const lang = await getLang();
  return <ResetPasswordForm lang={lang} />;
}
