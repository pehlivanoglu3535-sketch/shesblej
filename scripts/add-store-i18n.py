"""Magaza yapisi icin dil anahtarlari ekler (10 dil)."""
import io

PATH = 'src/lib/i18n.ts'
ANCHOR = "  btn_republish: {"

NEW = (
    "  store_see_all: {sq:'Shiko të gjitha shpalljet e këtij sallonit', "
    "sr:'Pogledaj sve oglase ovog salona', "
    "tr:'Bu mağazanın tüm ilanlarını gör', "
    "en:'See all listings from this store', "
    "de:'Alle Anzeigen dieses Händlers ansehen', "
    "fr:'Voir toutes les annonces de ce vendeur', "
    "it:'Vedi tutti gli annunci di questo venditore', "
    "bs:'Pogledaj sve oglase ovog salona', "
    "el:'Δείτε όλες τις αγγελίες αυτού του καταστήματος', "
    "ru:'Все объявления этого салона'},\n"
    "  stores_title: {sq:'Sallonet partnere', sr:'Partnerski saloni', "
    "tr:'Partner mağazalar', en:'Partner stores', de:'Partnerhändler', "
    "fr:'Vendeurs partenaires', it:'Venditori partner', bs:'Partnerski saloni', "
    "el:'Καταστήματα συνεργάτες', ru:'Салоны-партнёры'},\n"
)

s = io.open(PATH, encoding='utf-8').read()

if 'store_see_all' in s:
    print('zaten var, atlandi')
else:
    i = s.index(ANCHOR)
    s = s[:i] + NEW + s[i:]
    io.open(PATH, 'w', encoding='utf-8').write(s)
    print('eklendi: store_see_all, stores_title')
