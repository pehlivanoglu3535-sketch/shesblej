import { redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import NewPostForm from './NewPostForm';

export default async function NewBlogPostPage() {
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isAdmin) redirect('/');

  return <NewPostForm lang={lang} />;
}
