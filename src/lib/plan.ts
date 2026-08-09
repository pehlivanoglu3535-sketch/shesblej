import { PLANS, type PlanId } from '@/lib/constants';

export type PlanProfile = {
  plan: PlanId;
  planExpiresAt: string | null;
  creditExtraListing: number;
  creditExtraShowcase: number;
};

/** Paid plans (premium/enterprise) expire after PLAN_DURATION_DAYS; standard never expires. */
export function effectivePlan(profile: PlanProfile): PlanId {
  if (profile.plan === 'standard') return 'standard';
  if (profile.planExpiresAt && new Date(profile.planExpiresAt).getTime() < Date.now()) return 'standard';
  return profile.plan;
}

export function listingLimit(profile: PlanProfile): number {
  return PLANS[effectivePlan(profile)].listingLimit + profile.creditExtraListing;
}

export function showcaseLimit(profile: PlanProfile): number {
  return PLANS[effectivePlan(profile)].showcaseLimit + profile.creditExtraShowcase;
}
