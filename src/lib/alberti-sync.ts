/**
 * Auto Salloni Alberti envanteriyle senkronizasyon.
 *
 * NEDEN VAR
 * Partner ilanları bir defa içe aktarılıp bırakılmıştı. 19.10.2026'da elle
 * yapılan kontrolde 57 ilanın 11'i bayinin stoğunda değildi — 9 araç listeden
 * tamamen çıkmış, 2 aracın fiyatı geri çekilmişti. Yani sitemiz satılmış
 * olabilecek araçları satılık gösteriyordu. Bir pazar yeri için bu sadece
 * kötü görünmez, alıcıyı yanıltır.
 *
 * TEK SİNYAL
 * Bir araç sitemizde durmalı ⟺ bayinin detay sayfası sayısal bir
 * `offers.price` yayınlıyor. Ölçüldü:
 *   - stokta ve fiyatlı  -> offers.price = 30500
 *   - fiyatı çekilmiş    -> offers = null
 *   - stoktan çıkmış     -> offers alanı hiç yok
 * Liste sayfası JavaScript ile çiziliyor ve sunucudan yalnız 20 araç
 * veriyor, ama `sitemap.xml` 269 aracın tamamını veriyor ve her detay
 * sayfası sunucu tarafında render ediliyor. Bu yüzden senkronizasyon
 * tarayıcı gerektirmiyor.
 *
 * ASLA SİLMİYOR
 * Stoktan çıkan ilan siliniyor değil, süresi doldurularak pasife alınıyor.
 * Araç geri gelirse ilan da fotoğraflarıyla ve mesaj geçmişiyle geri
 * açılıyor. Geri dönüşü olmayan bir işlemi otomatiğe bağlamak doğru değil.
 */

export const ALBERTI_OWNER_ID = '53b2542a-90da-4355-beaa-e454d375c456';
export const ALBERTI_STORE_SLUG = 'auto-salloni-alberti';
export const ALBERTI_BASE = 'https://autoalberti.com';
const PHONE = '+38344435435';
const CITY = 'Prishtinë';
const DISTRICT = 'Autostrada Prishtinë–Ferizaj';
const DEALER = 'Auto Salloni Alberti';

/** İlan ömrü; src/lib/constants.ts ile aynı olmalı. */
const EXPIRY_DAYS = 29;

/**
 * Tek seferde eklenebilecek ilan sayısı. Bayi envanterine toplu bir yükleme
 * yaparsa ya da ayrıştırma bozulursa sitemizi aniden doldurmasın.
 */
const MAX_INSERTS_PER_RUN = 40;

/**
 * Devre kesici. Çekilen sayfaların bu orandan fazlası başarısızsa hiçbir şey
 * yazılmıyor. Olmasaydı bayinin sitesi bir saat kapalı kaldığında her araç
 * "fiyatsız" görünür ve 57 ilanın hepsi pasife düşerdi.
 */
const MAX_FAILURE_RATIO = 0.15;

export type AlbertiCar = {
  carId: string;
  title: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileageKm: number | null;
  fuel: string | null;
  transmission: string | null;
  engineCc: number | null;
  powerHp: number | null;
  bodyType: string | null;
  colorExterior: string | null;
  price: number;
  photos: string[];
};

const FUEL_ID: Record<string, string> = {
  Diesel: 'diesel', Nafte: 'diesel', 'Naftë': 'diesel',
  Gasoline: 'benzin', Petrol: 'benzin', Benzin: 'benzin',
  Hybrid: 'hibrid', Hibrid: 'hibrid',
  'Plug-in Hybrid': 'hibrid-plug-in',
  Electric: 'elektrik', Elektrik: 'elektrik',
  LPG: 'gaz',
};
const TRANS_ID: Record<string, string> = {
  Automatike: 'automatik', Automatic: 'automatik',
  Manuale: 'manual', Manual: 'manual',
};
const BODY_ID: Record<string, string> = {
  SUV: 'suv', Sedan: 'sedan', Limuzine: 'sedan',
  Hatchback: 'hatchback', Coupe: 'kupe', 'Coupé': 'kupe',
  Kabriolet: 'kabriolet', Cabrio: 'kabriolet',
  Karavan: 'karavan', Van: 'furgon', Pickup: 'pickup', Minivan: 'minivan',
};
const COLOR_ID: Record<string, string> = {
  'E Zezë': 'e-zeze', 'E Bardhë': 'e-bardhe', Gri: 'gri', Argjend: 'argjend',
  'Kaltër': 'kaltert', 'E Kuqe': 'e-kuqe', 'E Gjelbër': 'e-gjelber',
  Kafe: 'kafe', 'Bezhë': 'bezhe',
};

export function albertiDescription(): string {
  return (
    'Automjeti ndodhet në Kosovë dhe mund të shihet në vend.\n' +
    `Adresa: ${DISTRICT}, ${CITY}.\n\n` +
    `Automjet i listuar nga ${DEALER} — partner i ShesBlej.`
  );
}

export function listingFieldsFor(car: AlbertiCar) {
  return {
    owner_id: ALBERTI_OWNER_ID,
    category: 'vasita',
    subcategory: car.bodyType === 'suv' ? 'arazi-suv' : 'otomobil',
    title: car.year ? `${car.title} (${car.year})` : car.title,
    price: car.price,
    city: CITY,
    district: DISTRICT,
    phone: PHONE,
    description: albertiDescription(),
    photos: car.photos,
    brand: car.brand,
    model: car.model,
    year: car.year,
    mileage_km: car.mileageKm,
    fuel: car.fuel,
    engine_cc: car.engineCc,
    power_hp: car.powerHp,
    transmission: car.transmission,
    body_type: car.bodyType,
    color_exterior: car.colorExterior,
  };
}

