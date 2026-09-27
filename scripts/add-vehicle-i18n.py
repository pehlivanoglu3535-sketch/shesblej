"""Arac kunyesi ve ilan detayi icin dil anahtarlari.

10 dil: sq sr tr en de fr it bs el ru.
Anahtarlar UI nesnesinin icine, store_see_all satirindan once ekleniyor.
Betik tekrar calistirilabilir -- anahtar varsa hicbir sey yapmiyor.
"""
import io

PATH = 'src/lib/i18n.ts'
ANCHOR = "  store_see_all: {"
GUARD = 'label_mileage'

NEW = """  step_specs: {sq:'Specifikat', sr:'Specifikacije', tr:'Özellikler', en:'Specs', de:'Daten', fr:'Caractéristiques', it:'Specifiche', bs:'Specifikacije', el:'Χαρακτηριστικά', ru:'Характеристики'},
  label_model: {sq:'Modeli', sr:'Model', tr:'Model', en:'Model', de:'Modell', fr:'Modèle', it:'Modello', bs:'Model', el:'Μοντέλο', ru:'Модель'},
  label_year: {sq:'Viti i prodhimit', sr:'Godište', tr:'Model yılı', en:'Year', de:'Baujahr', fr:'Année', it:'Anno', bs:'Godište', el:'Έτος', ru:'Год выпуска'},
  label_mileage: {sq:'Kilometrazhi', sr:'Kilometraža', tr:'Kilometre', en:'Mileage', de:'Kilometerstand', fr:'Kilométrage', it:'Chilometraggio', bs:'Kilometraža', el:'Χιλιόμετρα', ru:'Пробег'},
  label_fuel: {sq:'Karburanti', sr:'Gorivo', tr:'Yakıt', en:'Fuel', de:'Kraftstoff', fr:'Carburant', it:'Carburante', bs:'Gorivo', el:'Καύσιμο', ru:'Топливо'},
  label_engine: {sq:'Motori (cm³)', sr:'Motor (cm³)', tr:'Motor hacmi (cm³)', en:'Engine (cc)', de:'Hubraum (cm³)', fr:'Cylindrée (cm³)', it:'Cilindrata (cm³)', bs:'Motor (cm³)', el:'Κυβισμός (cc)', ru:'Объём двигателя (см³)'},
  label_power: {sq:'Fuqia (PS)', sr:'Snaga (KS)', tr:'Motor gücü (HP)', en:'Power (hp)', de:'Leistung (PS)', fr:'Puissance (ch)', it:'Potenza (CV)', bs:'Snaga (KS)', el:'Ισχύς (ίπποι)', ru:'Мощность (л.с.)'},
  label_transmission: {sq:'Transmisioni', sr:'Menjač', tr:'Vites', en:'Transmission', de:'Getriebe', fr:'Boîte de vitesses', it:'Cambio', bs:'Mjenjač', el:'Κιβώτιο', ru:'Коробка передач'},
  label_drivetrain: {sq:'Lloji i tërheqjes', sr:'Pogon', tr:'Çekiş', en:'Drivetrain', de:'Antrieb', fr:'Transmission', it:'Trazione', bs:'Pogon', el:'Κίνηση', ru:'Привод'},
  label_body_type: {sq:'Karroceria', sr:'Karoserija', tr:'Kasa tipi', en:'Body type', de:'Karosserie', fr:'Carrosserie', it:'Carrozzeria', bs:'Karoserija', el:'Αμάξωμα', ru:'Тип кузова'},
  label_color_exterior: {sq:'Ngjyra e jashtme', sr:'Spoljna boja', tr:'Dış renk', en:'Exterior colour', de:'Außenfarbe', fr:'Couleur extérieure', it:'Colore esterno', bs:'Vanjska boja', el:'Εξωτερικό χρώμα', ru:'Цвет кузова'},
  label_color_interior: {sq:'Ngjyra e brendshme', sr:'Boja enterijera', tr:'İç renk', en:'Interior colour', de:'Innenfarbe', fr:'Couleur intérieure', it:'Colore interni', bs:'Boja enterijera', el:'Εσωτερικό χρώμα', ru:'Цвет салона'},
  label_features: {sq:'Pajisjet', sr:'Oprema', tr:'Donanım', en:'Features', de:'Ausstattung', fr:'Équipements', it:'Dotazioni', bs:'Oprema', el:'Εξοπλισμός', ru:'Комплектация'},
  specs_hint: {sq:'Sa më shumë fusha të plotësoni, aq më lart del shpallja në kërkim.', sr:'Što više polja popunite, to se oglas bolje pronalazi u pretrazi.', tr:'Ne kadar çok alan doldurursanız ilan aramada o kadar iyi bulunur.', en:'The more fields you fill in, the better the listing is found in search.', de:'Je mehr Felder Sie ausfüllen, desto besser wird die Anzeige in der Suche gefunden.', fr:'Plus vous remplissez de champs, mieux l\\'annonce est trouvée dans la recherche.', it:'Più campi compili, meglio l\\'annuncio viene trovato nella ricerca.', bs:'Što više polja popunite, to se oglas bolje pronalazi u pretrazi.', el:'Όσο περισσότερα πεδία συμπληρώνετε, τόσο καλύτερα βρίσκεται η αγγελία στην αναζήτηση.', ru:'Чем больше полей заполнено, тем лучше объявление находится в поиске.'},
  specs_optional: {sq:'Të gjitha fushat janë fakultative.', sr:'Sva polja su opciona.', tr:'Tüm alanlar isteğe bağlıdır.', en:'All fields are optional.', de:'Alle Felder sind optional.', fr:'Tous les champs sont facultatifs.', it:'Tutti i campi sono facoltativi.', bs:'Sva polja su opcionalna.', el:'Όλα τα πεδία είναι προαιρετικά.', ru:'Все поля необязательны.'},
  detail_description_title: {sq:'Përshkrimi', sr:'Opis', tr:'Açıklama', en:'Description', de:'Beschreibung', fr:'Description', it:'Descrizione', bs:'Opis', el:'Περιγραφή', ru:'Описание'},
  detail_specs_title: {sq:'Të dhënat teknike', sr:'Tehnički podaci', tr:'Teknik bilgiler', en:'Technical data', de:'Technische Daten', fr:'Données techniques', it:'Dati tecnici', bs:'Tehnički podaci', el:'Τεχνικά στοιχεία', ru:'Технические данные'},
  detail_features_title: {sq:'Pajisjet', sr:'Oprema', tr:'Donanım', en:'Features', de:'Ausstattung', fr:'Équipements', it:'Dotazioni', bs:'Oprema', el:'Εξοπλισμός', ru:'Комплектация'},
  related_title: {sq:'Shpallje të ngjashme', sr:'Slični oglasi', tr:'Benzer ilanlar', en:'Similar listings', de:'Ähnliche Anzeigen', fr:'Annonces similaires', it:'Annunci simili', bs:'Slični oglasi', el:'Παρόμοιες αγγελίες', ru:'Похожие объявления'},
  share_title: {sq:'Ndaje', sr:'Podeli', tr:'Paylaş', en:'Share', de:'Teilen', fr:'Partager', it:'Condividi', bs:'Podijeli', el:'Κοινοποίηση', ru:'Поделиться'},
  share_copy_link: {sq:'Kopjo linkun', sr:'Kopiraj link', tr:'Bağlantıyı kopyala', en:'Copy link', de:'Link kopieren', fr:'Copier le lien', it:'Copia link', bs:'Kopiraj link', el:'Αντιγραφή συνδέσμου', ru:'Копировать ссылку'},
  share_copied: {sq:'U kopjua', sr:'Kopirano', tr:'Kopyalandı', en:'Copied', de:'Kopiert', fr:'Copié', it:'Copiato', bs:'Kopirano', el:'Αντιγράφηκε', ru:'Скопировано'},
"""


s = io.open(PATH, encoding='utf-8').read()

if GUARD in s:
    print('zaten var, atlandi')
else:
    i = s.index(ANCHOR)
    s = s[:i] + NEW + s[i:]
    io.open(PATH, 'w', encoding='utf-8').write(s)
    print('eklendi:', NEW.count('\n'), 'anahtar')
