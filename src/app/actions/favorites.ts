'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFavoriteAction(listingId: string): Promise<{ favorited: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_logged_in' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
    revalidatePath('/favorites');
    return { favorited: false };
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
    revalidatePath('/favorites');
    return { favorited: true };
  }
}
