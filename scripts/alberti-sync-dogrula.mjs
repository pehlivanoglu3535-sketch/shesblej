/**
 * src/lib/alberti-sync.ts icindeki tarama/ayristirma mantigini gercek siteye
 * karsi calistirir. Veritabanina DOKUNMAZ -- yalnizca ne bulundugunu yazar.
 *
 * Senkronizasyonun riskli kismi ayristirma: fiyat sinyalini yanlis okursak
 * ya satilmis araci satilik tutariz ya da saglam ilanlari pasife aliriz.
 * Bu yuzden dagitmadan once burada dogrulaniyor.
 *
 * Kullanim: node scripts/alberti-sync-dogrula.mjs
 */
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = readFileSync('src/lib/alberti-sync.ts', 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const dir = mkdtempSync(join(tmpdir(), 'alberti-'));
const file = join(dir, 'alberti-sync.mjs');
writeFileSync(file, js);
const mod = await import('file://' + file.replace(/\\/g, '/'));

console.log('sitemap okunuyor...');
const ids = await mod.fetchCarIds();
console.log('sitemap arac sayisi:', ids.length);

console.log('tum detay sayfalari taraniyor (bu biraz surer)...');
const t0 = Date.now();
const { cars, attempted, failed } = await mod.scrapeAll(6);
const saniye = ((Date.now() - t0) / 1000).toFixed(1);

console.log('');
console.log('denenen sayfa :', attempted);
console.log('basarisiz     :', failed, `(oran ${(failed / attempted * 100).toFixed(1)}%)`);
console.log('FIYATLI ARAC  :', cars.size);
console.log('sure          :', saniye, 'sn');

const eksik = [...cars.values()].filter((c) => !c.photos.length || !c.title || !c.price);
console.log('eksik alanli  :', eksik.length);

const ornek = [...cars.values()].slice(0, 3);
console.log('');
console.log('ornekler:');
for (const c of ornek) {
  console.log(
    `  #${c.carId} ${c.title} (${c.year}) — ${c.price} EUR — ${c.mileageKm} km — ` +
      `${c.fuel}/${c.transmission}/${c.bodyType} — ${c.engineCc}cc ${c.powerHp}PS — ${c.photos.length} foto`,
  );
}

// Daha once elle dogrulanmis uc durum: bu uclu bozulursa ayristirma kaymistir.
console.log('');
console.log('kontrol noktalari:');
console.log('  12    (stokta, fiyatli)        ->', cars.has('12') ? `${cars.get('12').price} EUR` : 'YOK');
console.log('  10031 (yeni eklendi)           ->', cars.has('10031') ? `${cars.get('10031').price} EUR` : 'YOK');
console.log('  14    (fiyati cekilmis)        ->', cars.has('14') ? 'HATALI: fiyatli gorunuyor' : 'dogru: listede yok');
console.log('  828   (stoktan cikmis)         ->', cars.has('828') ? 'HATALI: fiyatli gorunuyor' : 'dogru: listede yok');
