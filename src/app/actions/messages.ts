'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';

export async function markMessagesReadAction(listingId: string, otherId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('listing_id', listingId)
    .eq('sender_id', otherId)
    .eq('receiver_id', user.id)
    .is('read_at', null);
}

export type MessageState = { error: string | null; sent?: boolean };

const MESSAGE_RATE_LIMIT_SECONDS = 15;

export async function sendMessageAction(
  lang: LangCode,
  listingId: string,
  receiverId: string,
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const text = String(formData.get('text') || '').trim();
  if (!text) return { error: t('toast_msg_empty', lang) };
  if (text.length > 2000) return { error: t('error_generic', lang) };

  const { data: recent } = await supabase
    .from('messages')
    .select('created_at')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (elapsed < MESSAGE_RATE_LIMIT_SECONDS) return { error: t('error_generic', lang) };
  }

  const { error } = await supabase.from('messages').insert({
    listing_id: listingId,
    sender_id: user.id,
    receiver_id: receiverId,
    text,
  });

  if (error) {
    console.error('sendMessageAction failed:', error.message);
    return { error: t('error_generic', lang) };
  }

  revalidatePath(`/messages/${listingId}/${receiverId}`);
  revalidatePath('/messages');
  return { error: null, sent: true };
}
