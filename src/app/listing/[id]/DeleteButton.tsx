'use client';

import { deleteListingAction } from '../../post-ad/actions';
import { t, type LangCode } from '@/lib/i18n';

export default function DeleteButton({ listingId, lang }: { listingId: string; lang: LangCode }) {
  return (
    <button
      onClick={() => {
        if (confirm(t('confirm_delete_listing', lang))) {
          deleteListingAction(listingId);
        }
      }}
      className="rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/25"
    >
      {t('btn_delete', lang)}
    </button>
  );
}
