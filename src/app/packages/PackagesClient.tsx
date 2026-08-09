'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { purchasePlanAction, purchaseCreditAction } from '@/app/actions/packages';
import { PLANS, CREDIT_PRICES_EUR, type PlanId, type CreditType } from '@/lib/constants';
import { t, type LangCode } from '@/lib/i18n';
import type { CurrentUser } from '@/lib/get-user';
import { effectivePlan } from '@/lib/plan';

const PLAN_ORDER: PlanId[] = ['standard', 'premium', 'enterprise'];
const PLAN_NAME_KEY: Record<PlanId, Parameters<typeof t>[0]> = {
  standard: 'plan_standard_name',
  premium: 'plan_premium_name',
  enterprise: 'plan_enterprise_name',
};

const CREDIT_ORDER: CreditType[] = ['extra_listing', 'urgent_tag', 'extra_showcase', 'highlight'];
const CREDIT_NAME_KEY: Record<CreditType, Parameters<typeof t>[0]> = {
  extra_listing: 'credit_extra_listing_name',
  urgent_tag: 'credit_urgent_tag_name',
  extra_showcase: 'credit_extra_showcase_name',
  highlight: 'credit_highlight_name',
};
const CREDIT_COLUMN: Record<CreditType, keyof CurrentUser> = {
  extra_listing: 'creditExtraListing',
  urgent_tag: 'creditUrgentTag',
  extra_showcase: 'creditExtraShowcase',
  highlight: 'creditHighlight',
};

export default function PackagesClient({ lang, user }: { lang: LangCode; user: CurrentUser | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<CreditType, number>>({
    extra_listing: 1,
    urgent_tag: 1,
    extra_showcase: 1,
    highlight: 1,
  });

  const currentPlan = user ? effectivePlan(user) : null;

  function buyPlan(plan: PlanId) {
    if (!user) {
      router.push('/login');
      return;
    }
    setBusyKey(`plan-${plan}`);
    startTransition(async () => {
      const result = await purchasePlanAction(plan);
      setBusyKey(null);
      if (result.success) {
        setToast(t('toast_purchase_success', lang));
        router.refresh();
      }
    });
  }

  function buyCredit(creditType: CreditType) {
    if (!user) {
      router.push('/login');
      return;
    }
    setBusyKey(`credit-${creditType}`);
    startTransition(async () => {
      const result = await purchaseCreditAction(creditType, quantities[creditType]);
      setBusyKey(null);
      if (result.success) {
        setToast(t('toast_purchase_success', lang));
        router.refresh();
      }
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-extrabold">{t('packages_title', lang)}</h1>
      <p className="mb-8 text-sm text-muted">{t('packages_subtitle', lang)}</p>

      {toast && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
          {toast}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold">{t('packages_subscription_title', lang)}</h2>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((plan) => {
          const info = PLANS[plan];
          const isCurrent = currentPlan === plan;
          return (
            <div
              key={plan}
              className={`relative rounded-2xl border p-5 ${
                plan === 'premium' ? 'border-primary/50 bg-primary/5' : 'border-glass-border bg-surface'
              }`}
            >
              {plan === 'premium' && (
                <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-br from-primary to-primary-2 px-3 py-0.5 text-[10px] font-extrabold text-ink">
                  {t('plan_most_popular', lang)}
                </span>
              )}
              <h3 className="text-base font-bold">{t(PLAN_NAME_KEY[plan], lang)}</h3>
              {plan === 'standard' && <p className="mt-0.5 text-xs text-muted">{t('plan_default_badge', lang)}</p>}
              <div className="mt-3 text-3xl font-extrabold">
                {info.priceEur}€ <span className="text-sm font-normal text-muted">{t('plan_per_month', lang)}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-[#cbc6ba]">
                <p>
                  <strong className="text-white">{info.listingLimit}</strong> {t('plan_listings_suffix', lang)}
                </p>
                <p>
                  <strong className="text-white">{info.showcaseLimit}</strong> {t('plan_showcase_suffix', lang)}
                </p>
              </div>
              <button
                onClick={() => buyPlan(plan)}
                disabled={pending || isCurrent}
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60 ${
                  isCurrent
                    ? 'border border-glass-border bg-white/6'
                    : 'bg-gradient-to-br from-primary to-primary-2 text-ink'
                }`}
              >
                {isCurrent
                  ? t('btn_current_plan', lang)
                  : busyKey === `plan-${plan}`
                    ? '…'
                    : user
                      ? t('btn_buy', lang)
                      : t('btn_login_to_buy', lang)}
              </button>
            </div>
          );
        })}

        <div className="rounded-2xl border border-glass-border bg-surface p-5">
          <h3 className="text-base font-bold">{t('plan_custom_title', lang)}</h3>
          <p className="mt-0.5 text-xs text-muted">{t('plan_custom_subtitle', lang)}</p>
          <ul className="mt-4 space-y-1.5 text-sm text-[#cbc6ba]">
            <li>• {t('plan_custom_unlimited', lang)}</li>
            <li>• {t('plan_custom_priority', lang)}</li>
            <li>• {t('plan_custom_tailored', lang)}</li>
          </ul>
          <Link
            href="/help"
            className="mt-5 block w-full rounded-lg border border-glass-border bg-white/6 px-4 py-2.5 text-center text-sm font-bold"
          >
            {t('btn_contact_us', lang)}
          </Link>
        </div>
      </div>

      <h2 className="mb-1 text-lg font-bold">{t('packages_credits_title', lang)}</h2>
      <p className="mb-4 text-sm text-muted">{t('packages_credits_subtitle', lang)}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CREDIT_ORDER.map((creditType) => {
          const balance = user ? (user[CREDIT_COLUMN[creditType]] as number) : 0;
          return (
            <div key={creditType} className="rounded-2xl border border-glass-border bg-surface p-5">
              <h3 className="text-sm font-bold">{t(CREDIT_NAME_KEY[creditType], lang)}</h3>
              <div className="mt-2 text-2xl font-extrabold">{CREDIT_PRICES_EUR[creditType]}€</div>
              {user && (
                <p className="mt-1 text-xs text-muted">
                  {balance} {t('credits_available_suffix', lang)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quantities[creditType]}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [creditType]: Math.max(1, Math.min(50, Number(e.target.value) || 1)) }))
                  }
                  className="w-16 rounded-lg border border-glass-border bg-white/5 px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => buyCredit(creditType)}
                  disabled={pending}
                  className="flex-1 rounded-lg bg-gradient-to-br from-primary to-primary-2 px-3 py-1.5 text-sm font-bold text-ink disabled:opacity-60"
                >
                  {busyKey === `credit-${creditType}` ? '…' : user ? t('btn_buy', lang) : t('btn_login_to_buy', lang)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted">{t('packages_payment_note', lang)}</p>
    </main>
  );
}
