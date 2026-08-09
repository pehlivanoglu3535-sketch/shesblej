'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { t, type LangCode } from '@/lib/i18n';
import { approveTestimonialAction, deleteTestimonialAction } from '@/app/actions/testimonials';

type Member = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  id_number: string | null;
  birth_date: string | null;
  consent_given: boolean;
  account_type: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  text: string;
  created_at: string;
  senderName: string;
  listingTitle: string;
};

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporterName: string;
  listingTitle: string;
};

const REASON_KEYS: Record<string, Parameters<typeof t>[0]> = {
  fraud: 'reason_fraud',
  misleading: 'reason_misleading',
  inappropriate: 'reason_inappropriate',
  other: 'reason_other',
};

type TestimonialRow = {
  id: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
  userName: string;
};

const TAB_KEYS = {
  members: 'admin_tab_members',
  messages: 'admin_tab_messages',
  reports: 'admin_tab_reports',
  testimonials: 'admin_tab_testimonials',
} as const;

export default function AdminTabs({
  lang,
  members,
  messages,
  reports,
  testimonials,
}: {
  lang: LangCode;
  members: Member[];
  messages: MessageRow[];
  reports: ReportRow[];
  testimonials: TestimonialRow[];
}) {
  const [tab, setTab] = useState<'members' | 'messages' | 'reports' | 'testimonials'>('members');
  const [, startTransition] = useTransition();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t('admin_panel_title', lang)}</h1>
        <Link href="/admin/blog" className="rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold hover:bg-white/12">
          {t('nav_blog', lang)}
        </Link>
      </div>

      <div className="mb-5 flex gap-1.5">
        {(Object.keys(TAB_KEYS) as (keyof typeof TAB_KEYS)[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-lg border px-4 py-2 text-sm font-bold ${
              tab === tb
                ? 'border-transparent bg-gradient-to-br from-primary to-primary-2 text-ink'
                : 'border-glass-border bg-white/4 text-muted'
            }`}
          >
            {t(TAB_KEYS[tb], lang)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-glass-border bg-surface">
        {tab === 'members' &&
          (members.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('admin_no_users', lang)}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border text-xs text-muted">
                  <Th>{t('admin_col_name', lang)}</Th>
                  <Th>{t('admin_col_email', lang)}</Th>
                  <Th>{t('admin_col_phone', lang)}</Th>
                  <Th>{t('admin_col_account_type', lang)}</Th>
                  <Th>{t('admin_col_id_number', lang)}</Th>
                  <Th>{t('admin_col_birth_date', lang)}</Th>
                  <Th>{t('admin_col_consent', lang)}</Th>
                  <Th>{t('admin_col_date', lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-glass-border/60 last:border-0">
                    <Td>{m.name}</Td>
                    <Td>{m.email ?? '—'}</Td>
                    <Td>{m.phone ?? '—'}</Td>
                    <Td>{m.account_type}</Td>
                    <Td>{m.id_number ?? '—'}</Td>
                    <Td>{m.birth_date ?? '—'}</Td>
                    <Td>{m.consent_given ? '✓' : '—'}</Td>
                    <Td>{new Date(m.created_at).toISOString().slice(0, 10)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'messages' &&
          (messages.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('admin_no_messages', lang)}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border text-xs text-muted">
                  <Th>{t('admin_col_msg_from', lang)}</Th>
                  <Th>{t('admin_col_msg_listing', lang)}</Th>
                  <Th>{t('admin_col_msg_text', lang)}</Th>
                  <Th>{t('admin_col_msg_date', lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className="border-b border-glass-border/60 last:border-0">
                    <Td>{m.senderName}</Td>
                    <Td>{m.listingTitle}</Td>
                    <Td className="max-w-xs truncate">{m.text}</Td>
                    <Td>{new Date(m.created_at).toISOString().slice(0, 10)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'reports' &&
          (reports.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('admin_no_reports', lang)}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border text-xs text-muted">
                  <Th>{t('admin_col_report_from', lang)}</Th>
                  <Th>{t('admin_col_msg_listing', lang)}</Th>
                  <Th>{t('admin_col_report_reason', lang)}</Th>
                  <Th>{t('admin_col_report_details', lang)}</Th>
                  <Th>{t('admin_col_date', lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-glass-border/60 last:border-0">
                    <Td>{r.reporterName}</Td>
                    <Td>{r.listingTitle}</Td>
                    <Td>{t(REASON_KEYS[r.reason] ?? 'reason_other', lang)}</Td>
                    <Td className="max-w-xs truncate">{r.details ?? '—'}</Td>
                    <Td>{new Date(r.created_at).toISOString().slice(0, 10)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'testimonials' &&
          (testimonials.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('admin_no_testimonials', lang)}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-glass-border text-xs text-muted">
                  <Th>{t('admin_col_name', lang)}</Th>
                  <Th>{t('label_rating', lang)}</Th>
                  <Th>{t('label_your_review', lang)}</Th>
                  <Th>{t('admin_col_approved', lang)}</Th>
                  <Th>{t('admin_col_date', lang)}</Th>
                  <Th>{' '}</Th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((tst) => (
                  <tr key={tst.id} className="border-b border-glass-border/60 last:border-0">
                    <Td>{tst.userName}</Td>
                    <Td>{'★'.repeat(tst.rating)}</Td>
                    <Td className="max-w-xs truncate">{tst.text}</Td>
                    <Td>{tst.approved ? '✓' : '—'}</Td>
                    <Td>{new Date(tst.created_at).toISOString().slice(0, 10)}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        {!tst.approved && (
                          <button
                            onClick={() => startTransition(() => approveTestimonialAction(tst.id, true))}
                            className="rounded-md border border-glass-border bg-white/6 px-2 py-1 text-xs font-bold hover:bg-white/12"
                          >
                            {t('btn_approve', lang)}
                          </button>
                        )}
                        <button
                          onClick={() => startTransition(() => deleteTestimonialAction(tst.id))}
                          className="rounded-md border border-red-400/30 bg-red-500/15 px-2 py-1 text-xs font-bold text-red-400"
                        >
                          {t('btn_delete', lang)}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3.5 py-2.5 font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3.5 py-2.5 ${className}`}>{children}</td>;
}
