/**
 * Araç ilanlarının yapılandırılmış alanları.
 *
 * Şimdiye kadar bir araç ilanının tüm teknik bilgisi serbest metin
 * açıklamanın içindeydi. Bu yüzden ne süzülebiliyor, ne karşılaştırılabiliyor,
 * ne de düzgün bir künye tablosu gösterilebiliyordu. Burada her biri kendi
 * sütununa çıkıyor.
 *
 * ÇEVİRİ BİÇİMİ
 * Seçenek adlarının bir kısmı her dilde aynı: ABS, ESP, Bluetooth, USB,
 * Isofix, LED, Apple CarPlay... Bunlar için on dile aynı dizeyi on kez
 * yazmak dosyayı şişirmekten başka bir şey yapmıyor. Bu yüzden etiket ya
 * düz bir dize (her dilde aynı) ya da dil haritası olabiliyor; `vt()`
 * ikisini de çözüyor.
 */
import type { LangCode } from '@/lib/i18n';

export type Translatable = string | Partial<Record<LangCode, string>>;

export function vt(label: Translatable, lang: LangCode): string {
  if (typeof label === 'string') return label;
  return label[lang] || label.en || label.sq || '';
}

export type Option = { id: string; label: Translatable };

/** Yakıt. */
export const FUELS: Option[] = [
  { id: 'benzin', label: { sq: 'Benzinë', sr: 'Benzin', tr: 'Benzin', en: 'Petrol', de: 'Benzin', fr: 'Essence', it: 'Benzina', bs: 'Benzin', el: 'Βενζίνη', ru: 'Бензин' } },
  { id: 'diesel', label: { sq: 'Naftë', sr: 'Dizel', tr: 'Dizel', en: 'Diesel', de: 'Diesel', fr: 'Diesel', it: 'Diesel', bs: 'Dizel', el: 'Πετρέλαιο', ru: 'Дизель' } },
  { id: 'hibrid', label: { sq: 'Hibrid', sr: 'Hibrid', tr: 'Hibrit', en: 'Hybrid', de: 'Hybrid', fr: 'Hybride', it: 'Ibrida', bs: 'Hibrid', el: 'Υβριδικό', ru: 'Гибрид' } },
  { id: 'hibrid-plug-in', label: { sq: 'Hibrid plug-in', sr: 'Plug-in hibrid', tr: 'Şarjlı hibrit', en: 'Plug-in hybrid', de: 'Plug-in-Hybrid', fr: 'Hybride rechargeable', it: 'Ibrida plug-in', bs: 'Plug-in hibrid', el: 'Plug-in υβριδικό', ru: 'Плагин-гибрид' } },
  { id: 'elektrik', label: { sq: 'Elektrik', sr: 'Električni', tr: 'Elektrikli', en: 'Electric', de: 'Elektro', fr: 'Électrique', it: 'Elettrica', bs: 'Električni', el: 'Ηλεκτρικό', ru: 'Электро' } },
  { id: 'gaz', label: { sq: 'Gaz (LPG)', sr: 'Plin (LPG)', tr: 'LPG', en: 'LPG', de: 'Autogas (LPG)', fr: 'GPL', it: 'GPL', bs: 'Plin (LPG)', el: 'Υγραέριο (LPG)', ru: 'Газ (LPG)' } },
];

/** Şanzıman. */
export const TRANSMISSIONS: Option[] = [
  { id: 'manual', label: { sq: 'Manual', sr: 'Manuelni', tr: 'Manuel', en: 'Manual', de: 'Schaltgetriebe', fr: 'Manuelle', it: 'Manuale', bs: 'Manuelni', el: 'Χειροκίνητο', ru: 'Механика' } },
  { id: 'automatik', label: { sq: 'Automatik', sr: 'Automatski', tr: 'Otomatik', en: 'Automatic', de: 'Automatik', fr: 'Automatique', it: 'Automatico', bs: 'Automatski', el: 'Αυτόματο', ru: 'Автомат' } },
  { id: 'gjysme-automatik', label: { sq: 'Gjysmë-automatik', sr: 'Poluautomatski', tr: 'Yarı otomatik', en: 'Semi-automatic', de: 'Halbautomatik', fr: 'Semi-automatique', it: 'Semiautomatico', bs: 'Poluautomatski', el: 'Ημιαυτόματο', ru: 'Робот' } },
];

