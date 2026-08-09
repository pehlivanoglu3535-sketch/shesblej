'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CATEGORIES, CITIES, CAR_BRANDS, type CategoryId } from '@/lib/constants';
import { t, subName, type LangCode } from '@/lib/i18n';

export default function Filters({ lang, category }: { lang: LangCode; category?: CategoryId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cat = CATEGORIES.find((c) => c.id === category);

  function updateParam(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSortChange(value: string) {
    if (value === 'nearest') {
      if (!navigator.geolocation) {
        updateParam({ sort: null, lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => updateParam({ sort: 'nearest', lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
        () => updateParam({ sort: null, lat: null, lng: null })
      );
    } else {
      updateParam({ sort: value || null, lat: null, lng: null });
    }
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2.5">
      <select
        defaultValue={searchParams.get('sort') ?? 'default'}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
      >
        <option value="default">{t('sort_default', lang)}</option>
        <option value="price-asc">{t('sort_price_asc', lang)}</option>
        <option value="price-desc">{t('sort_price_desc', lang)}</option>
        <option value="nearest">{t('sort_nearest', lang)}</option>
      </select>

      {cat && (
        <select
          defaultValue={searchParams.get('subcategory') ?? ''}
          onChange={(e) => updateParam({ subcategory: e.target.value || null })}
          className="rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">{t('filter_all_subcats', lang)}</option>
          {cat.subs.map((s) => (
            <option key={s.id} value={s.id}>
              {subName(s.id, lang)}
            </option>
          ))}
        </select>
      )}

      {category === 'vasita' && (
        <select
          defaultValue={searchParams.get('brand') ?? ''}
          onChange={(e) => updateParam({ brand: e.target.value || null })}
          className="rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">{t('filter_all_brands', lang)}</option>
          {CAR_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      )}

      <select
        defaultValue={searchParams.get('city') ?? ''}
        onChange={(e) => updateParam({ city: e.target.value || null })}
        className="rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
      >
        <option value="">{t('filter_all_cities', lang)}</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder={t('filter_min_price', lang)}
        defaultValue={searchParams.get('minPrice') ?? ''}
        onBlur={(e) => updateParam({ minPrice: e.target.value || null })}
        className="w-28 rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
      />
      <input
        type="number"
        placeholder={t('filter_max_price', lang)}
        defaultValue={searchParams.get('maxPrice') ?? ''}
        onBlur={(e) => updateParam({ maxPrice: e.target.value || null })}
        className="w-28 rounded-lg border border-glass-border bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
