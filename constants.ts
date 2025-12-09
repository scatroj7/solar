import { Region, CityData, RoofDirection, GlobalSettings } from './types';

// Default system settings
export const DEFAULT_SETTINGS: GlobalSettings = {
  usdRate: 32.50, 
  electricityPrice: 3.0, 
  panelWattage: 450, 
  systemCostPerKw: 750, // USD/kW installed
};

// Insolation hours per region (Yearly average hours per day)
export const INSOLATION_BY_REGION: Record<Region, number> = {
  [Region.AKDENIZ]: 5.5,
  [Region.GUNEYDOGU]: 5.2,
  [Region.EGE]: 5.0,
  [Region.IC_ANADOLU]: 4.8,
  [Region.DOGU_ANADOLU]: 4.6,
  [Region.MARMARA]: 4.0,
  [Region.KARADENIZ]: 3.8,
};

// Efficiency loss factor based on direction
export const DIRECTION_EFFICIENCY: Record<RoofDirection, number> = {
  [RoofDirection.SOUTH]: 1.0,
  [RoofDirection.SOUTH_EAST]: 0.95,
  [RoofDirection.SOUTH_WEST]: 0.95,
  [RoofDirection.EAST]: 0.85,
  [RoofDirection.WEST]: 0.85,
  [RoofDirection.NORTH]: 0.60,
};

// Sample Cities
export const CITIES: CityData[] = [
  { id: 1, name: 'Adana', region: Region.AKDENIZ },
  { id: 6, name: 'Ankara', region: Region.IC_ANADOLU },
  { id: 7, name: 'Antalya', region: Region.AKDENIZ },
  { id: 16, name: 'Bursa', region: Region.MARMARA },
  { id: 21, name: 'Diyarbakır', region: Region.GUNEYDOGU },
  { id: 34, name: 'İstanbul', region: Region.MARMARA },
  { id: 35, name: 'İzmir', region: Region.EGE },
  { id: 42, name: 'Konya', region: Region.IC_ANADOLU },
  { id: 61, name: 'Trabzon', region: Region.KARADENIZ },
  { id: 63, name: 'Şanlıurfa', region: Region.GUNEYDOGU },
  { id: 65, name: 'Van', region: Region.DOGU_ANADOLU },
];