/** Çekiş. */
export const DRIVETRAINS: Option[] = [
  { id: 'fwd', label: { sq: 'Përpara (FWD)', sr: 'Prednji (FWD)', tr: 'Önden çekiş (FWD)', en: 'Front-wheel (FWD)', de: 'Frontantrieb (FWD)', fr: 'Traction avant (FWD)', it: 'Trazione anteriore (FWD)', bs: 'Prednji (FWD)', el: 'Εμπρόσθια (FWD)', ru: 'Передний (FWD)' } },
  { id: 'rwd', label: { sq: 'Prapa (RWD)', sr: 'Zadnji (RWD)', tr: 'Arkadan itiş (RWD)', en: 'Rear-wheel (RWD)', de: 'Heckantrieb (RWD)', fr: 'Propulsion (RWD)', it: 'Trazione posteriore (RWD)', bs: 'Zadnji (RWD)', el: 'Οπίσθια (RWD)', ru: 'Задний (RWD)' } },
  { id: 'awd', label: { sq: 'Katër rrota (4x4)', sr: 'Pogon 4x4', tr: 'Dört çeker (4x4)', en: 'All-wheel (4x4)', de: 'Allrad (4x4)', fr: 'Quatre roues motrices (4x4)', it: 'Integrale (4x4)', bs: 'Pogon 4x4', el: 'Τετρακίνητο (4x4)', ru: 'Полный (4x4)' } },
];

/** Kasa tipi. Alt kategoriden daha ince: alt kategori "otomobil" derken
 *  burada sedan / hatchback / karavan ayrımı yapılıyor. */
export const BODY_TYPES: Option[] = [
  { id: 'sedan', label: { sq: 'Sedan', sr: 'Limuzina', tr: 'Sedan', en: 'Sedan', de: 'Limousine', fr: 'Berline', it: 'Berlina', bs: 'Limuzina', el: 'Σεντάν', ru: 'Седан' } },
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'suv', label: 'SUV' },
  { id: 'karavan', label: { sq: 'Karavan', sr: 'Karavan', tr: 'Station wagon', en: 'Estate', de: 'Kombi', fr: 'Break', it: 'Station wagon', bs: 'Karavan', el: 'Στέισον', ru: 'Универсал' } },
  { id: 'kupe', label: { sq: 'Kupe', sr: 'Kupe', tr: 'Coupé', en: 'Coupé', de: 'Coupé', fr: 'Coupé', it: 'Coupé', bs: 'Kupe', el: 'Κουπέ', ru: 'Купе' } },
  { id: 'kabriolet', label: { sq: 'Kabriolet', sr: 'Kabriolet', tr: 'Cabrio', en: 'Convertible', de: 'Cabrio', fr: 'Cabriolet', it: 'Cabrio', bs: 'Kabriolet', el: 'Κάμπριο', ru: 'Кабриолет' } },
  { id: 'minivan', label: 'Minivan' },
  { id: 'pickup', label: 'Pick-up' },
  { id: 'furgon', label: { sq: 'Furgon', sr: 'Kombi vozilo', tr: 'Panelvan', en: 'Van', de: 'Transporter', fr: 'Fourgon', it: 'Furgone', bs: 'Kombi vozilo', el: 'Βαν', ru: 'Фургон' } },
];

/** Renk. Araç ilanlarında kullanılan kısa liste — moda renk adları değil,
 *  alıcının süzebileceği temel tonlar. */
