import { t, type LangCode } from '@/lib/i18n';
import type { Listing } from '@/lib/listings';
import {
  bodyTypeLabel,
  colorLabel,
  drivetrainLabel,
  formatKm,
  fuelLabel,
  transmissionLabel,
} from '@/lib/vehicle';

/**
 * Araç künyesi tablosu.
 *
 * Boş alan satır üretmiyor: ilan sahibi çoğu zaman her şeyi doldurmuyor ve
 * "—" dolu bir tablo, dolu bir tablodan daha kötü görünüyor.
 */
export function vehicleSpecRows(listing: Listing, lang: LangCode): { label: string; value: string }[] {
  const rows: (readonly [string, string | null])[] = [
    [t('label_brand', lang), listing.brand],
    [t('label_model', lang), listing.model],
    [t('label_body_type', lang), bodyTypeLabel(listing.body_type, lang)],
    [t('label_year', lang), listing.year != null ? String(listing.year) : null],
    [t('label_mileage', lang), listing.mileage_km != null ? formatKm(listing.mileage_km) : null],
    [t('label_fuel', lang), fuelLabel(listing.fuel, lang)],
    [t('label_engine', lang), listing.engine_cc != null ? `${listing.engine_cc} cm³` : null],
    [t('label_power', lang), listing.power_hp != null ? `${listing.power_hp} PS` : null],
    [t('label_transmission', lang), transmissionLabel(listing.transmission, lang)],
    [t('label_drivetrain', lang), drivetrainLabel(listing.drivetrain, lang)],
    [t('label_color_exterior', lang), colorLabel(listing.color_exterior, lang)],
    [t('label_color_interior', lang), colorLabel(listing.color_interior, lang)],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]).map(([label, value]) => ({ label, value }));
}

export default function VehicleSpecTable({ listing, lang }: { listing: Listing; lang: LangCode }) {
  const rows = vehicleSpecRows(listing, lang);
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-extrabold tracking-wide uppercase">{t('detail_specs_title', lang)}</h2>
      <dl className="divide-y divide-white/8">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-xs tracking-wide text-muted uppercase">{row.label}</dt>
            <dd className="text-right text-sm font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
