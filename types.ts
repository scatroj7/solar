
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

export enum BuildingType {
  MESKEN = 'Mesken',
  TICARETHANE = 'Ticarethane',
  SANAYI = 'Sanayi'
}

export enum ConsumptionProfile {
  GUNDUZ = 'Gündüz Ağırlıklı', // 08:00 - 18:00
  AKSAM = 'Akşam Ağırlıklı',   // 18:00 sonrası
  DENGELI = '7/24 Dengeli'     // Fabrika / Home Office
}

export interface CityData {
  id: number;
  name: string;
  region: Region;
  coordinates: { lat: number; lon: number };
  defaultBillAmount: number; // Social proof default value
}

export interface CalculationInput {
  cityId: number; 
  coordinates?: { lat: number; lng: number }; 
  locationName?: string; 
  roofArea: number;
  roofDirection: RoofDirection;
  billAmount: number; // TL
  buildingType: BuildingType;
  consumptionProfile: ConsumptionProfile;
  batteryCapacitykWh?: number; 
}

export interface MonthlyData {
  month: string;
  production: number;             // kWh
  consumption: number;            // kWh
  surplus: number;                // kWh
  deficit: number;                // kWh
  savings: number;                // TL
}

export interface YearlyData {
  year: number;
  production: number;
  consumption: number;
  savings: number;
  cumulativeSavings: number;
  cumulativeCost: number;
  netProfit: number;
  roi: number;
  degradationFactor: number;
  cashFlowWithoutSolar: number; 
}

export type ScenarioType = 'CONSERVATIVE' | 'OPTIMAL' | 'AGGRESSIVE';

export interface ScenarioResult {
  type: ScenarioType;
  systemSizeKW: number;
  panelCount: number;
  totalCostUSD: number;
  totalCostTL: number;
  roiYears: number;
  netProfit25Years: number;
  monthlySavings: number;
  co2Saved: number;
  selfConsumptionRate: number;
  monthlyProduction: MonthlyData[];
  yearlyAnalysis: YearlyData[];
  averageROI: number;
  gridSaleRevenue: number;
  initialInvestment: number; // Capex
}

export interface SimulationResult {
  scenarios: Record<ScenarioType, ScenarioResult>;
  recommendedScenario: ScenarioType;
  city: CityData;
  input: CalculationInput;
}

export type LeadStatus = 'New' | 'Contacted' | 'OfferSent' | 'Closed';

// DB'ye kaydedilecek ve oradan okunacak asıl Müşteri Modeli
export interface Lead {
  id: string; // UUID from Supabase
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
  // Raporu tekrar render etmek için gerekli input verisi
  inputData: CalculationInput; 
}

export interface GlobalSettings {
  usdRate: number;
  electricityPrice: number;
  panelWattage: number;
  systemCostPerKw: number;
  energyInflationRate: number;
  panelDegradationRate: number;
  maintenanceCostPercent: number; 
}

export interface SolarPanel {
  id: string;
  brand: string;
  model: string;
  powerW: number;      
  voc: number;         
  isc: number;         
  vmpp: number;        
  impp: number;        
  dimensions: { width: number; height: number }; 
  tempCoeffVoc: number; 
  priceUSD: number;    
}

export interface Inverter {
  id: string;
  brand: string;
  model: string;
  powerKW: number;     
  maxInputVoltage: number; 
  mpptVoltageRange: { min: number; max: number }; 
  maxInputCurrent: number; 
  priceUSD: number;
}

export interface DesignResult {
  leadId: string;
  selectedPanel: SolarPanel;
  selectedInverter: Inverter;
  tiltAngle: number;
  
  stringDesign: {
    minPanels: number;
    maxPanels: number;
    vocAtMinTemp: number; 
    vmppAtMaxTemp: number; 
    isCompatible: boolean;
    reason?: string;
  };

  shadowAnalysis: {
    minRowSpacing: number; 
    solarAltitudeAngle: number; 
    shadowLength: number;
  };

  layoutAnalysis: {
    totalPanelCount: number;
    rows: number;
    columns: number;
    usedArea: number;
    packingEfficiency: number; 
    totalDCSizeKW: number;
    roofDim: { width: number; length: number };
    visualGrid: { x: number; y: number; w: number; h: number }[]; 
  };
}
