'use client';

import { useActionState, useState } from 'react';
import { sendMessageAction, type MessageState } from '@/app/actions/messages';
import { t, type LangCode } from '@/lib/i18n';

export default function MessageForm({
  listingId,
  receiverId,
  listingTitle,
  lang,
}: {
  listingId: string;
  receiverId: string;
  listingTitle: string;
  lang: LangCode;
}) {
  const boundAction = sendMessageAction.bind(null, lang, listingId, receiverId);
  const [state, formAction, pending] = useActionState<MessageState, FormData>(boundAction, { error: null });
  const [text, setText] = useState('');
  const [prevSent, setPrevSent] = useState(state.sent);
  if (state.sent !== prevSent) {
    setPrevSent(state.sent);
    if (state.sent) setText('');
  }

  return (
    <div className="mt-4 rounded-xl border border-glass-border bg-white/4 p-3.5">
      <strong className="text-sm">{t('msg_section_title', lang)}</strong>
      <p className="mb-2 mt-0.5 text-xs text-muted">
        {t('msg_regarding_prefix', lang)} {listingTitle}
      </p>
      <form action={formAction} className="space-y-2">
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('msg_placeholder', lang)}
          className="min-h-[80px] w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
        />
        {state.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state.sent && <p className="text-xs text-green-400">{t('toast_msg_sent', lang)}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-60"
        >
          {t('msg_send_button', lang)}
        </button>
      </form>
    </div>
  );
}
