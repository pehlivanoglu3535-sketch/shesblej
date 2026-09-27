'use client';

import { useState } from 'react';
import { t, type LangCode } from '@/lib/i18n';

/**
 * Kredi/leasing hesaplayıcısı.
 *
 * Kosova'da araç ilanlarının büyük kısmı taksitle satılıyor ve alıcının ilk
 * sorusu aylık taksit oluyor. Hesap tarayıcıda yapılıyor — sunucuya gitmesi
 * gereken hiçbir şey yok ve her tuşta yeniden hesaplanıyor.
 *
 * Formül standart anüite: sabit taksit, azalan bakiye. Faiz sıfır
 * girildiğinde formülün paydası sıfırlanıyor, o durum ayrı ele alınıyor.
 */
export default function LoanCalculator({ price, lang }: { price: number; lang: LangCode }) {
  const [amount, setAmount] = useState(String(price));
  const [rate, setRate] = useState('6.9');
  const [months, setMonths] = useState('60');
  const [down, setDown] = useState('0');

  const principal = Math.max(0, (Number(amount) || 0) - (Number(down) || 0));
  const n = Math.max(1, Math.round(Number(months) || 0));
  const annual = Math.max(0, Number(rate) || 0);
  const i = annual / 100 / 12;

  const monthly = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
  const total = monthly * n;
  const interest = total - principal;
  const valid = principal > 0 && Number.isFinite(monthly);

  const eur = (v: number) =>
    `€${Math.round(v).toLocaleString('de-DE')}`;

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-extrabold tracking-wide uppercase">{t('leasing_title', lang)}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumField label={t('leasing_price', lang)} value={amount} onChange={setAmount} min={0} step={100} />
        <NumField label={t('leasing_down', lang)} value={down} onChange={setDown} min={0} step={100} />
        <NumField label={t('leasing_interest', lang)} value={rate} onChange={setRate} min={0} step={0.1} />
        <NumField label={t('leasing_months', lang)} value={months} onChange={setMonths} min={1} step={6} />
      </div>

      <div className="mt-4 rounded-xl border border-glass-border bg-white/4 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted">{t('leasing_monthly', lang)}</span>
          <strong className="text-2xl font-extrabold text-primary">{valid ? eur(monthly) : '—'}</strong>
        </div>
        <div className="mt-2 space-y-1 border-t border-white/8 pt-2 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t('leasing_total_interest', lang)}</span>
            <span className="font-bold">{valid ? eur(interest) : '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t('leasing_total', lang)}</span>
            <span className="font-bold">{valid ? eur(total) : '—'}</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted">{t('leasing_note', lang)}</p>
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  step: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#cbc6ba]">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm"
      />
    </label>
  );
}
