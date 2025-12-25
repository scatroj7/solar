import { Region, CityData, RoofDirection, GlobalSettings, SolarPanel, Inverter, BuildingType, ConsumptionProfile, Battery, HeatPump } from './types';

// Default system settings
export const DEFAULT_SETTINGS: GlobalSettings = {
  usdRate: 34.50, 
  electricityPrice: 2.40, // Base Price (Mesken) 
  panelWattage: 550, // Updated to modern panel standard
  systemCostPerKw: 800, // USD/kW installed (Tier 1 equipment)
  energyInflationRate: 0.05, // 5% yearly real increase
  panelDegradationRate: 0.005, // 0.5% yearly
  maintenanceCostPercent: 0.05, // 5% of CAPEX for inverter change at year 10
};

// --- NEW: Dynamic Tariff Rates (TL/kWh) ---
export const TARIFF_RATES: Record<BuildingType, number> = {
  [BuildingType.MESKEN]: 2.40,
  [BuildingType.TICARETHANE]: 4.50,
  [BuildingType.SANAYI]: 4.00
};

// --- NEW: Self Consumption Rates (SCR) ---
export const PROFILE_SCR: Record<ConsumptionProfile, number> = {
  [ConsumptionProfile.GUNDUZ]: 0.90,  // Excellent match
  [ConsumptionProfile.DENGELI]: 0.65, // Standard match
  [ConsumptionProfile.AKSAM]: 0.40    // Poor match (mostly selling)
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

export const CITY_SOLAR_DATA: Record<number, {
  avgInsolation: number;      
  monthlyFactors: number[];   
  peakSunHours: number;       
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

export const GRID_PRICING = {
  buyPriceMultiplier: 1.0,    
  sellPriceMultiplier: 0.6    
};

// --- MOCK DATABASE (EQUIPMENT) ---

export const MOCK_PANELS: SolarPanel[] = [
  // --- 400W - 455W (Eski Standart / Dar Çatılar İçin) ---
  {
    id: 'cw-455',
    brand: 'CW Enerji',
    model: '144-PM 455W',
    powerW: 455,
    voc: 49.3,
    isc: 11.6,
    vmpp: 41.5,
    impp: 10.97,
    dimensions: { width: 1.048, height: 2.108 },
    tempCoeffVoc: -0.28,
    priceUSD: 125
  },
  {
    id: 'ht-400',
    brand: 'HT Solar',
    model: 'HT-400W',
    powerW: 400,
    voc: 41.2,
    isc: 11.5,
    vmpp: 34.4,
    impp: 11.63,
    dimensions: { width: 1.002, height: 2.008 },
    tempCoeffVoc: -0.29,
    priceUSD: 110
  },
  
  // --- 545W - 550W (Piyasa Standardı / Fiyat-Perf.) ---
  {
    id: 'cw-550',
    brand: 'CW Enerji',
    model: '144-PM 550W',
    powerW: 550,
    voc: 49.8,
    isc: 13.9,
    vmpp: 41.9,
    impp: 13.13,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 140
  },
  {
    id: 'alfa-550',
    brand: 'Alfa Solar',
    model: 'ALFA-550W Half-Cut',
    powerW: 550,
    voc: 49.9,
    isc: 14.0,
    vmpp: 42.0,
    impp: 13.10,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 138
  },
  {
    id: 'tomma-545',
    brand: 'TommaTech',
    model: 'TT-545-144PM',
    powerW: 545,
    voc: 49.6,
    isc: 13.9,
    vmpp: 41.8,
    impp: 13.04,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 145
  },
  {
    id: 'smart-550',
    brand: 'Smart Solar',
    model: 'Phono Solar 550W',
    powerW: 550,
    voc: 49.8,
    isc: 13.95,
    vmpp: 41.9,
    impp: 13.12,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 142
  },
  {
    id: 'gazio-550',
    brand: 'Gazioğlu Solar',
    model: 'GZ-550W',
    powerW: 550,
    voc: 49.7,
    isc: 13.92,
    vmpp: 41.85,
    impp: 13.14,
    dimensions: { width: 1.134, height: 2.279 },
    tempCoeffVoc: -0.27,
    priceUSD: 139
  },

  // --- 600W+ (Yeni Nesil / Yüksek Verim / Proje Tipi) ---
  {
    id: 'jinko-575',
    brand: 'Jinko Solar',
    model: 'Tiger Neo N-Type 575W',
    powerW: 575,
    voc: 51.5,
    isc: 14.2,
    vmpp: 42.8,
    impp: 13.43,
    dimensions: { width: 1.134, height: 2.278 },
    tempCoeffVoc: -0.25, // N-Type avantajı
    priceUSD: 165
  },
  {
    id: 'jinko-615',
    brand: 'Jinko Solar',
    model: 'Tiger Neo N-Type 615W',
    powerW: 615,
    voc: 55.6,
    isc: 14.5, // DİKKAT: Yüksek Akım!
    vmpp: 46.2,
    impp: 13.32,
    dimensions: { width: 1.134, height: 2.465 },
    tempCoeffVoc: -0.25,
    priceUSD: 180
  },
  {
    id: 'astro-605',
    brand: 'Astronergy',
    model: 'ASTRO N5s 605W',
    powerW: 605,
    voc: 54.2,
    isc: 14.1,
    vmpp: 45.1,
    impp: 13.41,
    dimensions: { width: 1.134, height: 2.465 },
    tempCoeffVoc: -0.26,
    priceUSD: 175
  },
  {
    id: 'canadian-650',
    brand: 'Canadian Solar',
    model: 'BiHiKu7 650W',
    powerW: 650,
    voc: 38.5, // Düşük voltaj
    isc: 18.4, // ÇOK YÜKSEK AKIM (Özel inverter ister)
    vmpp: 32.1,
    impp: 17.2,
    dimensions: { width: 1.303, height: 2.384 }, // Geniş kasa
    tempCoeffVoc: -0.26,
    priceUSD: 195
  },
  {
    id: 'cw-670',
    brand: 'CW Enerji',
    model: '132-PM 670W',
    powerW: 670,
    voc: 45.9,
    isc: 18.5,
    vmpp: 38.5,
    impp: 17.4,
    dimensions: { width: 1.303, height: 2.384 },
    tempCoeffVoc: -0.27,
    priceUSD: 200
  }
];

export const MOCK_INVERTERS: Inverter[] = [
  // --- EV & VİLLA TİPİ (3kW - 10kW) ---
  {
    id: 'huawei-5ktl',
    brand: 'Huawei',
    model: 'SUN2000-5KTL-L1',
    powerKW: 5,
    mpptCount: 2,
    maxStringsPerMppt: 1,
    maxCurrentPerMppt: 12.5, // Düşük
    maxInputVoltage: 600,
    startVoltage: 100,
    mpptVoltageRange: { min: 90, max: 560 },
    priceUSD: 850
  },
  {
    id: 'huawei-10ktl',
    brand: 'Huawei',
    model: 'SUN2000-10KTL-M1',
    powerKW: 10,
    mpptCount: 2,
    maxStringsPerMppt: 1,
    maxCurrentPerMppt: 13.5, 
    maxInputVoltage: 1100,
    startVoltage: 200,
    mpptVoltageRange: { min: 140, max: 980 },
    priceUSD: 1200
  },
  {
    id: 'fronius-5',
    brand: 'Fronius',
    model: 'Primo 5.0-1',
    powerKW: 5,
    mpptCount: 2,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 12,
    maxInputVoltage: 1000,
    startVoltage: 80,
    mpptVoltageRange: { min: 80, max: 800 },
    priceUSD: 1100
  },
  {
    id: 'fronius-10',
    brand: 'Fronius',
    model: 'Symo 10.0-3-M',
    powerKW: 10,
    mpptCount: 2,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 27, // Toplam akım
    maxInputVoltage: 1000,
    startVoltage: 200,
    mpptVoltageRange: { min: 200, max: 800 },
    priceUSD: 1600
  },
  {
    id: 'growatt-10',
    brand: 'Growatt',
    model: 'MOD 10KTL3-X',
    powerKW: 10,
    mpptCount: 2,
    maxStringsPerMppt: 1,
    maxCurrentPerMppt: 13,
    maxInputVoltage: 1100,
    startVoltage: 160,
    mpptVoltageRange: { min: 140, max: 1000 },
    priceUSD: 950
  },

  // --- TİCARİ TİP (15kW - 50kW) ---
  {
    id: 'huawei-20ktl',
    brand: 'Huawei',
    model: 'SUN2000-20KTL-M2',
    powerKW: 20,
    mpptCount: 2,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 22,
    maxInputVoltage: 1080,
    startVoltage: 200,
    mpptVoltageRange: { min: 160, max: 950 },
    priceUSD: 1850
  },
  {
    id: 'growatt-30',
    brand: 'Growatt',
    model: 'MID 30KTL3-X',
    powerKW: 30,
    mpptCount: 3,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 26,
    maxInputVoltage: 1100,
    startVoltage: 250,
    mpptVoltageRange: { min: 200, max: 1000 },
    priceUSD: 1500
  },
  {
    id: 'huawei-50ktl',
    brand: 'Huawei',
    model: 'SUN2000-50KTL-M3',
    powerKW: 50,
    mpptCount: 4,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 30, // Yüksek akım destekler
    maxInputVoltage: 1100,
    startVoltage: 200,
    mpptVoltageRange: { min: 200, max: 1000 },
    priceUSD: 3500
  },
  {
    id: 'fronius-tauro-50',
    brand: 'Fronius',
    model: 'Tauro 50-3-D',
    powerKW: 50,
    mpptCount: 3,
    maxStringsPerMppt: 4, 
    maxCurrentPerMppt: 36,
    maxInputVoltage: 1000,
    startVoltage: 200,
    mpptVoltageRange: { min: 200, max: 870 },
    priceUSD: 4200
  },

  // --- ENDÜSTRİYEL TİP (100kW+) ---
  {
    id: 'huawei-100ktl',
    brand: 'Huawei',
    model: 'SUN2000-100KTL-M1',
    powerKW: 100,
    mpptCount: 10, // Çoklu MPPT Canavarı
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 26,
    maxInputVoltage: 1100,
    startVoltage: 200,
    mpptVoltageRange: { min: 200, max: 1000 },
    priceUSD: 6500
  },
  {
    id: 'solis-110k',
    brand: 'Solis',
    model: 'S5-GC110K',
    powerKW: 110,
    mpptCount: 10,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 32, // Bifacial paneller için uygun
    maxInputVoltage: 1100,
    startVoltage: 195,
    mpptVoltageRange: { min: 180, max: 1000 },
    priceUSD: 5800
  },
  {
    id: 'sungrow-110',
    brand: 'Sungrow',
    model: 'SG110CX',
    powerKW: 110,
    mpptCount: 9,
    maxStringsPerMppt: 2,
    maxCurrentPerMppt: 26,
    maxInputVoltage: 1100,
    startVoltage: 250,
    mpptVoltageRange: { min: 200, max: 1000 },
    priceUSD: 6200
  }
];

// --- NEW: BATTERY DATA (v1.1) ---
export const MOCK_BATTERIES: Battery[] = [
    {
        id: 'huawei-luna-5',
        brand: 'Huawei',
        model: 'LUNA2000-5-S0',
        capacityKWh: 5,
        maxOutputKW: 2.5,
        compatibleInverters: ['Huawei'],
        priceUSD: 2400
    },
    {
        id: 'huawei-luna-10',
        brand: 'Huawei',
        model: 'LUNA2000-10-S0',
        capacityKWh: 10,
        maxOutputKW: 5.0,
        compatibleInverters: ['Huawei'],
        priceUSD: 4500
    },
    {
        id: 'huawei-luna-15',
        brand: 'Huawei',
        model: 'LUNA2000-15-S0',
        capacityKWh: 15,
        maxOutputKW: 5.0,
        compatibleInverters: ['Huawei'],
        priceUSD: 6500
    },
    {
        id: 'byd-hvs-5.1',
        brand: 'BYD',
        model: 'Battery-Box Premium HVS 5.1',
        capacityKWh: 5.1,
        maxOutputKW: 5.1,
        compatibleInverters: ['Fronius', 'Kostal', 'GoodWe'],
        priceUSD: 2800
    },
    {
        id: 'byd-hvs-10.2',
        brand: 'BYD',
        model: 'Battery-Box Premium HVS 10.2',
        capacityKWh: 10.2,
        maxOutputKW: 10.2,
        compatibleInverters: ['Fronius', 'Kostal', 'GoodWe'],
        priceUSD: 5400
    },
    {
        id: 'pylontech-us5000',
        brand: 'Pylontech',
        model: 'US5000 48V',
        capacityKWh: 4.8,
        maxOutputKW: 2.4,
        compatibleInverters: ['Solis', 'Growatt', 'Victron'],
        priceUSD: 1600
    }
];

// --- NEW: HEAT PUMP DATA (v1.1) ---
export const MOCK_HEATPUMPS: HeatPump[] = [
    {
        id: 'daikin-8kw',
        brand: 'Daikin',
        model: 'Altherma 3 - 8kW',
        thermalPowerKW: 8,
        cop: 4.6,
        priceUSD: 4500
    },
    {
        id: 'daikin-16kw',
        brand: 'Daikin',
        model: 'Altherma 3 H HT - 16kW',
        thermalPowerKW: 16,
        cop: 4.4,
        priceUSD: 7200
    },
    {
        id: 'viessmann-10kw',
        brand: 'Viessmann',
        model: 'Vitocal 200-S 10kW',
        thermalPowerKW: 10.1,
        cop: 4.8,
        priceUSD: 5800
    },
    {
        id: 'mitsubishi-12kw',
        brand: 'Mitsubishi',
        model: 'Ecodan 12kW Split',
        thermalPowerKW: 12,
        cop: 4.5,
        priceUSD: 6100
    }
];