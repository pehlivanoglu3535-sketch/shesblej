import { createClient } from '@/lib/supabase/server';
import type { PlanId } from '@/lib/constants';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  accountType: 'individual' | 'business';
  companyName: string | null;
  isAdmin: boolean;
  plan: PlanId;
  planExpiresAt: string | null;
  creditExtraListing: number;
  creditUrgentTag: number;
  creditExtraShowcase: number;
  creditHighlight: number;
};

/**
 * Resolves the logged-in user's profile, or null if signed out.
 * Wrapped defensively: a Supabase outage or missing env config should degrade
 * to "signed out" rather than crashing every page that reads the session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'name, account_type, company_name, is_admin, plan, plan_expires_at, credit_extra_listing, credit_urgent_tag, credit_extra_showcase, credit_highlight'
      )
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email ?? '',
      name: profile?.name ?? user.email ?? '',
      accountType: (profile?.account_type as 'individual' | 'business') ?? 'individual',
      companyName: profile?.company_name ?? null,
      isAdmin: profile?.is_admin ?? false,
      plan: (profile?.plan as PlanId) ?? 'standard',
      planExpiresAt: profile?.plan_expires_at ?? null,
      creditExtraListing: profile?.credit_extra_listing ?? 0,
      creditUrgentTag: profile?.credit_urgent_tag ?? 0,
      creditExtraShowcase: profile?.credit_extra_showcase ?? 0,
      creditHighlight: profile?.credit_highlight ?? 0,
    };
  } catch (err) {
    console.error('getCurrentUser failed:', err);
    return null;
  }
}
