'use client';

import { useState, useTransition } from 'react';
import { republishListingAction } from '../actions/republish';
import { t, type LangCode } from '@/lib/i18n';

/**
 * Süresi dolmuş ilanı yeniden yayına alma düğmesi.
 *
 * Hata mesajı düğmenin yanında gösteriliyor: en olası hata "ilan hakkın dolu"
 * ve bunu sessizce yutmak, kullanıcıya düğmenin bozuk olduğunu düşündürür.
 */
export default function RepublishButton({
  listingId,
  lang,
}: {
  listingId: string;
  lang: LangCode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await republishListingAction(lang, listingId);
            if (res.error) setError(res.error);
          })
        }
        className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/25 disabled:opacity-50"
      >
        {t('btn_republish', lang)}
      </button>
      {error && <span className="text-right text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
