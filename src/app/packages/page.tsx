import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import PackagesClient from './PackagesClient';

export default async function PackagesPage() {
  const lang = await getLang();
  const user = await getCurrentUser();

  return <PackagesClient lang={lang} user={user} />;
}
