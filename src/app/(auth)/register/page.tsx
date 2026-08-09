import { getLang } from '@/lib/get-lang';
import RegisterForm from './RegisterForm';

export default async function Page() {
  const lang = await getLang();
  return <RegisterForm lang={lang} />;
}
