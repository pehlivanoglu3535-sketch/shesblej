'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';

export type TestimonialState = { error: string | null; submitted?: boolean };

export async function submitTestimonialAction(
  lang: LangCode,
  _prev: TestimonialState,
  formData: FormData
): Promise<TestimonialState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const rating = Number(formData.get('rating') || 0);
  const text = String(formData.get('text') || '').trim().slice(0, 1000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: t('error_generic', lang) };
  if (!text) return { error: t('toast_msg_empty', lang) };

  const { error } = await supabase.from('testimonials').insert({
    user_id: user.id,
    rating,
    text,
  });

  if (error) {
    console.error('submitTestimonialAction failed:', error.message);
    return { error: t('error_generic', lang) };
  }

  revalidatePath('/');
  return { error: null, submitted: true };
}

/** Moderasyon islemleri icin yonetici kontrolu. Veritabani tarafinda da
 *  `is_admin()` sarti var; bu, tek katmanda kalmamak icin. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return profile?.is_admin ? supabase : null;
}

export async function approveTestimonialAction(id: string, approved: boolean) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  await supabase.from('testimonials').update({ approved }).eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteTestimonialAction(id: string) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  await supabase.from('testimonials').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/');
}