export const COLORS: Option[] = [
  { id: 'e-zeze', label: { sq: 'E zezë', sr: 'Crna', tr: 'Siyah', en: 'Black', de: 'Schwarz', fr: 'Noir', it: 'Nero', bs: 'Crna', el: 'Μαύρο', ru: 'Чёрный' } },
  { id: 'e-bardhe', label: { sq: 'E bardhë', sr: 'Bela', tr: 'Beyaz', en: 'White', de: 'Weiß', fr: 'Blanc', it: 'Bianco', bs: 'Bijela', el: 'Λευκό', ru: 'Белый' } },
  { id: 'gri', label: { sq: 'Gri', sr: 'Siva', tr: 'Gri', en: 'Grey', de: 'Grau', fr: 'Gris', it: 'Grigio', bs: 'Siva', el: 'Γκρι', ru: 'Серый' } },
  { id: 'argjend', label: { sq: 'Argjend', sr: 'Srebrna', tr: 'Gümüş', en: 'Silver', de: 'Silber', fr: 'Argent', it: 'Argento', bs: 'Srebrna', el: 'Ασημί', ru: 'Серебристый' } },
  { id: 'kaltert', label: { sq: 'Kaltër', sr: 'Plava', tr: 'Mavi', en: 'Blue', de: 'Blau', fr: 'Bleu', it: 'Blu', bs: 'Plava', el: 'Μπλε', ru: 'Синий' } },
  { id: 'e-kuqe', label: { sq: 'E kuqe', sr: 'Crvena', tr: 'Kırmızı', en: 'Red', de: 'Rot', fr: 'Rouge', it: 'Rosso', bs: 'Crvena', el: 'Κόκκινο', ru: 'Красный' } },
  { id: 'e-gjelber', label: { sq: 'E gjelbër', sr: 'Zelena', tr: 'Yeşil', en: 'Green', de: 'Grün', fr: 'Vert', it: 'Verde', bs: 'Zelena', el: 'Πράσινο', ru: 'Зелёный' } },
  { id: 'kafe', label: { sq: 'Kafe', sr: 'Braon', tr: 'Kahverengi', en: 'Brown', de: 'Braun', fr: 'Marron', it: 'Marrone', bs: 'Smeđa', el: 'Καφέ', ru: 'Коричневый' } },
  { id: 'bezhe', label: { sq: 'Bezhë', sr: 'Bež', tr: 'Bej', en: 'Beige', de: 'Beige', fr: 'Beige', it: 'Beige', bs: 'Bež', el: 'Μπεζ', ru: 'Бежевый' } },
  { id: 'e-verdhe', label: { sq: 'E verdhë', sr: 'Žuta', tr: 'Sarı', en: 'Yellow', de: 'Gelb', fr: 'Jaune', it: 'Giallo', bs: 'Žuta', el: 'Κίτρινο', ru: 'Жёлтый' } },
  { id: 'portokalli', label: { sq: 'Portokalli', sr: 'Narandžasta', tr: 'Turuncu', en: 'Orange', de: 'Orange', fr: 'Orange', it: 'Arancione', bs: 'Narandžasta', el: 'Πορτοκαλί', ru: 'Оранжевый' } },
  { id: 'tjeter', label: { sq: 'Tjetër', sr: 'Ostalo', tr: 'Diğer', en: 'Other', de: 'Sonstige', fr: 'Autre', it: 'Altro', bs: 'Ostalo', el: 'Άλλο', ru: 'Другой' } },
];

/**
 * Donanım listesi, gruplu.
 *
 * Gruplama alıcının aradığını bulma biçimini izliyor: güvenlik donanımı
 * arayan kişi multimedya kutucuklarını okumak zorunda kalmıyor.
 */
