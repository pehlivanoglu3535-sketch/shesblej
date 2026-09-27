import { t, type LangCode } from '@/lib/i18n';
import { FEATURE_GROUPS, vt } from '@/lib/vehicle';

/**
 * Donanım listesi.
 *
 * İlanda seçili olanlar kendi grupları altında gösteriliyor; hiç seçimi
 * olmayan grup hiç basılmıyor. Seçili olmayan donanımı gri tikle göstermek
 * de bir seçenekti ama 40 satırlık bir listenin çoğu boş çıkıyor ve ilan
 * eksik görünüyordu.
 */
export default function VehicleFeatures({ features, lang }: { features: string[]; lang: LangCode }) {
  const selected = new Set(features);
  const groups = FEATURE_GROUPS.map((g) => ({
    id: g.id,
    title: vt(g.title, lang),
    items: g.items.filter((i) => selected.has(i.id)).map((i) => vt(i.label, lang)),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-extrabold tracking-wide uppercase">{t('detail_features_title', lang)}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-xs font-extrabold tracking-wide text-primary uppercase">{group.title}</p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span aria-hidden className="mt-0.5 shrink-0 text-primary">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
