"""Auto Salloni Alberti araclarini ShesBlej ilanina cevirir.

KAYNAK
autosallonialberti.net her ilan sayfasinda schema.org Vehicle verisi
yayinliyor: marka, model, yil, kilometre, yakit, sanziman, guc ve fiyat.
Veri alberti-data.json icinde; tarayicidan bu yapilandirilmis alanlar okundu,
sayfa metninden tahmin yurutulmedi.

NEDEN SADECE FIYATLI OLANLAR
Stokta 237 arac var ama 182'sinde fiyat yok ("ASK FOR PRICE", JSON-LD'de
offers null). Sitemizde fiyat zorunlu ve 0 EUR gostermek alicida yanlis
beklenti yaratir. 55 fiyatli arac aliniyor.

ILETISIM
Telefon bayinin kendi numarasi. Bu araclar Alberti'nin stogunda ve Kosova'da
fiziksel olarak duruyor; alicinin dogrudan onlara ulasmasi gerekiyor. Encar
ithal araclarinda durum farkliydi -- orada arac Kore'de ve siparisi biz
aliyorduk.

FOTOGRAF
Alberti'nin CDN'inden 1600px genislikteki webp kareler. Detay sayfasindaki
"Similar vehicles" bolumu baska araclarin gorsellerini de iceriyor; bu yuzden
her fotograf yolu arac kimligiyle birlikte dogrulandi.
"""
import json
import re

OWNER = "53b2542a-90da-4355-beaa-e454d375c456"
PHONE = "+38344435435"
CITY = "Prishtinë"
DISTRICT = "Autostrada Prishtinë–Ferizaj"
IMG = "https://autosallonialberti.net/assets/inventory/"
DEALER = "Auto Salloni Alberti"

# Yakit adlari Arnavutcaya; digerleriyle ayni adlandirma.
FUEL = {
    "Diesel": "Diesel",
    "Gasoline": "Benzin",
    "Petrol": "Benzin",
    "Hybrid": "Hibrid",
    "Electric": "Elektrik",
    "Plug-in Hybrid": "Hibrid plug-in",
}

# Model adindan govde tipi. Sitenin BODY alani detay sayfasinda metin icinde
# geciyor ve guvenilir sekilde ayiklanamadi; model adi bu marka/model
# kumesinde yeterince ayirt edici.
SUV = re.compile(
    r"\b(Q3|Q5|Q7|Q8|X1|X3|X5|X6|XM|GLC|GLE|GLA|GLB|Tiguan|Touareg|Velar|EVOQUE"
    r"|Discovery|Jimny|Cayenne|Macan|Kodiaq|Karoq|Tucson|Santa Fe|Sportage)\b",
    re.I,
)


def sql_str(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


def money(n: int) -> str:
    """Binlik ayraci nokta. Yalniz sayiya uygulanir -- tum cumlede virgul
    degistirmek aciklamanin kendi virgullerini bozuyor."""
    return f"{n:,}".replace(",", ".")


with open("scripts/alberti-data.json", encoding="utf-8") as f:
    cars = json.load(f)

statements = []
summary = []

for c in cars:
    price = int(c["e"])
    title = c["n"].strip()
    sub = "arazi-suv" if SUV.search(title) else "otomobil"

    photos = [f"{IMG}{c['i']}/{n}.1600.webp" for n in c["g"].split(",") if n != ""]
    if not photos:
        continue

    detay = [f"Viti: {c['y']}", f"Kilometrazhi: {money(int(c['k']))} km"]
    if c.get("p"):
        detay.append(f"Fuqia: {c['p']} PS")
    detay.append(f"Karburanti: {FUEL.get(c['f'], c['f'])}")
    if c.get("t"):
        detay.append(f"Transmisioni: {c['t']}")

    desc = (
        "\n".join(detay)
        + "\n\nAutomjeti ndodhet në Kosovë dhe mund të shihet në vend.\n"
        + f"Adresa: {DISTRICT}, {CITY}.\n\n"
        + f"Automjet i listuar nga {DEALER} — partner i ShesBlej."
    )

    arr = "ARRAY[" + ", ".join(sql_str(p) for p in photos) + "]::text[]"
    statements.append(
        "insert into public.listings (owner_id, category, subcategory, title, price, city, district, phone, description, photos, brand) values ("
        + ", ".join([
            sql_str(OWNER), sql_str("vasita"), sql_str(sub),
            sql_str(f"[{DEALER}] {title} ({c['y']})"),
            str(price), sql_str(CITY), sql_str(DISTRICT), sql_str(PHONE),
            sql_str(desc), arr, sql_str(c["b"]),
        ]) + ");"
    )
    summary.append((title, price, len(photos), sub))

out = "supabase/alberti_listings.sql"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n\n".join(statements) + "\n")

for t, p, n, s in summary:
    print("  %-44s %6d EUR  %2d foto  %s" % (t[:44], p, n, s))
print()
print("yazildi:", out)
print("ilan:", len(summary), "| fotograf:", sum(s[2] for s in summary))
print("suv:", sum(1 for s in summary if s[3] == "arazi-suv"),
      "| otomobil:", sum(1 for s in summary if s[3] == "otomobil"))
print("fiyat araligi:", money(min(s[1] for s in summary)), "-", money(max(s[1] for s in summary)), "EUR")
