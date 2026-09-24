"""14 Encar ilaninin tum temiz fotograflarini yuksek cozunurlukte toplar ve
listings.photos alanini guncelleyen SQL uretir.

Iki karar burada kodlanmis:

1) Cozunurluk: parametresiz URL 640x360 donuyor. ?impolicy=widthRate&rw=1200
   kaynagin tam boyutunu (2200x1238) veriyor, o yuzden her URL'ye ekleniyor.

2) Marka filigrani: Encar'in studyo dis cekimleri (_001.._004) sag ustte
   "Trust Encar" filigrani ve plakada Encar yazisi tasiyor; _027 ise turuncu
   zeminli tanitim gorseli. Bunlar bizim ilanimizda baska bir firmanin
   reklamini yapar, o yuzden disarida birakiliyor.
"""
import time
import urllib.request

BASE = "https://ci.encar.com/carpicture/"
HQ = "?impolicy=widthRate&rw=1200"
UA = {"User-Agent": "Mozilla/5.0"}

# Sadece kosedeki Encar filigranini tasiyan kareler cikariliyor. Aracin uzerindeki
# kirmizi Encar plakasi gibi sahne icindeki yazilar sorun degil -- kullanici boyle
# istedi. Bes ilanin kontak sayfasi gozle incelendi:
#   _001.._004  studyo dis cekimleri -- sag ustte filigran
#   _027        turuncu zeminli tanitim karesi -- ayni filigran
BRANDED = {1, 2, 3, 4, 27}

# Bazi ilanlarda filigran fazladan bir karede daha cikiyor.
EXTRA_BRANDED = {
    "42475521": {24},   # BMW 3-Series: bagaj acik dis cekimde sag ustte filigran
}
MAX_PER_LISTING = 20

CARS = [
    ("42424422", "carpicture02/pic4242", "BMW 5-Series (G60) 520i M Sport"),
    ("42475521", "carpicture07/pic4247", "BMW 3-Series (G20) 320i M Sport"),
    ("42143073", "carpicture04/pic4214", "BMW X5 (G05) xDrive30d M Sport"),
    ("42337568", "carpicture03/pic4233", "BMW X6 (G06) xDrive40d M Sport"),
    ("42604126", "carpicture10/pic4260", "BMW i5 (G60) xDrive40 M Sport"),
    ("42393284", "carpicture09/pic4239", "Mercedes-Benz S-Class (W223) S450 4MATIC"),
    ("42715413", "carpicture01/pic4271", "Mercedes-Benz GLC-Class (X254) GLC300 4MATIC Avantgarde Coupe"),
    ("42735966", "carpicture03/pic4273", "Hyundai Santa Fe (MX5) 2.5T 2WD Calligraphy"),
    ("42734234", "carpicture03/pic4273", "Hyundai Palisade (LX3) HEV 2.5T 4WD 9-vendëshe Calligraphy"),
    ("42758902", "carpicture05/pic4275", "Hyundai Grandeur (GN7) 2.5 2WD Exclusive"),
    ("42659275", "carpicture05/pic4265", "Kia Seltos 1.6 Turbo 2WD Signature"),
    ("42430028", "carpicture03/pic4243", "Kia Sportage 1.6 Turbo 2WD Signature X Line"),
    ("42594238", "carpicture09/pic4259", "Kia Tasman 2.5T 4WD Adventure"),
    ("42688509", "carpicture08/pic4268", "Kia Ray Signature"),
]


def exists(url: str) -> bool:
    req = urllib.request.Request(url, headers=UA, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except Exception:
        return False


def sql_str(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


statements = []
summary = []

for car_id, prefix, title in CARS:
    skip = BRANDED | EXTRA_BRANDED.get(car_id, set())
    found = []
    miss = 0
    for idx in range(1, 41):
        if len(found) >= MAX_PER_LISTING:
            break
        url = f"{BASE}{prefix}/{car_id}_{idx:03d}.jpg"
        if exists(url):
            miss = 0
            if idx not in skip:
                found.append(url + HQ)
        else:
            miss += 1
            # numaralandirmada boşluklar var (orn. 011-014 yok); ilk boslukta
            # durmayip arka arkaya 8 bosluk gorunce bitiriyoruz.
            if miss >= 8 and found:
                break
        time.sleep(0.05)

    summary.append((title, len(found)))
    if not found:
        continue

    arr = "ARRAY[" + ", ".join(sql_str(u) for u in found) + "]::text[]"
    statements.append(
        "update public.listings set photos = " + arr
        + " where title = " + sql_str("[IMPORT KORE] " + title) + ";"
    )

out = "supabase/encar_photos_update.sql"
open(out, "w", encoding="utf-8").write("\n\n".join(statements) + "\n")

print("yazildi:", out)
print()
total = 0
for title, n in summary:
    total += n
    print("  %-60s %2d foto" % (title[:60], n))
print()
print("toplam fotograf:", total)
