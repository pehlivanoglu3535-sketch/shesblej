"""Auto Salloni Alberti envanterinden fiyati yayinlanmis araclari ilana cevirir.

KAYNAK
19.10.2026'da bayi autosallonialberti.net'ten autoalberti.com'a tasindi.
Eski alan adi 301 ile yonlendiriyor, ama yeni fotograflar dogrudan yeni
adrese yaziliyor.

Her arac sayfasi schema.org Vehicle verisi yayinliyor. Onceki surume gore
veri zenginlesti: artik bodyType, color ve motor hacmi de var.

FIYAT KURALI DEGISMEDI
Stokta 218 arac var, yalnizca 46'sinda fiyat yayinlanmis. Fiyati olmayan
ilan "ASK FOR PRICE" gosteriyor; sitemizde fiyat zorunlu ve 0 EUR yazmak
alicida yanlis beklenti yaratir, bu yuzden fiyatsizlar alinmiyor.

FOTOGRAF NEREDEN
Liste sayfasindaki kartin `data-gal` ozniteligi yalnizca bes karelik bir
ornek veriyor (ustelik karisik sirada) -- galerinin tamami degil. Tam liste
detay sayfasindan cikariliyor. Guc bilgisi de JSON-LD'de yok, detay
sayfasindaki "Fuqia N PS" satirindan aliniyor.

GIRDI
scripts/alberti-yeni-data.json -- tarayicidan cikarilan, bizde olmayan ve
fiyati yayinlanmis araclar. Taramanin kendisi tarayicida yapiliyor: site
JavaScript ile ciziliyor ve 218 detay sayfasinin tamamini sunucu tarafindan
cekmek bayinin sitesine gereksiz yuk bindirirdi.

CIKTI
supabase/alberti_yeni_listings.sql
"""
import json
import io

OWNER = "53b2542a-90da-4355-beaa-e454d375c456"
STORE_SLUG = "auto-salloni-alberti"
PHONE = "+38344435435"
CITY = "Prishtinë"
DISTRICT = "Autostrada Prishtinë–Ferizaj"
IMG = "https://autoalberti.com/assets/inventory/"
DEALER = "Auto Salloni Alberti"

# Kaynak adlarindan uygulamanin kimliklerine (src/lib/vehicle.ts).
FUEL_ID = {
    "Diesel": "diesel", "Nafte": "diesel", "Naftë": "diesel",
    "Gasoline": "benzin", "Petrol": "benzin", "Benzin": "benzin",
    "Hybrid": "hibrid", "Hibrid": "hibrid",
    "Plug-in Hybrid": "hibrid-plug-in",
    "Electric": "elektrik", "Elektrik": "elektrik",
    "LPG": "gaz",
}
TRANS_ID = {
    "Automatike": "automatik", "Automatic": "automatik",
    "Manuale": "manual", "Manual": "manual",
}
BODY_ID = {
    "SUV": "suv", "Sedan": "sedan", "Limuzine": "sedan",
    "Hatchback": "hatchback", "Coupe": "kupe", "Coupé": "kupe",
    "Kabriolet": "kabriolet", "Cabrio": "kabriolet",
    "Karavan": "karavan", "Van": "furgon", "Pickup": "pickup",
    "Minivan": "minivan",
}
COLOR_ID = {
    "E Zezë": "e-zeze", "E Bardhë": "e-bardhe", "Gri": "gri",
    "Argjend": "argjend", "Kaltër": "kaltert", "E Kuqe": "e-kuqe",
    "E Gjelbër": "e-gjelber", "Kafe": "kafe", "Bezhë": "bezhe",
}
# Alt kategori: yalniz kasa tipi SUV olanlar arazi-suv.
SUB_FROM_BODY = {"suv": "arazi-suv"}


def sql_str(v):
    return "'" + str(v).replace("'", "''") + "'"


def sql_null(v):
    return "null" if v in (None, "") else sql_str(v)


def sql_num(v):
    return "null" if v is None else str(int(v))


def money(n):
    """Binlik ayraci nokta. Yalniz sayiya uygulaniyor -- tum cumlede virgul
    degistirmek aciklamanin kendi noktalamasini bozuyor."""
    return f"{int(n):,}".replace(",", ".")


cars = json.load(io.open("scripts/alberti-yeni-data.json", encoding="utf-8"))

statements = []
summary = []

for c in cars:
    body = BODY_ID.get(c.get("kasa") or "", None)
    sub = SUB_FROM_BODY.get(body, "otomobil")
    photos = [f"{IMG}{c['id']}/{n}.1600.webp" for n in c["fotoIndeks"]]
    if not photos:
        continue

    # Aciklamada kunye satiri YOK: o alanlarin hepsi kendi sutununda duruyor
    # ve metinde de birakmak ilan sayfasinda ayni bilgiyi iki kez gosteriyor
    # (bkz. migration_014).
    desc = (
        "Automjeti ndodhet në Kosovë dhe mund të shihet në vend.\n"
        f"Adresa: {DISTRICT}, {CITY}.\n\n"
        f"Automjet i listuar nga {DEALER} — partner i ShesBlej."
    )

    arr = "ARRAY[" + ", ".join(sql_str(p) for p in photos) + "]::text[]"
    model = c.get("model") or c["ad"]

    statements.append(
        "insert into public.listings (owner_id, store_id, category, subcategory,"
        " title, price, city, district, phone, description, photos, brand, model,"
        " year, mileage_km, fuel, engine_cc, power_hp, transmission, body_type,"
        " color_exterior) values ("
        + ", ".join([
            sql_str(OWNER),
            f"(select id from public.stores where slug = {sql_str(STORE_SLUG)})",
            sql_str("vasita"), sql_str(sub),
            sql_str(f"{c['ad']} ({c['yil']})"),
            str(int(c["fiyat"])),
            sql_str(CITY), sql_str(DISTRICT), sql_str(PHONE),
            sql_str(desc), arr,
            sql_null(c.get("marka")),
            sql_null(model),
            sql_num(c.get("yil")),
            sql_num(c.get("km")),
            sql_null(FUEL_ID.get(c.get("yakit") or "")),
            sql_num(int(c["litre"] * 1000) if c.get("litre") else None),
            sql_num(c.get("guc")),
            sql_null(TRANS_ID.get(c.get("vites") or "")),
            sql_null(body),
            sql_null(COLOR_ID.get(c.get("renk") or "")),
        ]) + ");"
    )
    summary.append((c["ad"], int(c["fiyat"]), len(photos), sub, c["id"]))

out = "supabase/alberti_yeni_listings.sql"
io.open(out, "w", encoding="utf-8", newline="\n").write("\n\n".join(statements) + "\n")

for ad, fiyat, nfoto, sub, cid in summary:
    print("  %-40s %7s EUR  %2d foto  %-10s #%s" % (ad[:40], money(fiyat), nfoto, sub, cid))
print()
print("yazildi:", out)
print("ilan:", len(summary), "| fotograf:", sum(s[2] for s in summary))