/** İlanın hangi araca ait olduğunu fotoğraf yolundan okur. Her iki alan adı
 *  da kabul ediliyor: eski ilanlar autosallonialberti.net'e işaret ediyor. */
export function carIdFromPhotos(photos: string[] | null): string | null {
  for (const p of photos ?? []) {
    const m = p.match(/\/assets\/inventory\/(\d+)\//);
    if (m) return m[1];
  }
  return null;
}

async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ShesBlej-sync/1.0 (+https://www.shesblejks.com)' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCarIds(): Promise<string[]> {
  const xml = await fetchText(`${ALBERTI_BASE}/sitemap.xml`, 20000);
  const ids = new Set<string>();
  for (const m of xml.matchAll(/\/cars\/(\d+)\//g)) ids.add(m[1]);
  return [...ids];
}

/** Detay sayfasından araç verisi. Fiyat yoksa null döner — o araç bizim
 *  sitemizde durmamalı demektir. */
export function parseCar(carId: string, htmlText: string): AlbertiCar | null {
  const blocks = [...htmlText.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)];
  let vehicle: Record<string, unknown> | null = null;
  for (const b of blocks) {
    try {
      const parsed: unknown = JSON.parse(b[1]);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const o of arr as Record<string, unknown>[]) {
        if (typeof o?.['@type'] === 'string' && /Vehicle/i.test(o['@type'] as string)) vehicle = o;
      }
    } catch {
      // Tek bir bozuk blok diğerlerini engellemesin.
    }
  }
  if (!vehicle) return null;

  const offers = vehicle.offers as { price?: unknown } | null | undefined;
  const price = typeof offers?.price === 'number' ? offers.price : Number(offers?.price);
  if (!offers || !Number.isFinite(price) || price <= 0) return null;

  // Galerinin tamamı sayfadaki görsel yollarından çıkarılıyor; JSON-LD'deki
  // `image` dizisi yalnızca bir altküme veriyor (ölçüldü: 19 fotoğraflı
  // araçta 5 tane).
  const idx = new Set<number>();
  for (const m of htmlText.matchAll(new RegExp(`/assets/inventory/${carId}/(\\d+)\\.`, 'g'))) {
    idx.add(Number(m[1]));
  }
  const photos = [...idx].sort((a, b) => a - b).map((n) => `${ALBERTI_BASE}/assets/inventory/${carId}/${n}.1600.webp`);
  if (photos.length === 0) return null;

  // Güç JSON-LD'de yok; sayfadaki "Fuqia N PS" satırından. Etiketsiz ilk
  // eşleşmeye düşmek riskli, çünkü "benzer araçlar" bölümü de PS içeriyor.
  const plain = htmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const powerMatch = plain.match(/Fuqia\s+(\d+)\s*PS/i);

  const brand = (vehicle.brand as { name?: string } | undefined)?.name ?? null;
  const km = (vehicle.mileageFromOdometer as { value?: number } | undefined)?.value ?? null;
  const litres = (
    (vehicle.vehicleEngine as { engineDisplacement?: { value?: number } } | undefined)?.engineDisplacement?.value
  ) ?? null;

  return {
    carId,
    title: String(vehicle.name ?? '').trim(),
    brand,
    model: (vehicle.model as string | undefined) ?? null,
    year: (vehicle.vehicleModelDate as number | undefined) ?? null,
    mileageKm: typeof km === 'number' ? km : null,
    fuel: FUEL_ID[String(vehicle.fuelType ?? '')] ?? null,
    transmission: TRANS_ID[String(vehicle.vehicleTransmission ?? '')] ?? null,
    engineCc: typeof litres === 'number' ? Math.round(litres * 1000) : null,
    powerHp: powerMatch ? Number(powerMatch[1]) : null,
    bodyType: BODY_ID[String(vehicle.bodyType ?? '')] ?? null,
    colorExterior: COLOR_ID[String(vehicle.color ?? '')] ?? null,
    price,
    photos,
  };
}

export type ScrapeResult = {
  cars: Map<string, AlbertiCar>;
  attempted: number;
  failed: number;
};

/** Tüm araçları çeker. Eşzamanlılık düşük tutuluyor: bu bizim değil bayinin
 *  sunucusu ve günde bir çalışan bir iş için acele etmenin anlamı yok. */
export async function scrapeAll(concurrency = 6): Promise<ScrapeResult> {
  const ids = await fetchCarIds();
  const cars = new Map<string, AlbertiCar>();
  let failed = 0;

  const queue = [...ids];
  async function worker() {
    for (;;) {
      const id = queue.shift();
      if (!id) return;
      try {
        const html = await fetchText(`${ALBERTI_BASE}/cars/${id}/`);
        const car = parseCar(id, html);
        if (car) cars.set(id, car);
      } catch {
        failed++;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  return { cars, attempted: ids.length, failed };
}

export const SYNC_LIMITS = { MAX_INSERTS_PER_RUN, MAX_FAILURE_RATIO, EXPIRY_DAYS };
