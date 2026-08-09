export type CategoryId = 'emlak' | 'vasita' | 'esya';

export const CATEGORIES: { id: CategoryId; icon: string; subs: { id: string }[] }[] = [
  { id: 'emlak', icon: '🏠', subs: [{ id: 'satilik-daire' }, { id: 'kiralik-daire' }, { id: 'satilik-isyeri' }, { id: 'kiralik-isyeri' }, { id: 'arsa' }] },
  { id: 'vasita', icon: '🚗', subs: [{ id: 'otomobil' }, { id: 'arazi-suv' }, { id: 'motosiklet' }, { id: 'ticari' }] },
  { id: 'esya', icon: '📦', subs: [{ id: 'elektronik' }, { id: 'mobilya' }, { id: 'giyim' }, { id: 'diger' }] },
];

export const CITIES = ['Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Mitrovicë', 'Ferizaj', 'Gjilan', 'Vushtrri'];

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Prishtinë': { lat: 42.6629, lng: 21.1655 },
  'Prizren': { lat: 42.2139, lng: 20.7397 },
  'Pejë': { lat: 42.6591, lng: 20.2883 },
  'Gjakovë': { lat: 42.3803, lng: 20.4308 },
  'Mitrovicë': { lat: 42.8914, lng: 20.8660 },
  'Ferizaj': { lat: 42.3706, lng: 21.1550 },
  'Gjilan': { lat: 42.4633, lng: 21.4694 },
  'Vushtrri': { lat: 42.8228, lng: 20.9678 },
};

export const LISTING_EXPIRY_DAYS = 29;
export const MAX_PHOTOS = 5;

export type PlanId = 'standard' | 'premium' | 'enterprise';

export const PLANS: Record<PlanId, { listingLimit: number; showcaseLimit: number; priceEur: number }> = {
  standard: { listingLimit: 3, showcaseLimit: 1, priceEur: 0 },
  premium: { listingLimit: 10, showcaseLimit: 3, priceEur: 5 },
  enterprise: { listingLimit: 100, showcaseLimit: 20, priceEur: 20 },
};

export const PLAN_DURATION_DAYS = 30;

export type CreditType = 'extra_listing' | 'urgent_tag' | 'extra_showcase' | 'highlight';

export const CREDIT_PRICES_EUR: Record<CreditType, number> = {
  extra_listing: 1,
  urgent_tag: 1,
  extra_showcase: 2,
  highlight: 2,
};

export const CAR_BRANDS = [
  'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Ford', 'Opel',
  'Renault', 'Peugeot', 'Škoda', 'Fiat', 'Hyundai', 'Kia', 'Volvo',
  'Citroën', 'Seat', 'Nissan', 'Honda', 'Mazda', 'Mitsubishi', 'Suzuki',
  'Dacia', 'Land Rover', 'Jeep', 'Mini', 'Porsche', 'Chevrolet', 'Other',
];
