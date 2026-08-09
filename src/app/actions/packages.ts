'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PLANS, PLAN_DURATION_DAYS, CREDIT_PRICES_EUR, type PlanId, type CreditType } from '@/lib/constants';

export type PackageActionState = { error: string | null; success?: boolean };

/**
 * Payments are SIMULATED — there is no real payment processor connected yet.
 * The purchase is recorded in `orders` with status='simulated' and applied
 * immediately, so the rest of the app (limits, badges) works end-to-end.
 */
export async function purchasePlanAction(plan: PlanId): Promise<PackageActionState> {
  if (plan === 'standard') return { error: null, success: true };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_logged_in' };

  const price = PLANS[plan].priceEur;
  const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 86400000).toISOString();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan, plan_expires_at: expiresAt })
    .eq('id', user.id);
  if (profileError) return { error: profileError.message };

  await supabase.from('orders').insert({
    user_id: user.id,
    kind: 'subscription',
    item: plan,
    quantity: 1,
    amount: price,
    status: 'simulated',
  });

  revalidatePath('/packages');
  return { error: null, success: true };
}

const CREDIT_COLUMN: Record<CreditType, string> = {
  extra_listing: 'credit_extra_listing',
  urgent_tag: 'credit_urgent_tag',
  extra_showcase: 'credit_extra_showcase',
  highlight: 'credit_highlight',
};

export async function purchaseCreditAction(creditType: CreditType, quantity: number): Promise<PackageActionState> {
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 50) return { error: 'invalid_quantity' };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_logged_in' };

  const column = CREDIT_COLUMN[creditType];
  const { data: profile } = await supabase.from('profiles').select(column).eq('id', user.id).single();
  if (!profile) return { error: 'profile_not_found' };

  const current = (profile as unknown as Record<string, number>)[column] ?? 0;
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ [column]: current + quantity })
    .eq('id', user.id);
  if (profileError) return { error: profileError.message };

  await supabase.from('orders').insert({
    user_id: user.id,
    kind: 'credit',
    item: creditType,
    quantity,
    amount: CREDIT_PRICES_EUR[creditType] * quantity,
    status: 'simulated',
  });

  revalidatePath('/packages');
  return { error: null, success: true };
}