export type FeatureGroup = { id: string; title: Translatable; items: Option[] };

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'siguria',
    title: { sq: 'Siguria', sr: 'Bezbednost', tr: 'Güvenlik', en: 'Safety', de: 'Sicherheit', fr: 'Sécurité', it: 'Sicurezza', bs: 'Sigurnost', el: 'Ασφάλεια', ru: 'Безопасность' },
    items: [
      { id: 'abs', label: 'ABS' },
      { id: 'esp', label: 'ESP' },
      { id: 'airbag', label: { sq: 'Airbag', sr: 'Vazdušni jastuci', tr: 'Hava yastığı', en: 'Airbags', de: 'Airbags', fr: 'Airbags', it: 'Airbag', bs: 'Zračni jastuci', el: 'Αερόσακοι', ru: 'Подушки безопасности' } },
      { id: 'isofix', label: 'Isofix' },
      { id: 'sensore-parkimi', label: { sq: 'Sensorë parkimi', sr: 'Parking senzori', tr: 'Park sensörü', en: 'Parking sensors', de: 'Einparkhilfe', fr: 'Capteurs de stationnement', it: 'Sensori di parcheggio', bs: 'Parking senzori', el: 'Αισθητήρες παρκαρίσματος', ru: 'Парктроник' } },
      { id: 'kamera-prapa', label: { sq: 'Kamera e prapme', sr: 'Kamera za vožnju unazad', tr: 'Geri görüş kamerası', en: 'Rear camera', de: 'Rückfahrkamera', fr: 'Caméra de recul', it: 'Telecamera posteriore', bs: 'Kamera za vožnju unazad', el: 'Κάμερα οπισθοπορείας', ru: 'Камера заднего вида' } },
      { id: 'kamera-360', label: { sq: 'Kamera 360°', sr: 'Kamera 360°', tr: '360° kamera', en: '360° camera', de: '360°-Kamera', fr: 'Caméra 360°', it: 'Telecamera 360°', bs: 'Kamera 360°', el: 'Κάμερα 360°', ru: 'Камера 360°' } },
      { id: 'blind-spot', label: { sq: 'Sensor i këndit të vdekur', sr: 'Senzor mrtvog ugla', tr: 'Kör nokta uyarısı', en: 'Blind spot monitor', de: 'Totwinkel-Assistent', fr: 'Détecteur d’angle mort', it: 'Sensore angolo cieco', bs: 'Senzor mrtvog ugla', el: 'Αισθητήρας τυφλού σημείου', ru: 'Контроль слепых зон' } },
      { id: 'lane-assist', label: 'Lane Assist' },
      { id: 'tempomat', label: { sq: 'Tempomat', sr: 'Tempomat', tr: 'Hız sabitleyici', en: 'Cruise control', de: 'Tempomat', fr: 'Régulateur de vitesse', it: 'Cruise control', bs: 'Tempomat', el: 'Cruise control', ru: 'Круиз-контроль' } },
      { id: 'tempomat-adaptiv', label: { sq: 'Tempomat adaptiv', sr: 'Adaptivni tempomat', tr: 'Adaptif hız sabitleyici', en: 'Adaptive cruise control', de: 'Adaptiver Tempomat', fr: 'Régulateur adaptatif', it: 'Cruise control adattivo', bs: 'Adaptivni tempomat', el: 'Προσαρμοστικό cruise control', ru: 'Адаптивный круиз-контроль' } },
      { id: 'alarm', label: { sq: 'Alarm', sr: 'Alarm', tr: 'Alarm', en: 'Alarm', de: 'Alarmanlage', fr: 'Alarme', it: 'Allarme', bs: 'Alarm', el: 'Συναγερμός', ru: 'Сигнализация' } },
    ],
  },
  {
    id: 'komoditeti',
    title: { sq: 'Komoditeti', sr: 'Komfor', tr: 'Konfor', en: 'Comfort', de: 'Komfort', fr: 'Confort', it: 'Comfort', bs: 'Komfor', el: 'Άνεση', ru: 'Комфорт' },
    items: [
      { id: 'klime', label: { sq: 'Klimë', sr: 'Klima', tr: 'Klima', en: 'Air conditioning', de: 'Klimaanlage', fr: 'Climatisation', it: 'Aria condizionata', bs: 'Klima', el: 'Κλιματισμός', ru: 'Кондиционер' } },
      { id: 'klimatronik', label: { sq: 'Klimë automatike', sr: 'Automatska klima', tr: 'Otomatik klima', en: 'Climate control', de: 'Klimaautomatik', fr: 'Climatisation automatique', it: 'Clima automatico', bs: 'Automatska klima', el: 'Αυτόματος κλιματισμός', ru: 'Климат-контроль' } },
      { id: 'ulese-ngrohje', label: { sq: 'Ulëse me ngrohje', sr: 'Grejanje sedišta', tr: 'Isıtmalı koltuk', en: 'Heated seats', de: 'Sitzheizung', fr: 'Sièges chauffants', it: 'Sedili riscaldati', bs: 'Grijanje sjedišta', el: 'Θερμαινόμενα καθίσματα', ru: 'Подогрев сидений' } },
      { id: 'ulese-ventilim', label: { sq: 'Ulëse me ventilim', sr: 'Ventilacija sedišta', tr: 'Havalandırmalı koltuk', en: 'Ventilated seats', de: 'Sitzbelüftung', fr: 'Sièges ventilés', it: 'Sedili ventilati', bs: 'Ventilacija sjedišta', el: 'Αεριζόμενα καθίσματα', ru: 'Вентиляция сидений' } },
      { id: 'ulese-lekure', label: { sq: 'Ulëse lëkure', sr: 'Kožna sedišta', tr: 'Deri döşeme', en: 'Leather seats', de: 'Ledersitze', fr: 'Sièges en cuir', it: 'Sedili in pelle', bs: 'Kožna sjedišta', el: 'Δερμάτινα καθίσματα', ru: 'Кожаный салон' } },
      { id: 'ulese-elektrike', label: { sq: 'Ulëse elektrike', sr: 'Električna sedišta', tr: 'Elektrikli koltuk', en: 'Electric seats', de: 'Elektrische Sitze', fr: 'Sièges électriques', it: 'Sedili elettrici', bs: 'Električna sjedišta', el: 'Ηλεκτρικά καθίσματα', ru: 'Электрорегулировка сидений' } },
      { id: 'panorama', label: { sq: 'Çati panoramike', sr: 'Panoramski krov', tr: 'Panoramik cam tavan', en: 'Panoramic roof', de: 'Panoramadach', fr: 'Toit panoramique', it: 'Tetto panoramico', bs: 'Panoramski krov', el: 'Πανοραμική οροφή', ru: 'Панорамная крыша' } },
      { id: 'sunroof', label: { sq: 'Çati diellore', sr: 'Šiber', tr: 'Sunroof', en: 'Sunroof', de: 'Schiebedach', fr: 'Toit ouvrant', it: 'Tetto apribile', bs: 'Šiber', el: 'Ηλιοροφή', ru: 'Люк' } },
      { id: 'xhama-elektrik', label: { sq: 'Xhama elektrikë', sr: 'Električni podizači', tr: 'Elektrikli cam', en: 'Electric windows', de: 'Elektrische Fensterheber', fr: 'Vitres électriques', it: 'Alzacristalli elettrici', bs: 'Električni podizači', el: 'Ηλεκτρικά παράθυρα', ru: 'Электростеклоподъёмники' } },
      { id: 'mbyllje-qendrore', label: { sq: 'Mbyllje qendrore', sr: 'Centralno zaključavanje', tr: 'Merkezi kilit', en: 'Central locking', de: 'Zentralverriegelung', fr: 'Verrouillage centralisé', it: 'Chiusura centralizzata', bs: 'Centralno zaključavanje', el: 'Κεντρικό κλείδωμα', ru: 'Центральный замок' } },
      { id: 'keyless', label: 'Keyless Go' },
      { id: 'start-stop', label: 'Start / Stop' },
      { id: 'ngrohje-shtese', label: { sq: 'Ngrohje shtesë', sr: 'Dodatno grejanje', tr: 'İlave ısıtıcı', en: 'Auxiliary heating', de: 'Standheizung', fr: 'Chauffage auxiliaire', it: 'Riscaldamento supplementare', bs: 'Dodatno grijanje', el: 'Πρόσθετη θέρμανση', ru: 'Автономный отопитель' } },
      { id: 'porta-bagazhi-elektrik', label: { sq: 'Bagazh elektrik', sr: 'Električni gepek', tr: 'Elektrikli bagaj kapağı', en: 'Electric tailgate', de: 'Elektrische Heckklappe', fr: 'Hayon électrique', it: 'Portellone elettrico', bs: 'Električni gepek', el: 'Ηλεκτρική πόρτα χώρου αποσκευών', ru: 'Электропривод багажника' } },
    ],
  },
  {
    id: 'multimedia',
    title: { sq: 'Multimedia', sr: 'Multimedija', tr: 'Multimedya', en: 'Multimedia', de: 'Multimedia', fr: 'Multimédia', it: 'Multimedia', bs: 'Multimedija', el: 'Πολυμέσα', ru: 'Мультимедиа' },
    items: [
      { id: 'bluetooth', label: 'Bluetooth' },
      { id: 'navigim', label: { sq: 'Navigim', sr: 'Navigacija', tr: 'Navigasyon', en: 'Navigation', de: 'Navigation', fr: 'Navigation', it: 'Navigatore', bs: 'Navigacija', el: 'Πλοήγηση', ru: 'Навигация' } },
      { id: 'apple-carplay', label: 'Apple CarPlay' },
      { id: 'android-auto', label: 'Android Auto' },
      { id: 'usb', label: 'USB' },
      { id: 'ekran-me-prekje', label: { sq: 'Ekran me prekje', sr: 'Ekran osetljiv na dodir', tr: 'Dokunmatik ekran', en: 'Touchscreen', de: 'Touchscreen', fr: 'Écran tactile', it: 'Touchscreen', bs: 'Ekran osjetljiv na dodir', el: 'Οθόνη αφής', ru: 'Сенсорный экран' } },
      { id: 'audio-premium', label: { sq: 'Audio premium', sr: 'Premium audio', tr: 'Premium ses sistemi', en: 'Premium sound', de: 'Premium-Sound', fr: 'Audio premium', it: 'Audio premium', bs: 'Premium audio', el: 'Premium ηχοσύστημα', ru: 'Премиум-аудио' } },
      { id: 'head-up', label: 'Head-up display' },
    ],
  },
  {
    id: 'jashtem',
    title: { sq: 'Pjesa e jashtme', sr: 'Spoljašnjost', tr: 'Dış donanım', en: 'Exterior', de: 'Außen', fr: 'Extérieur', it: 'Esterno', bs: 'Vanjski dio', el: 'Εξωτερικό', ru: 'Экстерьер' },
    items: [
      { id: 'led', label: { sq: 'Fenerë LED', sr: 'LED svetla', tr: 'LED far', en: 'LED headlights', de: 'LED-Scheinwerfer', fr: 'Phares LED', it: 'Fari LED', bs: 'LED svjetla', el: 'Προβολείς LED', ru: 'LED-фары' } },
      { id: 'xenon', label: { sq: 'Fenerë xenon', sr: 'Ksenon svetla', tr: 'Xenon far', en: 'Xenon headlights', de: 'Xenon-Scheinwerfer', fr: 'Phares xénon', it: 'Fari allo xeno', bs: 'Ksenon svjetla', el: 'Προβολείς xenon', ru: 'Ксеноновые фары' } },
      { id: 'drita-mjegulle', label: { sq: 'Drita mjegulle', sr: 'Svetla za maglu', tr: 'Sis farı', en: 'Fog lights', de: 'Nebelscheinwerfer', fr: 'Antibrouillards', it: 'Fendinebbia', bs: 'Svjetla za maglu', el: 'Προβολείς ομίχλης', ru: 'Противотуманные фары' } },
      { id: 'rrota-alumini', label: { sq: 'Rrota alumini', sr: 'Alu felne', tr: 'Alaşım jant', en: 'Alloy wheels', de: 'Alufelgen', fr: 'Jantes alliage', it: 'Cerchi in lega', bs: 'Alu felge', el: 'Ζάντες αλουμινίου', ru: 'Легкосплавные диски' } },
      { id: 'shina-cati', label: { sq: 'Shina çatie', sr: 'Krovni nosači', tr: 'Tavan rayı', en: 'Roof rails', de: 'Dachreling', fr: 'Barres de toit', it: 'Barre sul tetto', bs: 'Krovni nosači', el: 'Μπάρες οροφής', ru: 'Рейлинги' } },
      { id: 'kanca-rimorkios', label: { sq: 'Kancë rimorkioje', sr: 'Kuka za vuču', tr: 'Çeki demiri', en: 'Tow bar', de: 'Anhängerkupplung', fr: 'Attelage', it: 'Gancio traino', bs: 'Kuka za vuču', el: 'Κοτσαδόρος', ru: 'Фаркоп' } },
      { id: 'pasqyra-elektrike', label: { sq: 'Pasqyra elektrike', sr: 'Električni retrovizori', tr: 'Elektrikli ayna', en: 'Electric mirrors', de: 'Elektrische Außenspiegel', fr: 'Rétroviseurs électriques', it: 'Specchietti elettrici', bs: 'Električni retrovizori', el: 'Ηλεκτρικοί καθρέπτες', ru: 'Электрозеркала' } },
    ],
  },
];

