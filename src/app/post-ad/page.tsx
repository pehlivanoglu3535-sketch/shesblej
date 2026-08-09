import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import PostAdForm from './PostAdForm';

export default async function Page() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <PostAdForm lang={lang} user={user} />;
}
