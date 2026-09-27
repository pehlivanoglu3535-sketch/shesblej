"""Yeniden yayinlama icin iki dil anahtari ekler (10 dil).

i18n.ts mobil uygulamaya birebir kopyalandigi icin bu dosyaya elle degil
betikle dokunuyoruz -- boylece ayni ekleme mobil kopyaya da uygulanabiliyor.
"""
import io

PATH = 'src/lib/i18n.ts'
ANCHOR = "  btn_delete: {"

NEW = (
    "  btn_republish: {sq:'Ripublikoni', sr:'Ponovo objavi', tr:'Tekrar yayınla', "
    "en:'Republish', de:'Erneut verö̈ffentlichen', fr:'Republier', it:'Ripubblica', "
    "bs:'Ponovo objavi', el:'Επαναδημοσίευση', ru:'Опубликовать снова'},\n"
    "  listing_expired_note: {sq:'Kjo shpallje ka skaduar dhe nuk shihet nga vizitorët.', "
    "sr:'Ovaj oglas je istekao i nije vidljiv posetiocima.', "
    "tr:'Bu ilanın süresi doldu, ziyaretçilere görünmüyor.', "
    "en:'This listing has expired and is not visible to visitors.', "
    "de:'Diese Anzeige ist abgelaufen und für Besucher nicht sichtbar.', "
    "fr:'Cette annonce a expiré et n\\'est pas visible par les visiteurs.', "
    "it:'Questo annuncio è scaduto e non è visibile ai visitatori.', "
    "bs:'Ovaj oglas je istekao i nije vidljiv posjetiocima.', "
    "el:'Αυτή η αγγελία έληξε και δεν είναι ορατή στους επισκέπτες.', "
    "ru:'Срок объявления истёк, посетители его не видят.'},\n"
)

s = io.open(PATH, encoding='utf-8').read()

if 'btn_republish' in s:
    print('zaten var, atlandi')
else:
    i = s.index(ANCHOR)
    s = s[:i] + NEW + s[i:]
    io.open(PATH, 'w', encoding='utf-8').write(s)
    print('eklendi: btn_republish, listing_expired_note')
