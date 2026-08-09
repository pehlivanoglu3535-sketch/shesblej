'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { t, type LangCode } from '@/lib/i18n';
import { CATEGORIES, type CategoryId } from '@/lib/constants';
import { listingLimit, showcaseLimit, type PlanProfile } from '@/lib/plan';

export type PostAdState = { error: string | null };

const LISTING_RATE_LIMIT_SECONDS = 30;

export async function createListingAction(
  lang: LangCode,
  _prev: PostAdState,
  formData: FormData
): Promise<PostAdState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at, credit_extra_listing, credit_urgent_tag, credit_extra_showcase, credit_highlight')
    .eq('id', user.id)
    .single();
  const profile: PlanProfile = {
    plan: (profileRow?.plan as PlanProfile['plan']) ?? 'standard',
    planExpiresAt: profileRow?.plan_expires_at ?? null,
    creditExtraListing: profileRow?.credit_extra_listing ?? 0,
    creditExtraShowcase: profileRow?.credit_extra_showcase ?? 0,
  };

  const { data: recent } = await supabase
    .from('listings')
    .select('created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const elapsed = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (elapsed < LISTING_RATE_LIMIT_SECONDS) return { error: t('error_generic', lang) };
  }

  const { count: activeCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .gt('expires_at', new Date().toISOString());

  if ((activeCount ?? 0) >= listingLimit(profile)) {
    return { error: t('toast_listing_limit_reached', lang) };
  }

  const category = String(formData.get('category') || '') as CategoryId;
  const subcategory = String(formData.get('subcategory') || '');
  const title = String(formData.get('title') || '').trim().slice(0, 200);
  const priceRaw = String(formData.get('price') || '');
  const city = String(formData.get('city') || '');
  const district = String(formData.get('district') || '').trim().slice(0, 200);
  const mapLat = formData.get('mapLat') ? Number(formData.get('mapLat')) : null;
  const mapLng = formData.get('mapLng') ? Number(formData.get('mapLng')) : null;
  const phone = String(formData.get('phone') || '').trim().slice(0, 40);
  const description = String(formData.get('description') || '').trim().slice(0, 5000);
  const photosRaw = String(formData.get('photos') || '[]');
  const brand = String(formData.get('brand') || '').trim().slice(0, 60);
  const wantsUrgent = formData.get('wantsUrgent') === '1';
  const wantsHighlight = formData.get('wantsHighlight') === '1';
  const wantsShowcase = formData.get('wantsShowcase') === '1';

  if (!CATEGORIES.some((c) => c.id === category)) return { error: t('error_generic', lang) };
  const cat = CATEGORIES.find((c) => c.id === category)!;
  if (!cat.subs.some((s) => s.id === subcategory)) return { error: t('error_generic', lang) };

  const price = Number(priceRaw);
  if (!title || !Number.isFinite(price) || price < 0) {
    return { error: t('toast_fill_title_price', lang) };
  }
  if (!city) return { error: t('error_generic', lang) };
  if (category === 'emlak') {
    if (!district) return { error: t('toast_district_required', lang) };
    if (mapLat == null || mapLng == null) return { error: t('toast_map_required', lang) };
  }
  if (!phone) return { error: t('toast_phone_required', lang) };

  let photos: string[] = [];
  try {
    const parsed = JSON.parse(photosRaw);
    if (Array.isArray(parsed)) photos = parsed.filter((p) => typeof p === 'string').slice(0, 5);
  } catch {
    photos = [];
  }

  const { count: showcaseCount } = wantsShowcase
    ? await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('uses_showcase', true)
        .gt('expires_at', new Date().toISOString())
    : { count: 0 };

  const useUrgent = wantsUrgent && (profileRow?.credit_urgent_tag ?? 0) > 0;
  const useHighlight = wantsHighlight && (profileRow?.credit_highlight ?? 0) > 0;
  const useShowcase = wantsShowcase && (showcaseCount ?? 0) < showcaseLimit(profile);

  const { data, error } = await supabase
    .from('listings')
    .insert({
      owner_id: user.id,
      category,
      subcategory,
      title,
      price,
      city,
      district: district || null,
      map_lat: mapLat,
      map_lng: mapLng,
      phone,
      description,
      photos,
      brand: category === 'vasita' && brand ? brand : null,
      is_urgent: useUrgent,
      is_highlighted: useHighlight,
      uses_showcase: useShowcase,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createListingAction failed:', error?.message);
    return { error: t('error_generic', lang) };
  }

  if (useUrgent) {
    await supabase
      .from('profiles')
      .update({ credit_urgent_tag: Math.max(0, (profileRow?.credit_urgent_tag ?? 0) - 1) })
      .eq('id', user.id);
  }
  if (useHighlight) {
    await supabase
      .from('profiles')
      .update({ credit_highlight: Math.max(0, (profileRow?.credit_highlight ?? 0) - 1) })
      .eq('id', user.id);
  }

  redirect(`/listing/${data.id}`);
}

export async function updateListingAction(
  lang: LangCode,
  listingId: string,
  _prev: PostAdState,
  formData: FormData
): Promise<PostAdState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('msg_login_prompt', lang) };

  const category = String(formData.get('category') || '') as CategoryId;
  const subcategory = String(formData.get('subcategory') || '');
  const title = String(formData.get('title') || '').trim().slice(0, 200);
  const price = Number(formData.get('price') || '');
  const city = String(formData.get('city') || '');
  const district = String(formData.get('district') || '').trim().slice(0, 200);
  const mapLat = formData.get('mapLat') ? Number(formData.get('mapLat')) : null;
  const mapLng = formData.get('mapLng') ? Number(formData.get('mapLng')) : null;
  const phone = String(formData.get('phone') || '').trim().slice(0, 40);
  const description = String(formData.get('description') || '').trim().slice(0, 5000);
  const photosRaw = String(formData.get('photos') || '[]');
  const brand = String(formData.get('brand') || '').trim().slice(0, 60);

  if (!title || !Number.isFinite(price) || price < 0) {
    return { error: t('toast_fill_title_price', lang) };
  }
  if (category === 'emlak' && (!district || mapLat == null || mapLng == null)) {
    return { error: t('toast_district_required', lang) };
  }
  if (!phone) return { error: t('toast_phone_required', lang) };

  let photos: string[] = [];
  try {
    const parsed = JSON.parse(photosRaw);
    if (Array.isArray(parsed)) photos = parsed.filter((p) => typeof p === 'string').slice(0, 5);
  } catch {
    photos = [];
  }

  const { error } = await supabase
    .from('listings')
    .update({
      category,
      subcategory,
      title,
      price,
      city,
      district: district || null,
      map_lat: mapLat,
      map_lng: mapLng,
      phone,
      description,
      photos,
      brand: category === 'vasita' && brand ? brand : null,
    })
    .eq('id', listingId)
    .eq('owner_id', user.id);

  if (error) {
    console.error('updateListingAction failed:', error.message);
    return { error: t('error_generic', lang) };
  }

  redirect(`/listing/${listingId}`);
}

export async function deleteListingAction(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  const isAdmin = profile?.is_admin ?? false;

  const query = supabase.from('listings').delete().eq('id', listingId);
  if (!isAdmin) query.eq('owner_id', user.id);
  await query;

  redirect('/my-listings');
}
