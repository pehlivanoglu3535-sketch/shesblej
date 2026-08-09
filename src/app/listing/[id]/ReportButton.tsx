'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReportAction, type ReportState } from '@/app/actions/reports';
import { t, type LangCode } from '@/lib/i18n';

const REASONS = ['fraud', 'misleading', 'inappropriate', 'other'] as const;
const REASON_KEYS: Record<(typeof REASONS)[number], Parameters<typeof t>[0]> = {
  fraud: 'reason_fraud',
  misleading: 'reason_misleading',
  inappropriate: 'reason_inappropriate',
  other: 'reason_other',
};

export default function ReportButton({
  listingId,
  lang,
  isLoggedIn,
}: {
  listingId: string;
  lang: LangCode;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boundAction = submitReportAction.bind(null, lang, listingId);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(boundAction, { error: null });

  function onOpen() {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={onOpen} className="text-xs text-muted underline hover:text-red-400">
        {t('report_listing_link', lang)}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-glass-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-lg font-bold">{t('report_modal_title', lang)}</h2>
            {state.submitted ? (
              <p className="text-sm text-green-400">{t('toast_report_submitted', lang)}</p>
            ) : (
              <form action={formAction} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#cbc6ba]">{t('label_report_reason', lang)}</label>
                  <select name="reason" className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm">
                    {REASONS.map((r) => (
                      <option key={r} value={r} className="text-black">
                        {t(REASON_KEYS[r], lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#cbc6ba]">{t('label_report_details', lang)}</label>
                  <textarea name="details" className="min-h-[70px] w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm" />
                </div>
                {state.error && <p className="text-xs text-red-400">{state.error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold">
                    {t('btn_back', lang)}
                  </button>
                  <button type="submit" disabled={pending} className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-60">
                    {t('btn_submit_report', lang)}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
