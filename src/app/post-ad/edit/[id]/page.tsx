import { notFound, redirect } from 'next/navigation';
import { getLang } from '@/lib/get-lang';
import { getCurrentUser } from '@/lib/get-user';
import { getListingById } from '@/lib/listings';
import PostAdForm from '../../PostAdForm';

export default async function EditAdPage({ params }: PageProps<'/post-ad/edit/[id]'>) {
  const { id } = await params;
  const lang = await getLang();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const listing = await getListingById(id);
  if (!listing) notFound();
  if (listing.owner_id !== user.id) redirect('/my-listings');

  return <PostAdForm lang={lang} listing={listing} user={user} />;
}
