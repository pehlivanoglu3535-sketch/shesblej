"""RE/MAX Kosova ilanlarini ShesBlej emlak ilanina cevirir.

Veri, sitenin kendi arama ucundan geliyor (Azure Search). Kayit basina tum
fotograf listesi, Arnavutca aciklama, fiyat, alan ve konum mevcut.

Kullanim:
    python scripts/remax-listings.py              # canli uctan ceker
    python scripts/remax-listings.py rx.json      # kaydedilmis yaniti kullanir

Ikinci bicim, dis aga cikisin engellendigi ortamlar icin: tarayicidan alinmis
ham yanit dosyasi ayni sekilde islenir.

Disarida birakilanlar ve nedenleri:
  - ListingStatusUID != 160 : 160 disindaki kayitlar aktif olmayan/satilmis
    ilanlar (kartlarda "Shitur" etiketi bunlarda cikiyor). Satilmis bir mulku
    yayinlamak alicilari yaniltir.
  - HidePricePublic / fiyat 0 : sitemiz fiyati zorunlu tutuyor ve 0 EUR olarak
    gosterirdi. "Cmimi sipas kerkeses" destegi eklenene kadar bunlar atlaniyor.
  - Province bilinmeyen : sehir alanini dogru dolduramayiz.
"""
import html
import json
import re
import sys
import urllib.request

OWNER = "53b2542a-90da-4355-beaa-e454d375c456"
PHONE = "+38349154218"
IMG = "https://cdn.gryphtech.com/userimages/128/Large/"
MAX_PHOTOS = 20

URL = "https://www.remax-kosovo.com/search/listing-search/docs/search"

# Province -> sitemizdeki sehir adi
CITY_MAP = {
    "Prishtinë": "Prishtinë",
    "Gjakovë": "Gjakovë",
    "Prizren": "Prizren",
    "Pejë": "Pejë",
    "Mitrovica": "Mitrovicë",
    "Gjilan": "Gjilan",
    "Vushtrria": "Vushtrri",
    "Fushë Kosova": "Fushë Kosovë",
}

RESIDENTIAL = {"banese", "banese-kondominium", "penthouse", "shtepi-private",
               "shtepi-me-tarrace", "villa"}
COMMERCIAL = {"zyre", "dyqan", "hotel", "ndertese-industriale", "lokal"}
LAND = {"parcele", "truall", "ferme", "toke"}

TYPE_NAME = {
    "banese": "Banesë", "banese-kondominium": "Banesë", "penthouse": "Penthouse",
    "shtepi-private": "Shtëpi private", "shtepi-me-tarrace": "Shtëpi me tarracë",
    "villa": "Villa", "zyre": "Zyrë", "dyqan": "Dyqan", "hotel": "Hotel",
    "ndertese-industriale": "Ndërtesë industriale", "parcele": "Parcelë",
    "truall": "Truall", "ferme": "Fermë",
}


