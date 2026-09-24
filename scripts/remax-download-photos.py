"""remax_listings.sql icindeki fotograflari yerele indirir.

Amac: fotograflari RE/MAX'in CDN'inden cekmek yerine kendi Supabase depomuza
tasimak. Boylece next.config.ts'e yeni bir remotePattern eklemek -- ve onu
canliya almak icin deploy beklemek -- gerekmez.

Dosya adlari ilan sirasina gore veriliyor (01_01.jpg = 1. ilanin 1. fotografi),
cunku yukleme sonrasi SQL'i yeniden uretirken sirayi korumak sart.
"""
import os
import re
import sys
import urllib.request

SQL = "supabase/remax_listings.sql"
OUT = sys.argv[1] if len(sys.argv) > 1 else "remax-photos"
UA = {"User-Agent": "Mozilla/5.0"}

with open(SQL, encoding="utf-8") as f:
    sql = f.read()

os.makedirs(OUT, exist_ok=True)

toplam = 0
for i, stmt in enumerate(sql.strip().split("\n\n"), start=1):
    urls = re.findall(r"'(https://cdn\.gryphtech\.com/[^']+)'", stmt)
    for j, url in enumerate(urls, start=1):
        name = f"{i:02d}_{j:02d}.jpg"
        path = os.path.join(OUT, name)
        if os.path.exists(path):
            print("  atlandi (var):", name)
            toplam += 1
            continue
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        with open(path, "wb") as f:
            f.write(data)
        print("  %s  %6.1f KB" % (name, len(data) / 1024))
        toplam += 1

print()
print("indirilen:", toplam, "->", OUT)
