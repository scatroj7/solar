
import { Region, CityData, RoofDirection, GlobalSettings, SolarPanel, Inverter } from './types';

// Default system settings
export const DEFAULT_SETTINGS: GlobalSettings = {
  usdRate: 34.50, 
  electricityPrice: 3.5, 
  panelWattage: 550, // Updated to modern panel standard
  systemCostPerKw: 800, // USD/kW installed (Tier 1 equipment)
  energyInflationRate: 0.05, // 5% yearly real increase
  panelDegradationRate: 0.005, // 0.5% yearly
  maintenanceCostPercent: 0.05, // 5% of CAPEX for inverter change at year 10
};

// Efficiency loss factor based on direction
export const DIRECTION_EFFICIENCY: Record<RoofDirection, number> = {
  [RoofDirection.SOUTH]: 1.0,
  [RoofDirection.SOUTH_EAST]: 0.96,
  [RoofDirection.SOUTH_WEST]: 0.96,
  [RoofDirection.EAST]: 0.88,
  [RoofDirection.WEST]: 0.88,
  [RoofDirection.NORTH]: 0.65,
};

// Sample Cities with Geospatial Data & Social Proof Defaults
export const CITIES: CityData[] = [
  { id: 1, name: 'Adana', region: Region.AKDENIZ, coordinates: { lat: 37.00, lon: 35.32 }, defaultBillAmount: 2200 },
  { id: 6, name: 'Ankara', region: Region.IC_ANADOLU, coordinates: { lat: 39.93, lon: 32.85 }, defaultBillAmount: 1600 },
  { id: 7, name: 'Antalya', region: Region.AKDENIZ, coordinates: { lat: 36.89, lon: 30.71 }, defaultBillAmount: 2400 },
  { id: 16, name: 'Bursa', region: Region.MARMARA, coordinates: { lat: 40.18, lon: 29.06 }, defaultBillAmount: 1800 },
  { id: 21, name: 'Diyarbakır', region: Region.GUNEYDOGU, coordinates: { lat: 37.91, lon: 40.23 }, defaultBillAmount: 2100 },
  { id: 34, name: 'İstanbul', region: Region.MARMARA, coordinates: { lat: 41.00, lon: 28.97 }, defaultBillAmount: 1950 },
  { id: 35, name: 'İzmir', region: Region.EGE, coordinates: { lat: 38.42, lon: 27.14 }, defaultBillAmount: 2000 },
  { id: 42, name: 'Konya', region: Region.IC_ANADOLU, coordinates: { lat: 37.87, lon: 32.48 }, defaultBillAmount: 1500 },
  { id: 61, name: 'Trabzon', region: Region.KARADENIZ, coordinates: { lat: 41.00, lon: 39.71 }, defaultBillAmount: 1400 },
  { id: 63, name: 'Şanlıurfa', region: Region.GUNEYDOGU, coordinates: { lat: 37.15, lon: 38.79 }, defaultBillAmount: 2300 },
  { id: 65, name: 'Van', region: Region.DOGU_ANADOLU, coordinates: { lat: 38.50, lon: 43.37 }, defaultBillAmount: 1700 },
];

