import { createClient } from '@supabase/supabase-js';
import {
  ALBERTI_STORE_SLUG,
  SYNC_LIMITS,
  carIdFromPhotos,
  listingFieldsFor,
  scrapeAll,
} from '@/lib/alberti-sync';

/**
 * Alberti envanteri senkronizasyonu. Vercel Cron günde bir çağırıyor
 * (bkz. vercel.json).
 *
 * YETKİ
 * Vercel Cron, `CRON_SECRET` tanımlıysa isteğe `Authorization: Bearer ...`
 * başlığı ekliyor. O yoksa uç nokta hiçbir şey yapmıyor — yazma yetkisi olan
 * bir işin herkese açık bir adresten tetiklenebilmesi kabul edilemez.
 *
 * NEDEN SERVICE ROLE ANAHTARI
 * İş, `expires_at`, `store_id` ve rozet sütunlarına yazıyor; bunlar
 * migration_016 ile kullanıcı rollerine kapatıldı. Servis rolü RLS'i ve
 * sütun yetkilerini aşıyor. Anahtar yalnızca burada, yalnızca sunucuda
 * okunuyor ve NEXT_PUBLIC_ önekine sahip DEĞİL — istemci paketine girmez.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Summary = {
  ok: boolean;
  durum: string;
  bayidekiFiyatliArac?: number;
  denenenSayfa?: number;
  basarisizSayfa?: number;
  eklenen?: string[];
  pasifeAlinan?: string[];
  geriAcilan?: string[];
  fiyatiGuncellenen?: string[];
  atlananEkleme?: number;
};

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, durum: 'yetkisiz' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ ok: false, durum: 'yapilandirma eksik' }, { status: 500 });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  let scrape;
  try {
    scrape = await scrapeAll();
  } catch (err) {
    console.error('alberti-sync: tarama basarisiz', err);
    return Response.json({ ok: false, durum: 'tarama basarisiz' }, { status: 502 });
  }

  // Devre kesici: bayinin sitesi sorunluysa her araç fiyatsız görünür ve
  // bütün ilanları pasife almış oluruz. Hiçbir şey yazmadan çık.
  const failureRatio = scrape.attempted ? scrape.failed / scrape.attempted : 1;
  if (scrape.attempted === 0 || failureRatio > SYNC_LIMITS.MAX_FAILURE_RATIO) {
    console.error('alberti-sync: devre kesici', scrape.attempted, scrape.failed);
    return Response.json(
      {
        ok: false,
        durum: 'devre kesici: cok fazla sayfa cekilemedi, hicbir sey yazilmadi',
        denenenSayfa: scrape.attempted,
        basarisizSayfa: scrape.failed,
      } satisfies Summary,
      { status: 503 },
    );
  }

  const { data: store } = await db.from('stores').select('id').eq('slug', ALBERTI_STORE_SLUG).maybeSingle();
  if (!store) return Response.json({ ok: false, durum: 'magaza bulunamadi' }, { status: 500 });

  const { data: rows, error: readError } = await db
    .from('listings')
    .select('id, title, price, photos, expires_at')
    .eq('store_id', store.id);

  if (readError) {
    console.error('alberti-sync: ilanlar okunamadi', readError.message);
    return Response.json({ ok: false, durum: 'ilanlar okunamadi' }, { status: 500 });
  }

  const mine = new Map<string, (typeof rows)[number]>();
  for (const row of rows ?? []) {
    const carId = carIdFromPhotos(row.photos);
    if (carId) mine.set(carId, row);
  }

  const now = Date.now();
  const expiredAt = new Date(now).toISOString();
  const freshUntil = new Date(now + SYNC_LIMITS.EXPIRY_DAYS * 86400000).toISOString();

  const eklenen: string[] = [];
  const pasifeAlinan: string[] = [];
  const geriAcilan: string[] = [];
  const fiyatiGuncellenen: string[] = [];
  let atlananEkleme = 0;

  // 1) Bizde olan ama bayide artık fiyatı olmayan ilanlar -> pasife al.
  //    Silmiyoruz: araç geri gelirse ilan fotoğraflarıyla geri açılıyor.
  for (const [carId, row] of mine) {
    const stillListed = scrape.cars.has(carId);
    const isActive = new Date(row.expires_at).getTime() > now;

    if (!stillListed && isActive) {
      const { error } = await db.from('listings').update({ expires_at: expiredAt }).eq('id', row.id);
      if (error) console.error('alberti-sync: pasife alma basarisiz', row.id, error.message);
      else pasifeAlinan.push(`${carId} · ${row.title}`);
    }
  }

  // 2) Bayide fiyatlı olanlar: yoksa ekle, varsa güncelle / geri aç.
  for (const [carId, car] of scrape.cars) {
    const row = mine.get(carId);

    if (!row) {
      if (eklenen.length >= SYNC_LIMITS.MAX_INSERTS_PER_RUN) {
        atlananEkleme++;
        continue;
      }
      const { error } = await db.from('listings').insert({ ...listingFieldsFor(car), store_id: store.id });
      if (error) console.error('alberti-sync: ekleme basarisiz', carId, error.message);
      else eklenen.push(`${carId} · ${car.title}`);
      continue;
    }

    const patch: Record<string, unknown> = {};
    if (Number(row.price) !== car.price) patch.price = car.price;
    if (new Date(row.expires_at).getTime() <= now) patch.expires_at = freshUntil;

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from('listings').update(patch).eq('id', row.id);
      if (error) {
        console.error('alberti-sync: guncelleme basarisiz', carId, error.message);
      } else {
        if (patch.price !== undefined) fiyatiGuncellenen.push(`${carId} · ${row.price} -> ${car.price} EUR`);
        if (patch.expires_at !== undefined) geriAcilan.push(`${carId} · ${row.title}`);
      }
    }
  }

  const summary: Summary = {
    ok: true,
    durum: 'tamam',
    bayidekiFiyatliArac: scrape.cars.size,
    denenenSayfa: scrape.attempted,
    basarisizSayfa: scrape.failed,
    eklenen,
    pasifeAlinan,
    geriAcilan,
    fiyatiGuncellenen,
    atlananEkleme,
  };
  console.log('alberti-sync:', JSON.stringify(summary));
  return Response.json(summary);
}
