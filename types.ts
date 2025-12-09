export enum RoofDirection {
  SOUTH = 'Güney',
  SOUTH_EAST = 'Güney-Doğu',
  SOUTH_WEST = 'Güney-Batı',
  EAST = 'Doğu',
  WEST = 'Batı',
  NORTH = 'Kuzey'
}

export enum Region {
  AKDENIZ = 'Akdeniz',
  GUNEYDOGU = 'Güneydoğu Anadolu',
  EGE = 'Ege',
  IC_ANADOLU = 'İç Anadolu',
  DOGU_ANADOLU = 'Doğu Anadolu',
  MARMARA = 'Marmara',
  KARADENIZ = 'Karadeniz'
}

export interface CityData {
  id: number;
  name: string;
  region: Region;
}

export interface CalculationInput {
  cityId: number;
  roofArea: number;
  roofDirection: RoofDirection;
  billAmount: number; // TL
}

export interface CalculationResult {
  systemSizeKW: number;
  panelCount: number;
  annualProduction: number; // kWh
  annualConsumption: number; // kWh
  totalCostUSD: number;
  totalCostTL: number;
  roiYears: number;
  monthlySavings: number;
  co2Saved: number;
}

export type LeadStatus = 'New' | 'Contacted' | 'OfferSent' | 'Closed';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  systemSize: number;
  estimatedCost: number;
  billAmount: number;
  roofArea: number;
  status: LeadStatus;
  createdAt: string;
}

export interface GlobalSettings {
  usdRate: number;         // Dolar Kuru
  electricityPrice: number; // Elektrik Birim Fiyatı (TL/kWh)
  panelWattage: number;    // Panel Gücü (W)
  systemCostPerKw: number; // kW Başına Kurulum Maliyeti (USD)
}