// Her şehir için detaylı güneşlenme verileri (GEPA verileri)
export const CITY_SOLAR_DATA: Record<number, {
  avgInsolation: number;      // Yıllık ortalama günlük güneşlenme (saat)
  monthlyFactors: number[];   // 12 aylık çarpanlar (Ocak-Aralık)
  peakSunHours: number;       // Yıllık toplam güneşlenme saati
}> = {
  1: {  // Adana
    avgInsolation: 5.5,
    monthlyFactors: [0.60, 0.70, 0.85, 1.00, 1.15, 1.25, 1.30, 1.28, 1.15, 0.95, 0.75, 0.60],
    peakSunHours: 2007
  },
  6: {  // Ankara
    avgInsolation: 4.8,
    monthlyFactors: [0.55, 0.65, 0.85, 1.00, 1.20, 1.30, 1.35, 1.30, 1.10, 0.90, 0.65, 0.50],
    peakSunHours: 1752
  },
  7: {  // Antalya
    avgInsolation: 5.6,
    monthlyFactors: [0.62, 0.72, 0.87, 1.02, 1.18, 1.28, 1.32, 1.30, 1.18, 0.98, 0.78, 0.62],
    peakSunHours: 2044
  },
  16: { // Bursa
    avgInsolation: 4.2,
    monthlyFactors: [0.58, 0.68, 0.83, 0.98, 1.15, 1.25, 1.28, 1.25, 1.08, 0.88, 0.68, 0.55],
    peakSunHours: 1533
  },
  21: { // Diyarbakır
    avgInsolation: 5.3,
    monthlyFactors: [0.58, 0.68, 0.85, 1.02, 1.20, 1.30, 1.35, 1.32, 1.15, 0.92, 0.72, 0.58],
    peakSunHours: 1935
  },
  34: { // İstanbul
    avgInsolation: 4.0,
    monthlyFactors: [0.55, 0.65, 0.80, 0.95, 1.15, 1.25, 1.30, 1.25, 1.05, 0.85, 0.65, 0.52],
    peakSunHours: 1460
  },
  35: { // İzmir
    avgInsolation: 5.1,
    monthlyFactors: [0.60, 0.70, 0.85, 1.00, 1.18, 1.27, 1.32, 1.28, 1.12, 0.92, 0.72, 0.60],
    peakSunHours: 1861
  },
  42: { // Konya
    avgInsolation: 5.0,
    monthlyFactors: [0.56, 0.66, 0.84, 1.00, 1.20, 1.30, 1.35, 1.30, 1.12, 0.90, 0.70, 0.55],
    peakSunHours: 1825
  },
  61: { // Trabzon (Karadeniz)
    avgInsolation: 3.8,
    monthlyFactors: [0.52, 0.62, 0.78, 0.92, 1.12, 1.22, 1.28, 1.22, 1.02, 0.82, 0.62, 0.50],
    peakSunHours: 1387
  },
  63: { // Şanlıurfa
    avgInsolation: 5.4,
    monthlyFactors: [0.58, 0.68, 0.86, 1.03, 1.22, 1.32, 1.36, 1.33, 1.16, 0.93, 0.73, 0.58],
    peakSunHours: 1971
  },
  65: { // Van (Doğu Anadolu)
    avgInsolation: 4.6,
    monthlyFactors: [0.50, 0.60, 0.80, 0.98, 1.20, 1.30, 1.38, 1.32, 1.10, 0.88, 0.65, 0.48],
    peakSunHours: 1679
  }
};

// Şebeke alım/satım oranları
export const GRID_PRICING = {
  buyPriceMultiplier: 1.0,    // Şebekeden alım (normal fiyat)
  sellPriceMultiplier: 0.6    // Şebekeye satış (EPDK Lisanssız Üretim Yönetmeliği gereği genellikle daha düşük)
};

// --- MOCK DATABASE (EQUIPMENT) ---

export const MOCK_PANELS: SolarPanel[] = [
  {
    id: 'p1',
    brand: 'CW Enerji',
    model: 'CW-108PM-455W',
    powerW: 455,
    voc: 49.30,
    isc: 11.60,
    vmpp: 41.50,
    impp: 10.97,
    dimensions: { width: 1.048, height: 2.108 },
    tempCoeffVoc: -0.27,
    priceUSD: 145
  },
  {
    id: 'p2',
    brand: 'TommaTech',
    model: 'TT-545-144PM',
    powerW: 545,
    voc: 49.60,
    isc: 13.90,
    vmpp: 41.80,
    impp: 13.04,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 175
  },
  {
    id: 'p3',
    brand: 'Jinko Solar',
    model: 'Tiger Neo 600W',
    powerW: 600,
    voc: 51.50,
    isc: 14.50,
    vmpp: 42.80,
    impp: 14.02,
    dimensions: { width: 1.134, height: 2.465 },
    tempCoeffVoc: -0.25,
    priceUSD: 200
  }
];

export const MOCK_INVERTERS: Inverter[] = [
  {
    id: 'inv1',
    brand: 'Huawei',
    model: 'SUN2000-10KTL',
    powerKW: 10,
    maxInputVoltage: 1100,
    mpptVoltageRange: { min: 140, max: 980 },
    maxInputCurrent: 13.5,
    priceUSD: 1200
  },
  {
    id: 'inv2',
    brand: 'Huawei',
    model: 'SUN2000-20KTL',
    powerKW: 20,
    maxInputVoltage: 1100,
    mpptVoltageRange: { min: 200, max: 800 },
    maxInputCurrent: 22,
    priceUSD: 1800
  },
  {
    id: 'inv3',
    brand: 'Growatt',
    model: 'MID 15KTL3-X',
    powerKW: 15,
    maxInputVoltage: 1100,
    mpptVoltageRange: { min: 200, max: 1000 },
    maxInputCurrent: 26,
    priceUSD: 1400
  },
  {
    id: 'inv4',
    brand: 'Fronius',
    model: 'Symo 10.0-3-M',
    powerKW: 10,
    maxInputVoltage: 1000,
    mpptVoltageRange: { min: 200, max: 800 },
    maxInputCurrent: 27,
    priceUSD: 1600
  }
];
