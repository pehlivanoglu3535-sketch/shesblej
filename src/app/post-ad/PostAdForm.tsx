'use client';

import { useActionState, useState } from 'react';
import { createListingAction, updateListingAction, type PostAdState } from './actions';
import { CATEGORIES, CITIES, CITY_COORDS, MAX_PHOTOS, CAR_BRANDS, type CategoryId } from '@/lib/constants';
import { t, catName, subName, type LangCode } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Listing } from '@/lib/listings';
import type { CurrentUser } from '@/lib/get-user';
import { compressImage } from '@/lib/compress-image';
import {
  BODY_TYPES,
  COLORS,
  DRIVETRAINS,
  FEATURE_GROUPS,
  FUELS,
  TRANSMISSIONS,
  YEAR_MIN,
  vt,
  yearMax,
  type Option,
} from '@/lib/vehicle';

/**
 * Adımlar kategoriye göre değişiyor: künye adımı yalnız araç ilanında var.
 * Bu yüzden adım numarası değil kimliği tutuluyor — araya bir adım girip
 * çıkınca numara kayıyor, kimlik kaymıyor.
 */
const BASE_STEPS = ['step_category', 'step_details', 'step_location', 'step_contact'] as const;
type StepKey = (typeof BASE_STEPS)[number] | 'step_specs';

