"""remax_listings.sql icindeki RE/MAX CDN adreslerini kendi depomuzunkilerle degistirir.

Fotograflar Supabase Storage'a tasindi. Boylece next.config.ts'e yeni bir
remotePattern eklemeye -- ve onu canliya almak icin deploy beklemeye -- gerek
kalmiyor: Supabase host'u zaten tanimli.

Eslestirme, remax-download-photos.py ile ayni numaralandirmaya dayaniyor:
dosya adi remax-{blok}_{sira}.jpg, blok = SQL'deki bos satirla ayrilmis parca
numarasi. Ayni mantik iki betikte de kullanildigi icin sira birebir tutuyor.
"""
import re

SQL = "supabase/remax_listings.sql"
BASE = ("https://pgpcmzxsxdmffwfddycx.supabase.co"
        "/storage/v1/object/public/listing-photos/")

with open(SQL, encoding="utf-8") as f:
    sql = f.read()

bloklar = sql.strip().split("\n\n")
degisen = 0

for i, blok in enumerate(bloklar, start=1):
    urls = re.findall(r"'(https://cdn\.gryphtech\.com/[^']+)'", blok)
    for j, eski in enumerate(urls, start=1):
        yeni = f"{BASE}remax-{i:02d}_{j:02d}.jpg"
        blok = blok.replace("'" + eski + "'", "'" + yeni + "'")
        degisen += 1
    bloklar[i - 1] = blok

out = "\n\n".join(bloklar) + "\n"
with open(SQL, "w", encoding="utf-8") as f:
    f.write(out)

kalan = len(re.findall(r"cdn\.gryphtech\.com", out))
print("degistirilen adres:", degisen)
print("kalan gryphtech adresi:", kalan)
print("supabase adresi:", len(re.findall(r"supabase\.co/storage", out)))
