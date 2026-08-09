'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createListingAction, updateListingAction, type PostAdState } from './actions';
import { CATEGORIES, CITIES, CITY_COORDS, MAX_PHOTOS, CAR_BRANDS, type CategoryId } from '@/lib/constants';
import { t, catName, subName, type LangCode } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Listing } from '@/lib/listings';
import type { CurrentUser } from '@/lib/get-user';
import { showcaseLimit } from '@/lib/plan';

const STEP_KEYS = ['step_category', 'step_details', 'step_location', 'step_contact'] as const;

export default function PostAdForm({ lang, listing, user }: { lang: LangCode; listing?: Listing; user: CurrentUser }) {
  const isEdit = !!listing;
  const boundAction = isEdit
    ? updateListingAction.bind(null, lang, listing.id)
    : createListingAction.bind(null, lang);
  const [state, formAction, pending] = useActionState<PostAdState, FormData>(boundAction, { error: null });

  const [step, setStep] = useState(1);
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
  const [wantsUrgent, setWantsUrgent] = useState(false);
  const [wantsHighlight, setWantsHighlight] = useState(false);
  const [wantsShowcase, setWantsShowcase] = useState(false);

  const cat = CATEGORIES.find((c) => c.id === category)!;
  const isEmlak = category === 'emlak';
  const showcaseAvailable = showcaseLimit(user);

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

  function validateStep(n: number): string | null {
    if (n === 2) {
      if (!title.trim() || !price || Number(price) < 0) return t('toast_fill_title_price', lang);
    }
    if (n === 3) {
      if (isEmlak) {
        if (!district.trim()) return t('toast_district_required', lang);
        if (!mapPin) return t('toast_map_required', lang);
      }
    }
    return null;
  }

  const [stepError, setStepError] = useState<string | null>(null);

  function next() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(t('toast_photo_limit', lang));
      return;
    }
    setPhotoError(null);
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
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 8 * 1024 * 1024) {
          setPhotoError(t('toast_storage_full', lang));
          continue;
        }
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
    <main className="mx-auto max-w-xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{t(isEdit ? 'edit_ad_title' : 'post_ad_title', lang)}</h1>

        <div className="mb-6 flex gap-1.5">
          {STEP_KEYS.map((key, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div
                key={key}
                onClick={() => done && setStep(n)}
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
          <input type="hidden" name="wantsUrgent" value={wantsUrgent ? '1' : '0'} />
          <input type="hidden" name="wantsHighlight" value={wantsHighlight ? '1' : '0'} />
          <input type="hidden" name="wantsShowcase" value={wantsShowcase ? '1' : '0'} />

          <div className={step === 1 ? 'space-y-4' : 'hidden'}>
              <Field label={t('label_category', lang)}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
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
                  defaultValue={listing?.subcategory ?? cat.subs[0].id}
                  className="w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2.5 text-sm"
                >
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

          <div className={step === 2 ? 'space-y-4' : 'hidden'}>
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

          <div className={step === 3 ? 'space-y-4' : 'hidden'}>
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

          <div className={step === 4 ? 'space-y-4' : 'hidden'}>
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

              {!isEdit && (
                <div className="space-y-2 rounded-lg border border-glass-border bg-white/4 p-3">
                  <BadgeCheckbox
                    checked={wantsUrgent}
                    onChange={setWantsUrgent}
                    credits={user.creditUrgentTag}
                    label={t('label_urgent_tag', lang)}
                    lang={lang}
                  />
                  <BadgeCheckbox
                    checked={wantsHighlight}
                    onChange={setWantsHighlight}
                    credits={user.creditHighlight}
                    label={t('label_highlight', lang)}
                    lang={lang}
                  />
                  <BadgeCheckbox
                    checked={wantsShowcase}
                    onChange={setWantsShowcase}
                    credits={showcaseAvailable}
                    label={t('label_showcase', lang)}
                    lang={lang}
                  />
                </div>
              )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={back}
              className={`rounded-lg border border-glass-border bg-white/6 px-4 py-2 text-sm font-bold ${step === 1 ? 'invisible' : ''}`}
            >
              {t('btn_back', lang)}
            </button>
            {step < 4 ? (
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

function BadgeCheckbox({
  checked,
  onChange,
  credits,
  label,
  lang,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  credits: number;
  label: string;
  lang: LangCode;
}) {
  const disabled = credits <= 0;
  return (
    <label className={`flex items-center justify-between gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        {label}
      </span>
      {disabled ? (
        <Link href="/packages" className="text-xs text-primary underline">
          {t('nav_packages', lang)}
        </Link>
      ) : (
        <span className="text-xs text-muted">
          {credits} {t('credits_available_suffix', lang)}
        </span>
      )}
    </label>
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
