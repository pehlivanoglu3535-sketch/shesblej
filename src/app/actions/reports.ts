'use server';

import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';

export type ReportState = { error: string | null; submitted?: boolean };

const VALID_REASONS = ['fraud', 'misleading', 'inappropriate', 'other'];

export async function submitReportAction(
  lang: LangCode,
  listingId: string,
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const reason = String(formData.get('reason') || '');
  const details = String(formData.get('details') || '').trim();
  if (!VALID_REASONS.includes(reason)) return { error: t('error_generic', lang) };

  const { data: recent } = await supabase
    .from('reports')
    .select('created_at')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (elapsed < 30) return { error: t('error_generic', lang) };
  }

  const { error } = await supabase.from('reports').insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason,
    details: details || null,
  });

  if (error) {
    console.error('submitReportAction failed:', error.message);
    return { error: t('error_generic', lang) };
  }

  return { error: null, submitted: true };
}
