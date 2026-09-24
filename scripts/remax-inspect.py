"""RE/MAX Kosova ilanlarinin alan dagilimini cikarir (esleme kararlari icin)."""
import json
import urllib.request
import collections

URL = "https://www.remax-kosovo.com/search/listing-search/docs/search"
body = json.dumps({"search": "*", "count": True, "top": 100,
                   "filter": "content/CountryID eq 128"}).encode()
req = urllib.request.Request(
    URL, data=body,
    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    method="POST")
with urllib.request.urlopen(req, timeout=60) as r:
    d = json.load(r)

rows = [v["content"] for v in d["value"]]
print("toplam:", d["@odata.count"], "| cekilen:", len(rows))
print()


def slug_tip(c):
    link = next((s["ShortLink"] for s in c.get("ShortLinks") or []
                 if s.get("ISOLanguageCode") == "sq"), "")
    parts = link.split("/")
    return parts[2] if len(parts) > 3 else "?"


for name, vals in [
    ("il (Province)", [c.get("Province") for c in rows]),
    ("islem tipi", [c.get("TransactionTypeUID") for c in rows]),
    ("durum (ListingStatusUID)", [c.get("ListingStatusUID") for c in rows]),
    ("mulk tipi (slug)", [slug_tip(c) for c in rows]),
]:
    print("===", name, "===")
    for k, n in collections.Counter(vals).most_common():
        print("   %-28s %d" % (k, n))
    print()

gizli = sum(1 for c in rows if c.get("HidePricePublic"))
sifir = sum(1 for c in rows if not c.get("ListingPriceEuro"))
fotosuz = sum(1 for c in rows if not (c.get("ListingImages") or []))
print("fiyati gizli :", gizli)
print("fiyat 0      :", sifir)
print("fotografsiz  :", fotosuz)
print("ortalama foto:", round(sum(len(c.get("ListingImages") or []) for c in rows) / len(rows), 1))
