"""Encar'dan ikinci parti araclari ilana cevirir (fotograflariyla birlikte).

Ilk parti (encar-listings.py + encar-photos.py) iki asamaliydi: once ilanlar
eklenip sonra fotograflar UPDATE ile yaziliyordu. Bu betik ikisini birlestiriyor
-- her arac icin fotograflar toplanip dogrudan INSERT'e konuyor. Boylece yarim
kalmis, fotografsiz ilan riski yok.

Araclar global.encar.com ana sayfasindan okundu. Kart uzerinde ne varsa o:
baslik, kilometre, yakit, sehir ve USD fiyat. Uydurma alan yok.

FIYAT
Encar FOB USD gosteriyor, sitemiz EUR. Kur tek yerde; aciklamada orijinal USD
de yaziliyor ki alici neye baktigini gorsun. Fiyatin nakliye/gumruk/KDV
icermedigi ve aracin Kosova'da olmadigi aciklamada acikca belirtiliyor --
alicinin yanlis beklentiye girmemesi icin.

FOTOGRAF
_027 disarida: o bir arac fotografi degil, turuncu zeminli tanitim karti.
Filigranli studyo dis cekimleri (_001.._004) dahil; aracin tamamini gosteren
tek kareler onlar ve kullanici filigrani kabul etti.
"""
import time
import urllib.request

OWNER = "53b2542a-90da-4355-beaa-e454d375c456"
PHONE = "+38349154218"
CITY = "Prishtinë"
USD_TO_EUR = 0.92

BASE = "https://ci.encar.com/carpicture/"
HQ = "?impolicy=widthRate&rw=1200"
UA = {"User-Agent": "Mozilla/5.0"}
BRANDED = {27}
MAX_PER_LISTING = 20
COVER_INDEX = 1

# Yakit adlari Arnavutcaya cevriliyor; ilk partideki adlandirmayla ayni.
FUEL = {
    "Gasoline": "Benzin",
    "Diesel": "Diesel",
    "EV": "Elektrik",
    "Gasoline Hybrid": "Hibrid",
    "LPG": "LPG",
}

# (id, gorsel_yolu, marka, baslik, alt_kategori, km, yakit, sehir, usd)
CARS = [
    ("41444983", "carpicture04/pic4144", "BMW", "BMW 5-Series (G60) 530i xDrive M Sport", "otomobil", "7.022", "Gasoline", "Seoul", 57490),
    ("42662887", "carpicture06/pic4266", "BMW", "BMW X6 (G06) xDrive40d M Sport", "arazi-suv", "4.154", "Diesel", "Gyeonggi", 100310),
    ("42268888", "carpicture06/pic4226", "BMW", "BMW 2 Series Gran Coupe (F74) M235 xDrive", "otomobil", "6.504", "Gasoline", "Gyeonggi", 35650),
    ("42343203", "carpicture04/pic4234", "BMW", "BMW 3-Series (G20) 320i M Sport", "otomobil", "13.172", "Gasoline", "South Chungcheong", 34980),
    ("42313921", "carpicture01/pic4231", "BMW", "BMW 2-Series Active Tourer (U06) 218d Luxury", "otomobil", "15.997", "Diesel", "Gyeonggi", 26490),
    ("42330240", "carpicture03/pic4233", "BMW", "BMW 3-Series (G20) 320i M Sport", "otomobil", "22.239", "Gasoline", "South Chungcheong", 35060),
    ("42330259", "carpicture03/pic4233", "BMW", "BMW 3-Series (G20) 320i M Sport", "otomobil", "10.044", "Gasoline", "South Chungcheong", 34980),
    ("42386489", "carpicture08/pic4238", "BMW", "BMW M2 (G87) M2 Coupe", "otomobil", "9.027", "Gasoline", "Seoul", 58970),

    ("42468814", "carpicture06/pic4246", "Mercedes-Benz", "Mercedes-Benz CLE-Class (C236) CLE200 Coupe", "otomobil", "2.898", "Gasoline", "Gyeonggi", 47160),
    ("42779203", "carpicture07/pic4277", "Mercedes-Benz", "Mercedes-Benz E-Class (W214) E200 Avantgarde", "otomobil", "4.061", "Gasoline", "Gyeonggi", 42730),
    ("42554219", "carpicture05/pic4255", "Mercedes-Benz", "Mercedes-Benz GLC-Class (X254) GLC300 4MATIC Coupe", "arazi-suv", "10.704", "Gasoline", "Gyeonggi", 58900),
    ("42531637", "carpicture03/pic4253", "Mercedes-Benz", "Mercedes-Benz GLC-Class (X254) GLC300 4MATIC Coupe", "arazi-suv", "15.570", "Gasoline", "Gyeonggi", 56090),

    ("42243479", "carpicture04/pic4224", "Hyundai", "Hyundai Staria L3.5 Cargo 3-vendëshe Modern", "ticari", "16.141", "LPG", "Busan", 22800),
    ("42731000", "carpicture03/pic4273", "Hyundai", "Hyundai Avante Hybrid (CN7) Inspiration", "otomobil", "10.887", "Gasoline Hybrid", "Gyeonggi", 21400),
    ("42725383", "carpicture02/pic4272", "Hyundai", "Hyundai Avante Hybrid (CN7) Inspiration", "otomobil", "13.818", "Gasoline Hybrid", "Incheon", 19780),
    # 42685437 (Tucson Hybrid) disarida: Encar'da yalniz tek kullanilabilir
    # fotografi var (_001 ve tanitim karti _027). 20 fotografli ilanlarin yaninda
    # tek kareli bir ilan zayif duruyor.
    ("42311767", "carpicture01/pic4231", "Hyundai", "Hyundai Sonata The Edge (DN8) 2.0 Premium", "otomobil", "56", "Gasoline", "Seoul", 29150),

    ("41701859", "carpicture10/pic4170", "Kia", "Kia K8 3.5 Gasoline 2WD Signature", "otomobil", "11.342", "Gasoline", "Gyeonggi", 27670),
    ("42612147", "carpicture01/pic4261", "Kia", "Kia Seltos 1.6T 4WD Signature", "arazi-suv", "24", "Gasoline", "Gyeonggi", 29510),
    ("42220297", "carpicture02/pic4222", "Kia", "Kia Morning (JA) Signature", "otomobil", "11.310", "Gasoline", "Incheon", 12320),
    ("42588494", "carpicture08/pic4258", "Kia", "Kia PV5 Cargo Long Range Basic", "ticari", "23.277", "EV", "Seoul", 26490),
    ("42715868", "carpicture01/pic4271", "Kia", "Kia Ray Signature X Line", "otomobil", "7.162", "Gasoline", "Incheon", 15350),
    ("42747406", "carpicture04/pic4274", "Kia", "Kia Carnival HEV 9-vendëshe Noblesse", "arazi-suv", "34.107", "Gasoline Hybrid", "Gyeonggi", 31000),
    ("40940624", "carpicture04/pic4094", "Kia", "Kia Tasman 2.5T 4WD Extreme", "ticari", "13.629", "Gasoline", "Gyeonggi", 32770),
]


