
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
  coordinates: { lat: number; lon: number };
  defaultBillAmount: number; // Social proof default value
}

export interface CalculationInput {
  cityId: number;
  roofArea: number;
  roofDirection: RoofDirection;
  billAmount: number; // TL
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
  cashFlowWithoutSolar: number; // Comparison data
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
  usdRate: number;
  electricityPrice: number;
  panelWattage: number;
  systemCostPerKw: number;
  energyInflationRate: number;
  panelDegradationRate: number;
  maintenanceCostPercent: number; // Percent of CAPEX at year 10
}

// --- NEW: Engineering Design Types ---

export interface SolarPanel {
  id: string;
  brand: string;
  model: string;
  powerW: number;      // e.g., 455 W
  voc: number;         // Open Circuit Voltage (e.g., 49.3 V)
  isc: number;         // Short Circuit Current
  vmpp: number;        // Max Power Voltage
  impp: number;        // Max Power Current
  dimensions: { width: number; height: number }; // meters (e.g., 1.048 x 2.108)
  tempCoeffVoc: number; // %/C (e.g., -0.27)
  priceUSD: number;    // Wholesale price per panel
}

export interface Inverter {
  id: string;
  brand: string;
  model: string;
  powerKW: number;     // e.g., 10 kW
  maxInputVoltage: number; // e.g., 1000 V
  mpptVoltageRange: { min: number; max: number }; // e.g., 200 - 850 V
  maxInputCurrent: number; // Max current per MPPT
  priceUSD: number;
}

export interface DesignResult {
  leadId: string;
  selectedPanel: SolarPanel;
  selectedInverter: Inverter;
  tiltAngle: number;
  
  // Module 1: String Sizing
  stringDesign: {
    minPanels: number;
    maxPanels: number;
    vocAtMinTemp: number; // Voltage at -10C
    vmppAtMaxTemp: number; // Voltage at 70C
    isCompatible: boolean;
    reason?: string;
  };

  // Module 2: Shadowing
  shadowAnalysis: {
    minRowSpacing: number; // meters
    solarAltitudeAngle: number; // degrees (Alpha) at Dec 21
    shadowLength: number;
  };

  // Module 3: Capacity
  capacityAnalysis: {
    maxPanelsFit: number;
    totalDCSizeKW: number;
    actualDCSizeKW: number; // Based on string configuration selection (not fully implemented in UI but logic exists)
    rowsPossible: number;
  };
}
