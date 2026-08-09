'use client';

import { useState } from 'react';
import Link from 'next/link';
import { t, type LangCode } from '@/lib/i18n';

export type BusinessRow = {
  id: string;
  name: string;
  company_name: string | null;
  company_logo_url: string | null;
  listingCount: number;
};

export default function GalleryClient({
  lang,
  vehicleDealers,
  realEstateCompanies,
}: {
  lang: LangCode;
  vehicleDealers: BusinessRow[];
  realEstateCompanies: BusinessRow[];
}) {
  const [tab, setTab] = useState<'vehicles' | 'realestate'>('vehicles');
  const list = tab === 'vehicles' ? vehicleDealers : realEstateCompanies;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">{t('gallery_title', lang)}</h1>

      <div className="mb-6 flex gap-1.5">
        <button
          onClick={() => setTab('vehicles')}
          className={`rounded-lg border px-4 py-2 text-sm font-bold ${
            tab === 'vehicles' ? 'border-transparent bg-gradient-to-br from-primary to-primary-2 text-ink' : 'border-glass-border bg-white/4 text-muted'
          }`}
        >
          {t('gallery_vehicles_tab', lang)}
        </button>
        <button
          onClick={() => setTab('realestate')}
          className={`rounded-lg border px-4 py-2 text-sm font-bold ${
            tab === 'realestate' ? 'border-transparent bg-gradient-to-br from-primary to-primary-2 text-ink' : 'border-glass-border bg-white/4 text-muted'
          }`}
        >
          {t('gallery_realestate_tab', lang)}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
          {t('gallery_empty', lang)}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <div key={b.id} className="rounded-2xl border border-glass-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-3">
                {b.company_logo_url ? (
                  <img src={b.company_logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                    {(b.company_name || b.name).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold">{b.company_name || b.name}</p>
                  <p className="text-xs text-muted">{b.listingCount} {t('plan_listings_suffix', lang)}</p>
                </div>
              </div>
              <Link
                href={`/gallery/${b.id}`}
                className="block w-full rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-center text-sm font-bold hover:bg-white/12"
              >
                {t('gallery_view_listings', lang)}
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