def exists(url: str) -> bool:
    req = urllib.request.Request(url, headers=UA, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200
    except Exception:
        return False


def photos_for(car_id: str, prefix: str) -> list[str]:
    found: list[str] = []
    miss = 0
    for idx in range(1, 41):
        if len(found) >= MAX_PER_LISTING:
            break
        url = f"{BASE}{prefix}/{car_id}_{idx:03d}.jpg"
        if exists(url):
            miss = 0
            if idx not in BRANDED:
                found.append(url + HQ)
        else:
            miss += 1
            # Numaralandirmada bosluklar var; ilk boslukta durmuyoruz.
            if miss >= 8 and found:
                break
        time.sleep(0.05)

    cover = next((u for u in found if f"_{COVER_INDEX:03d}.jpg" in u), None)
    if cover:
        found = [cover] + [u for u in found if u != cover]
    return found


def sql_str(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


def eur(usd: int) -> int:
    return round(usd * USD_TO_EUR)


def money(n: int) -> str:
    """Binlik ayraci nokta: 52891 -> '52.891'.

    Bicimlendirme YALNIZ sayiya uygulanmali. Once cumleyi kurup sonra tum
    metinde virgulu noktaya cevirmek, cumledeki virgulleri de bozuyor --
    "Seoul, Kore e Jugut" ifadesi "Seoul. Kore e Jugut" oluyor.
    """
    return f"{n:,}".replace(",", ".")


statements = []
summary = []

for car_id, prefix, brand, title, sub, km, fuel, region, usd in CARS:
    pics = photos_for(car_id, prefix)
    price = eur(usd)
    desc = (
        "IMPORT NGA KOREA E JUGUT — inventar zyrtar Encar.\n\n"
        f"Kilometrazhi: {km} km\n"
        f"Karburanti: {FUEL.get(fuel, fuel)}\n"
        f"Lokacioni aktual: {region}, Kore e Jugut\n\n"
        f"Çmimi i treguar është orientues: {money(price)} € "
        f"(FOB Kore, {money(usd)} USD).\n"
        "NUK përfshin transportin detar, doganën, TVSH-në dhe regjistrimin në Kosovë.\n\n"
        "Automjeti nuk ndodhet në Kosovë — sillet me porosi. Na kontaktoni për "
        "ofertë të plotë me të gjitha kostot dhe afatin e dorëzimit."
    )
    arr = "ARRAY[" + ", ".join(sql_str(p) for p in pics) + "]::text[]"
    statements.append(
        "insert into public.listings (owner_id, category, subcategory, title, price, city, phone, description, photos, brand) values ("
        + ", ".join([
            sql_str(OWNER), sql_str("vasita"), sql_str(sub),
            sql_str("[IMPORT KORE] " + title), str(price), sql_str(CITY),
            sql_str(PHONE), sql_str(desc), arr, sql_str(brand),
        ]) + ");"
    )
    summary.append((title, price, len(pics)))
    print("  %-56s %7d EUR  %2d foto" % (title[:56], price, len(pics)))

out = "supabase/encar_more.sql"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n\n".join(statements) + "\n")

print()
print("yazildi:", out)
print("ilan:", len(summary), "| toplam fotograf:", sum(s[2] for s in summary))
