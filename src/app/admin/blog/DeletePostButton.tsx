'use client';

import { deleteBlogPostAction } from '@/app/actions/blog';
import { t, type LangCode } from '@/lib/i18n';

export default function DeletePostButton({ id, lang }: { id: string; lang: LangCode }) {
  return (
    <button
      onClick={() => {
        if (confirm(t('confirm_delete_listing', lang))) deleteBlogPostAction(id);
      }}
      className="rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400"
    >
      {t('btn_delete', lang)}
    </button>
  );
}
