"""Encar (Kore ihracat envanteri) araclarini ShesBlej ilanina cevirir.

Encar fiyatlari FOB USD'dir; sitemiz EUR gosteriyor. Kuru burada tek yerde
tutuyoruz ki degistirmek kolay olsun, ve donusturulmus fiyatin yaninda
orijinal USD tutari da aciklamaya yaziliyor -- alici neye baktigini gorsun.
"""
OWNER = "53b2542a-90da-4355-beaa-e454d375c456"
PHONE = "+38349154218"
CITY = "Prishtinë"
USD_TO_EUR = 0.92  # yaklasik; aciklamada orijinal USD de yaziyor

# (marka, baslik, alt_kategori, km, yakit, usd, gorsel)
CARS = [
    ("BMW", "BMW 5-Series (G60) 520i M Sport", "otomobil", "9.934", "Benzin", 45390,
     "carpicture02/pic4242/42424422_001.jpg"),
    ("BMW", "BMW 3-Series (G20) 320i M Sport", "otomobil", "9.115", "Benzin", 27970,
     "carpicture07/pic4247/42475521_001.jpg"),
    ("BMW", "BMW X5 (G05) xDrive30d M Sport", "arazi-suv", "5.080", "Diesel", 95950,
     "carpicture04/pic4214/42143073_001.jpg"),
    ("BMW", "BMW X6 (G06) xDrive40d M Sport", "arazi-suv", "6.977", "Diesel", 98830,
     "carpicture03/pic4233/42337568_001.jpg"),
    ("BMW", "BMW i5 (G60) xDrive40 M Sport", "otomobil", "22.724", "Elektrik", 56090,
     "carpicture10/pic4260/42604126_001.jpg"),

    ("Mercedes-Benz", "Mercedes-Benz S-Class (W223) S450 4MATIC", "otomobil", "2.124", "Benzin", 90050,
     "carpicture09/pic4239/42393284_001.jpg"),
    ("Mercedes-Benz", "Mercedes-Benz GLC-Class (X254) GLC300 4MATIC Avantgarde Coupe", "arazi-suv", "6.780", "Benzin", 59780,
     "carpicture01/pic4271/42715413_027.jpg"),

    ("Hyundai", "Hyundai Santa Fe (MX5) 2.5T 2WD Calligraphy", "arazi-suv", "24.100", "Benzin", 27230,
     "carpicture03/pic4273/42735966_001.jpg"),
    ("Hyundai", "Hyundai Palisade (LX3) HEV 2.5T 4WD 9-vendëshe Calligraphy", "arazi-suv", "3.819", "Hibrid", 45390,
     "carpicture03/pic4273/42734234_027.jpg"),
    ("Hyundai", "Hyundai Grandeur (GN7) 2.5 2WD Exclusive", "otomobil", "34.588", "Benzin", 25760,
     "carpicture05/pic4275/42758902_001.jpg"),

    ("Kia", "Kia Seltos 1.6 Turbo 2WD Signature", "arazi-suv", "16.550", "Benzin", 21030,
     "carpicture05/pic4265/42659275_027.jpg"),
    ("Kia", "Kia Sportage 1.6 Turbo 2WD Signature X Line", "arazi-suv", "17.753", "Benzin", 31220,
     "carpicture03/pic4243/42430028_027.jpg"),
    ("Kia", "Kia Tasman 2.5T 4WD Adventure", "ticari", "9.929", "Benzin", 29450,
     "carpicture09/pic4259/42594238_001.jpg"),
    ("Kia", "Kia Ray Signature", "otomobil", "32.294", "Benzin", 12470,
     "carpicture08/pic4268/42688509_001.jpg"),
]

BASE = "https://ci.encar.com/carpicture/"


def sql_str(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


rows = []
for brand, title, sub, km, fuel, usd, img in CARS:
    eur = int(round(usd * USD_TO_EUR / 10) * 10)
    # Binlik ayraci nokta olsun diye tum virgulleri degistirmek cumle
    # noktalamasini da bozuyordu; sadece sayilari bicimlendiriyoruz.
    eur_s = f"{eur:,}".replace(",", ".")
    usd_s = f"{usd:,}".replace(",", ".")
    desc = (
        f"IMPORT NGA KOREA E JUGUT — inventar zyrtar Encar.\n\n"
        f"Kilometrazhi: {km} km\n"
        f"Karburanti: {fuel}\n"
        f"Lokacioni aktual: Kore e Jugut\n\n"
        f"Çmimi i treguar është orientues: {eur_s} € (FOB Kore, {usd_s} USD).\n"
        f"NUK përfshin transportin detar, doganën, TVSH-në dhe regjistrimin në Kosovë.\n\n"
        f"Automjeti nuk ndodhet në Kosovë — sillet me porosi. "
        f"Na kontaktoni për ofertë të plotë me të gjitha kostot dhe afatin e dorëzimit."
    )

    # photos sutunu text[] -- Postgres dizi literali gerekiyor, jsonb degil.
    photos = "ARRAY[" + sql_str(BASE + img) + "]::text[]"
    rows.append(
        "  (" + ", ".join([
            sql_str(OWNER), sql_str("vasita"), sql_str(sub),
            sql_str("[IMPORT KORE] " + title), str(eur), sql_str(CITY),
            sql_str(PHONE), sql_str(desc), photos, sql_str(brand),
        ]) + ")"
    )

sql = (
    "insert into public.listings\n"
    "  (owner_id, category, subcategory, title, price, city, phone, description, photos, brand)\n"
    "values\n" + ",\n".join(rows) + "\n"
    "returning id, brand, title, price;\n"
)

out = "supabase/encar_listings.sql"
open(out, "w", encoding="utf-8").write(sql)
print("yazildi:", out)
print("ilan sayisi:", len(CARS))
for b in ("BMW", "Mercedes-Benz", "Hyundai", "Kia"):
    print("  %-14s %d" % (b, sum(1 for c in CARS if c[0] == b)))
