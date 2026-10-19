/**
 * Bizdeki Alberti ilanlarindan bayinin artik fiyat yayinlamadiklarini bulur.
 * Hicbir sey yazmaz -- yalnizca listeyi ve pasife alma SQL'ini basar.
 *
 * Kullanim: node scripts/alberti-bayat-bul.mjs
 */
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STORE_ID = '13cb25d7-9e66-4556-a292-e2d86a8f3df5';

// --- senkronizasyon mantigini oldugu gibi kullan ---
const js = ts.transpileModule(readFileSync('src/lib/alberti-sync.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dir = mkdtempSync(join(tmpdir(), 'alberti-'));
const file = join(dir, 'm.mjs');
writeFileSync(file, js);
const mod = await import('file://' + file.split('\\').join('/'));

const { cars, attempted, failed } = await mod.scrapeAll(6);
if (!attempted || failed / attempted > 0.15) {
  console.error('tarama guvenilir degil, cikiliyor:', attempted, failed);
  process.exit(1);
}

// --- bizdeki ilanlar ---
const env = readFileSync('.env.local', 'utf8');
const pick = (k) => env.match(new RegExp('^' + k + '=(.*)$', 'm'))[1].trim();
const URL_ = pick('NEXT_PUBLIC_SUPABASE_URL');
const KEY = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const res = await fetch(
  `${URL_}/rest/v1/listings?select=id,title,photos,expires_at&store_id=eq.${STORE_ID}&limit=300`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const ours = await res.json();

const now = Date.now();
const stale = [];
for (const row of ours) {
  const carId = mod.carIdFromPhotos(row.photos);
  if (!carId) continue;
  const aktif = new Date(row.expires_at).getTime() > now;
  if (!cars.has(carId) && aktif) stale.push({ carId, id: row.id, title: row.title });
}

console.log('bayide fiyatli arac :', cars.size);
console.log('bizdeki ilan        :', ours.length);
console.log('PASIFE ALINACAK     :', stale.length);
console.log('');
for (const s of stale.sort((a, b) => Number(a.carId) - Number(b.carId))) {
  console.log(`  #${s.carId}  ${s.title}`);
}

if (stale.length) {
  const ids = stale.map((s) => `'${s.id}'`).join(', ');
  writeFileSync(
    'supabase/alberti_bayat_pasife.sql',
    '-- Bayinin stogunda olmayan / fiyati cekilen Alberti ilanlari.\n' +
      '-- Silinmiyor, suresi doldurularak pasife aliniyor: arac geri gelirse\n' +
      '-- ilan fotograflariyla ve mesaj gecmisiyle geri acilabiliyor.\n' +
      `update public.listings set expires_at = now()\nwhere id in (${ids});\n`,
    'utf8',
  );
  console.log('\nyazildi: supabase/alberti_bayat_pasife.sql');
}