def fetch():
    body = json.dumps({"search": "*", "count": True, "top": 100,
                       "filter": "content/CountryID eq 128"}).encode()
    req = urllib.request.Request(
        URL, data=body,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def load(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def slug_type(c):
    link = next((s["ShortLink"] for s in c.get("ShortLinks") or []
                 if s.get("ISOLanguageCode") == "sq"), "")
    parts = link.split("/")
    return (parts[2] if len(parts) > 3 else ""), link


# RE/MAX aciklamalarinin sonunda kendi satis temsilcisinin cep numarasi var.
# Ilan bizim sitemizde bizim telefonumuzla yayinlaniyor; ayni sayfada iki ayri
# numara birakmak alicida hangisini arayacagi konusunda tereddut yaratir, o
# yuzden bu blok kesiliyor. Kaynak, ayri bir satirla acikca belirtiliyor.
AGENT_BLOCK = re.compile(
    r"\n[^\n]*(?:kontaktoni agjentin|Për më shumë informata)[^\n]*(?:\n[^\n]*)*\Z",
    re.IGNORECASE)
PHONE_LINE = re.compile(r"^[^\n]*(?:\+383|\b0[45][0-9][ \-/]?[0-9]{3})[^\n]*$", re.MULTILINE)

SOURCE_NOTE = "Pronë e listuar nga RE/MAX Kosova — partner i ShesBlej."


def clean(raw_html: str) -> str:
    t = re.sub(r"<br\s*/?>", "\n", raw_html or "")
    t = re.sub(r"<[^>]+>", "", t)
    # Aciklamalar zengin metin alanindan geliyor: "125.000&euro;" gibi HTML
    # varliklari duz metne cevrilmezse ilanda oldugu gibi gorunur.
    t = html.unescape(t)
    t = t.replace("\r", "")
    t = AGENT_BLOCK.sub("", t)
    t = PHONE_LINE.sub("", t)
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def sql_str(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


def photo_urls(c):
    """Fotograflari yayin sirasina gore dizer.

    ListingImages dizisi kaynakta sirali degil: ilk eleman cogu ilanda Order=14
    gibi bir kare oluyor. Kapak karesinin dogru cikmasi icin Order alanina gore
    siralamak sart.
    """
    imgs = sorted((c.get("ListingImages") or []),
                  key=lambda im: int(im.get("Order") or 0))
    return [IMG + im["FileName"] for im in imgs][:MAX_PHOTOS]


raw = load(sys.argv[1]) if len(sys.argv) > 1 else fetch()
rows = [v["content"] for v in raw["value"]]
statements = []
atlanan = {"durum": 0, "fiyat": 0, "sehir": 0, "tip": 0, "fotosuz": 0}
alinan = []

for c in rows:
    if c.get("ListingStatusUID") != 160:
        atlanan["durum"] += 1
        continue
    price = int(c.get("ListingPriceEuro") or 0)
    if c.get("HidePricePublic") or price <= 0:
        atlanan["fiyat"] += 1
        continue
    city = CITY_MAP.get((c.get("Province") or "").strip())
    if not city:
        atlanan["sehir"] += 1
        continue

    tip, link = slug_type(c)
    kira = c.get("TransactionTypeUID") == 260
    if tip in LAND:
        sub = "arsa"
    elif tip in COMMERCIAL:
        sub = "kiralik-isyeri" if kira else "satilik-isyeri"
    elif tip in RESIDENTIAL:
        sub = "kiralik-daire" if kira else "satilik-daire"
    else:
        atlanan["tip"] += 1
        continue

    semt = (c.get("City") or "").strip()
    alan = c.get("TotalArea") or 0
    ad = TYPE_NAME.get(tip, "Pronë")
    baslik = ad + (f" {alan:g}m²" if alan else "") + (f" — {semt}" if semt else "")
    baslik = baslik[:200]

    sq = next((x["Description"] for x in c.get("ListingDescriptions") or []
               if x.get("ISOLanguageCode") == "sq" and x.get("DescriptionTypeUID") == "629"), "")
    desc = clean(sq)
    detay = []
    if alan:
        detay.append(f"Sipërfaqja: {alan:g} m²")
    if c.get("NumberOfBedrooms"):
        detay.append(f"Dhoma gjumi: {c['NumberOfBedrooms']}")
    if c.get("NumberOfBathrooms"):
        detay.append(f"Banjo: {c['NumberOfBathrooms']}")
    if detay:
        desc = "\n".join(detay) + ("\n\n" + desc if desc else "")
    if kira:
        desc = "ME QIRA\n\n" + desc
    desc = (desc + "\n\n" + SOURCE_NOTE)[:5000]

    photos = photo_urls(c)
    if not photos:
        atlanan["fotosuz"] += 1
        continue
    arr = "ARRAY[" + ", ".join(sql_str(p) for p in photos) + "]::text[]"

    statements.append(
        "insert into public.listings (owner_id, category, subcategory, title, price, city, district, phone, description, photos) values ("
        + ", ".join([
            sql_str(OWNER), sql_str("emlak"), sql_str(sub), sql_str(baslik),
            str(price), sql_str(city), sql_str(semt), sql_str(PHONE),
            sql_str(desc), arr,
        ]) + ");"
    )
    alinan.append((baslik, city, sub, price, len(photos)))

out = "supabase/remax_listings.sql"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n\n".join(statements) + "\n")

print("yazildi:", out)
print("alinan ilan:", len(alinan), "/", len(rows))
print("atlananlar :", atlanan)
print()
for b, city, sub, p, n in alinan:
    print("  %-46s %-11s %-15s %8d EUR  %2d foto" % (b[:46], city, sub, p, n))
