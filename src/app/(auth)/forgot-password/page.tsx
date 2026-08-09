import { getLang } from '@/lib/get-lang';
import ForgotPasswordForm from './ForgotPasswordForm';

export default async function Page() {
  const lang = await getLang();
  return <ForgotPasswordForm lang={lang} />;
}