export default function PostAdForm({ lang, listing }: { lang: LangCode; listing?: Listing; user: CurrentUser }) {
  const isEdit = !!listing;
  const boundAction = isEdit
    ? updateListingAction.bind(null, lang, listing.id)
    : createListingAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<PostAdState, FormData>(boundAction, { error: null });

  const [step, setStep] = useState<StepKey>('step_category');
  const [category, setCategory] = useState<CategoryId>(listing?.category ?? 'emlak');
  const [title, setTitle] = useState(listing?.title ?? '');
  const [price, setPrice] = useState(listing ? String(listing.price) : '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [city, setCity] = useState(listing?.city ?? CITIES[0]);
  const [district, setDistrict] = useState(listing?.district ?? '');
  const [mapPin, setMapPin] = useState<{ x: number; y: number } | null>(
    listing?.map_lat != null ? { x: 50, y: 50 } : null
  );
  const [phone, setPhone] = useState(listing?.phone ?? '');
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [brand, setBrand] = useState(listing?.brand ?? '');
  const [features, setFeatures] = useState<string[]>(listing?.features ?? []);
  const [subcategory, setSubcategory] = useState(listing?.subcategory ?? CATEGORIES[0].subs[0].id);

  /**
   * Künye alanları React durumunda tutuluyor, `defaultValue` ile değil.
   *
   * Sunucu eylemi yönlendirmeden dönerse (ilan limiti, hız sınırı, doğrulama
   * hatası) React formu sıfırlıyor: denetimli alanlar durumlarından geri
   * geliyor, denetimsiz alanlar `defaultValue`'ya düşüyor. İlk sürümde on bir
   * künye alanı denetimsizdi, yani tek bir hata mesajı kullanıcının o adımda
   * doldurduğu her şeyi siliyordu — testte birebir bu oldu.
   */
  const [specs, setSpecs] = useState({
    model: listing?.model ?? '',
    year: listing?.year != null ? String(listing.year) : '',
    mileageKm: listing?.mileage_km != null ? String(listing.mileage_km) : '',
    fuel: listing?.fuel ?? '',
    engineCc: listing?.engine_cc != null ? String(listing.engine_cc) : '',
    powerHp: listing?.power_hp != null ? String(listing.power_hp) : '',
    transmission: listing?.transmission ?? '',
    drivetrain: listing?.drivetrain ?? '',
    bodyType: listing?.body_type ?? '',
    colorExterior: listing?.color_exterior ?? '',
    colorInterior: listing?.color_interior ?? '',
  });
  const setSpec = (key: keyof typeof specs, value: string) =>
    setSpecs((prev) => ({ ...prev, [key]: value }));

  const cat = CATEGORIES.find((c) => c.id === category)!;
  const isEmlak = category === 'emlak';
  const isVasita = category === 'vasita';

  const steps: StepKey[] = isVasita
    ? ['step_category', 'step_details', 'step_specs', 'step_location', 'step_contact']
    : [...BASE_STEPS];

  // Alt kategori kategoriye bağlı. Kategori değişince onChange zaten
  // sıfırlıyor, ama düzenleme modunda gelen ilan arada başka bir kategoriye
  // taşınmış olabilir; render sırasında kırpmak o durumu da kapatıyor.
  const activeSubcategory = cat.subs.some((s) => s.id === subcategory) ? subcategory : cat.subs[0].id;

  // Kategori araçtan başka bir şeye çevrilirse künye adımı listeden düşüyor
  // ve o an orada duruyor olabiliriz. Effect yerine render sırasında
  // düzeltiliyor; effect bir kare boş ekran gösterirdi.
  const stepIndex = steps.indexOf(step);
  const activeStep: StepKey = stepIndex === -1 ? 'step_details' : step;
  const activeIndex = steps.indexOf(activeStep);
  const isLast = activeIndex === steps.length - 1;

  function toggleFeature(id: string) {
    setFeatures((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMapPin({ x, y });
  }

  function mapLatLng(): { lat: number; lng: number } | null {
    if (!mapPin) return null;
    if (listing?.map_lat != null && listing?.map_lng != null && mapPin.x === 50 && mapPin.y === 50 && city === listing.city) {
      return { lat: listing.map_lat, lng: listing.map_lng };
    }
    const base = CITY_COORDS[city];
    if (!base) return null;
    return {
      lat: base.lat + ((50 - mapPin.y) / 50) * 0.02,
      lng: base.lng + ((mapPin.x - 50) / 50) * 0.02,
    };
  }

  function validateStep(key: StepKey): string | null {
    if (key === 'step_details') {
      if (!title.trim() || !price || Number(price) < 0) return t('toast_fill_title_price', lang);
    }
    if (key === 'step_location' && isEmlak) {
      if (!district.trim()) return t('toast_district_required', lang);
      if (!mapPin) return t('toast_map_required', lang);
    }
    return null;
  }

  const [stepError, setStepError] = useState<string | null>(null);

  function next() {
    const err = validateStep(activeStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep(steps[Math.min(steps.length - 1, activeIndex + 1)]);
  }
  function back() {
    setStepError(null);
    setStep(steps[Math.max(0, activeIndex - 1)]);
  }

  async function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (selected.length === 0) return;

    // Take what still fits rather than rejecting the whole selection: picking
    // photos on a phone is fiddly, and dropping all of them over the limit
    // means redoing the entire selection.
    const remaining = MAX_PHOTOS - photos.length;
    const files = selected.slice(0, Math.max(0, remaining));
    setPhotoError(files.length < selected.length ? t('toast_photo_limit', lang) : null);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPhotoError(t('msg_login_prompt', lang));
        return;
      }
      const uploaded: string[] = [];
      for (const original of files) {
        if (!original.type.startsWith('image/')) continue;
        if (original.size > 25 * 1024 * 1024) {
          setPhotoError(t('toast_storage_full', lang));
          continue;
        }
        // Shrink before upload so phone-camera photos don't eat the storage quota.
        const file = await compressImage(original);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (error) {
          setPhotoError(t('error_generic', lang));
          continue;
        }
        const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length) setPhotos((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  const latLng = mapLatLng();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{t(isEdit ? 'edit_ad_title' : 'post_ad_title', lang)}</h1>

        <div className="mb-6 flex gap-1.5">
          {steps.map((key, i) => {
            const active = i === activeIndex;
            const done = i < activeIndex;
            return (
              <div
                key={key}
                onClick={() => done && setStep(key)}
                className={`flex-1 rounded-lg border px-1 py-2.5 text-center text-xs font-bold ${
                  active
                    ? 'border-transparent bg-gradient-to-br from-primary to-primary-2 text-ink'
                    : done
                      ? 'cursor-pointer border-green-400/30 bg-green-500/10 text-green-400'
                      : 'border-glass-border bg-white/4 text-muted'
                }`}
              >
                {t(key, lang)}
              </div>
            );
          })}
        </div>

        {(stepError || state.error) && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {stepError ?? state.error}
          </p>
        )}

        <form action={formAction}>
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="mapLat" value={latLng ? String(latLng.lat) : ''} />
          <input type="hidden" name="mapLng" value={latLng ? String(latLng.lng) : ''} />
          <input type="hidden" name="photos" value={JSON.stringify(photos)} />
          <input type="hidden" name="features" value={JSON.stringify(isVasita ? features : [])} />

          <div className={activeStep === 'step_category' ? 'space-y-4' : 'hidden'}>
              <Field label={t('label_category', lang)}>
                <select
                  value={category}
                  onChange={(e) => {
                    const next = e.target.value as CategoryId;
                    setCategory(next);
                    // Alt kategori kategoriye bağlı; taşınan bir değer
                    // sunucuda reddedilirdi.
                    setSubcategory(CATEGORIES.find((c) => c.id === next)!.subs[0].id);
                  }}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {catName(c.id, lang)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('label_subcategory', lang)}>
                <select
                  name="subcategory"
                  value={activeSubcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                >
                  {/* Seçili değer bu kategoriye ait değilse tarayıcı ilk
                      seçeneği gösterir ama durum eski değeri taşımaya devam
                      eder; o yüzden liste değil durum belirleyici. */}
                  {cat.subs.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">
                      {subName(s.id, lang)}
                    </option>
                  ))}
                </select>
              </Field>
              {category === 'vasita' && (
                <Field label={t('label_brand', lang)}>
                  <select
                    name="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                  >
                    <option value="" className="text-black">—</option>
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b} className="text-black">
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
          </div>

          <div className={activeStep === 'step_details' ? 'space-y-4' : 'hidden'}>
              <Field label={t('label_title', lang)}>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('placeholder_title', lang)}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label={t('label_price', lang)}>
                <input
                  name="price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t('placeholder_price', lang)}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label={t('label_description', lang)}>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('placeholder_description', lang)}
                  className="min-h-[90px] w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label={t('label_photos', lang)}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading || photos.length >= MAX_PHOTOS}
                  onChange={onPhotoSelect}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink"
                />
                <p className="mt-1 text-xs text-muted">{t('photo_upload_hint', lang)}</p>
                {uploading && <p className="mt-1 text-xs text-primary">{t('btn_publish', lang)}…</p>}
                {photoError && <p className="mt-1 text-xs text-red-400">{photoError}</p>}
                {photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((url) => (
                      <div key={url} className="relative h-16 w-16">
                        <img src={url} alt="" className="h-16 w-16 rounded-md object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
          </div>

          {/* Araç künyesi. Kategori araç değilken hiç basılmıyor — gizli
              alanlar formda kalsa sunucu tarafı yine yok sayardı ama
              kullanıcı DOM'da alakasız alanlar görürdü. */}
          {isVasita && (
            <div className={activeStep === 'step_specs' ? 'space-y-4' : 'hidden'}>
              <p className="text-xs text-muted">
                {t('specs_hint', lang)} {t('specs_optional', lang)}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('label_model', lang)}>
                  <input
                    name="model"
                    value={specs.model}
                    onChange={(e) => setSpec('model', e.target.value)}
                    placeholder="Tiguan R-Line"
                    className={INPUT}
                  />
                </Field>
                <Field label={t('label_year', lang)}>
                  <select
                    name="year"
                    value={specs.year}
                    onChange={(e) => setSpec('year', e.target.value)}
                    className={INPUT}
                  >
                    <option value="" className="text-black">—</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="text-black">
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('label_mileage', lang)}>
                  <input
                    name="mileageKm"
                    type="number"
                    min={0}
                    max={2000000}
                    value={specs.mileageKm}
                    onChange={(e) => setSpec('mileageKm', e.target.value)}
                    placeholder="150000"
                    className={INPUT}
                  />
                </Field>
                <SpecSelect name="fuel" label={t('label_fuel', lang)} options={FUELS} value={specs.fuel} onChange={(v) => setSpec('fuel', v)} lang={lang} />
                <Field label={t('label_engine', lang)}>
                  <input
                    name="engineCc"
                    type="number"
                    min={0}
                    max={10000}
                    value={specs.engineCc}
                    onChange={(e) => setSpec('engineCc', e.target.value)}
                    placeholder="2000"
                    className={INPUT}
                  />
                </Field>
                <Field label={t('label_power', lang)}>
                  <input
                    name="powerHp"
                    type="number"
                    min={0}
                    max={2000}
                    value={specs.powerHp}
                    onChange={(e) => setSpec('powerHp', e.target.value)}
                    placeholder="190"
                    className={INPUT}
                  />
                </Field>
                <SpecSelect name="transmission" label={t('label_transmission', lang)} options={TRANSMISSIONS} value={specs.transmission} onChange={(v) => setSpec('transmission', v)} lang={lang} />
                <SpecSelect name="drivetrain" label={t('label_drivetrain', lang)} options={DRIVETRAINS} value={specs.drivetrain} onChange={(v) => setSpec('drivetrain', v)} lang={lang} />
                <SpecSelect name="bodyType" label={t('label_body_type', lang)} options={BODY_TYPES} value={specs.bodyType} onChange={(v) => setSpec('bodyType', v)} lang={lang} />
                <SpecSelect name="colorExterior" label={t('label_color_exterior', lang)} options={COLORS} value={specs.colorExterior} onChange={(v) => setSpec('colorExterior', v)} lang={lang} />
                <SpecSelect name="colorInterior" label={t('label_color_interior', lang)} options={COLORS} value={specs.colorInterior} onChange={(v) => setSpec('colorInterior', v)} lang={lang} />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#cbc6ba]">{t('label_features', lang)}</p>
                <div className="space-y-4">
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.id} className="rounded-xl border border-glass-border bg-white/4 p-3.5">
                      <p className="mb-2 text-xs font-extrabold tracking-wide text-primary uppercase">
                        {vt(group.title, lang)}
                      </p>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {group.items.map((item) => (
                          <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={features.includes(item.id)}
                              onChange={() => toggleFeature(item.id)}
                              className="h-4 w-4 shrink-0 accent-[#fdd202]"
                            />
                            <span className="min-w-0 truncate">{vt(item.label, lang)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={activeStep === 'step_location' ? 'space-y-4' : 'hidden'}>
              <Field label={t('label_city', lang)} required>
                <select
                  name="city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setMapPin(null);
                  }}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="text-black">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('label_district', lang)} required={isEmlak}>
                <input
                  name="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t('placeholder_district', lang)}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label={t('label_map', lang)} required={isEmlak}>
                <div
                  onClick={onMapClick}
                  className="relative h-[150px] cursor-crosshair rounded-lg border border-glass-border"
                  style={{
                    background:
                      'repeating-linear-gradient(0deg,#e8edf1,#e8edf1 19px,#dde3e8 20px),repeating-linear-gradient(90deg,#e8edf1,#e8edf1 19px,#dde3e8 20px)',
                  }}
                >
                  {!mapPin && (
                    <span className="absolute inset-0 flex items-center justify-center px-5 text-center text-xs text-[#6b6659]">
                      {t('map_hint', lang)}
                    </span>
                  )}
                  {mapPin && (
                    <span
                      className="absolute -ml-3 -mt-6 text-2xl"
                      style={{ left: `${mapPin.x}%`, top: `${mapPin.y}%` }}
                    >
                      📍
                    </span>
                  )}
                </div>
                {mapPin && <p className="mt-1.5 text-xs font-semibold text-green-400">{t('map_status_ok', lang)}</p>}
              </Field>
              <p className="text-xs text-muted">{isEmlak ? t('location_hint_required', lang) : t('location_hint_optional', lang)}</p>
          </div>

          <div className={activeStep === 'step_contact' ? 'space-y-4' : 'hidden'}>
              <Field label={t('label_phone', lang)}>
                <input
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+383 4x xxx xxx"
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                />
              </Field>
              <p className="text-xs text-muted">{t('post_ad_expiry_hint', lang)}</p>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={back}
              className={`rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold ${activeIndex === 0 ? 'invisible' : ''}`}
            >
              {t('btn_back', lang)}
            </button>
            {!isLast ? (
              <button
                key="next"
                type="button"
                onClick={next}
                className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-5 py-2 text-sm font-extrabold text-ink"
              >
                {t('btn_next', lang)}
              </button>
            ) : (
              <button
                key="publish"
                type="submit"
                disabled={pending || uploading}
                className="rounded-lg bg-gradient-to-br from-primary to-primary-2 px-5 py-2 text-sm font-extrabold text-ink disabled:opacity-60"
              >
                {t(isEdit ? 'btn_save' : 'btn_publish', lang)}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

const INPUT = 'w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm';

// En yeniden en eskiye: bir aracı satan kişi çoğunlukla son yıllardan birini
// seçiyor, listeyi 1950'den başlatmak her seferinde uzun bir kaydırma demek.
const YEARS = Array.from({ length: yearMax() - YEAR_MIN + 1 }, (_, i) => yearMax() - i);

function SpecSelect({
  name,
  label,
  options,
  value,
  onChange,
  lang,
}: {
  name: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  lang: LangCode;
}) {
  return (
    <Field label={label}>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT}>
        <option value="" className="text-black">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id} className="text-black">
            {vt(o.label, lang)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#cbc6ba]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