/** id -> etiket; ilan detayında kayıtlı id'leri isme çevirmek için. */
const FEATURE_INDEX = new Map<string, Option>(
  FEATURE_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i] as const)),
);

export const ALL_FEATURE_IDS: string[] = [...FEATURE_INDEX.keys()];

export function featureLabel(id: string, lang: LangCode): string | null {
  const item = FEATURE_INDEX.get(id);
  return item ? vt(item.label, lang) : null;
}

function optLabel(list: Option[], id: string | null, lang: LangCode): string | null {
  if (!id) return null;
  const found = list.find((o) => o.id === id);
  return found ? vt(found.label, lang) : id;
}

export const fuelLabel = (id: string | null, lang: LangCode) => optLabel(FUELS, id, lang);
export const transmissionLabel = (id: string | null, lang: LangCode) => optLabel(TRANSMISSIONS, id, lang);
export const drivetrainLabel = (id: string | null, lang: LangCode) => optLabel(DRIVETRAINS, id, lang);
export const bodyTypeLabel = (id: string | null, lang: LangCode) => optLabel(BODY_TYPES, id, lang);
export const colorLabel = (id: string | null, lang: LangCode) => optLabel(COLORS, id, lang);

/** Kilometre binlik ayraçla. Kosova'da nokta kullanılıyor. */
export function formatKm(km: number): string {
  return `${km.toLocaleString('de-DE')} km`;
}

/** Geçerli üretim yılı aralığı. Alt sınır klasik araçlar için geniş. */
export const YEAR_MIN = 1950;
export const yearMax = () => new Date().getFullYear() + 1;
