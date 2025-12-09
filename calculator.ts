import { CalculationInput, CalculationResult, GlobalSettings, RoofDirection, Region } from '../types';
import { CITIES, INSOLATION_BY_REGION, DIRECTION_EFFICIENCY } from '../constants';

export const calculateSolarSystem = (
  input: CalculationInput,
  settings: GlobalSettings
): CalculationResult => {
  const city = CITIES.find(c => c.id === Number(input.cityId));
  if (!city) throw new Error("Şehir bulunamadı");

  const regionInsolation = INSOLATION_BY_REGION[city.region];
  const directionFactor = DIRECTION_EFFICIENCY[input.roofDirection];
  
  // 1. Calculate Annual Consumption (kWh)
  // Bill / Price = Monthly kWh * 12 = Annual
  const monthlyConsumptionKwh = input.billAmount / settings.electricityPrice;
  const annualConsumption = monthlyConsumptionKwh * 12;

  // 2. Calculate Required System Size (kWp)
  // Formula: AnnualConsumption / (DailySunHours * 365 * SystemEfficiency * DirectionFactor)
  // System Efficiency usually ~0.85 (Inverter loss, cabling, heat)
  const SYSTEM_EFFICIENCY = 0.85;
  const effectiveSunHours = regionInsolation * directionFactor;
  
  // We want to offset 100% of consumption ideally
  let requiredCapacity = annualConsumption / (effectiveSunHours * 365 * SYSTEM_EFFICIENCY);

  // 3. Roof Constraint Check
  // Approx 6m2 per 1 kWp
  const maxCapacityByRoof = input.roofArea / 6; 
  
  // Use the smaller of required vs possible
  const systemSizeKW = Math.min(requiredCapacity, maxCapacityByRoof);

  // 4. Panel Count
  const panelCount = Math.ceil(systemSizeKW * 1000 / settings.panelWattage);
  const finalSystemSizeKW = (panelCount * settings.panelWattage) / 1000;

  // 5. Financials
  const totalCostUSD = finalSystemSizeKW * settings.systemCostPerKw;
  const totalCostTL = totalCostUSD * settings.usdRate;

  // 6. Production Estimation
  const annualProduction = finalSystemSizeKW * effectiveSunHours * 365 * SYSTEM_EFFICIENCY;

  // 7. ROI
  const annualSavingsTL = annualProduction * settings.electricityPrice;
  const roiYears = totalCostTL / annualSavingsTL;

  return {
    systemSizeKW: Number(finalSystemSizeKW.toFixed(2)),
    panelCount,
    annualProduction: Number(annualProduction.toFixed(0)),
    annualConsumption: Number(annualConsumption.toFixed(0)),
    totalCostUSD: Number(totalCostUSD.toFixed(0)),
    totalCostTL: Number(totalCostTL.toFixed(0)),
    roiYears: Number(roiYears.toFixed(1)),
    monthlySavings: Number((annualSavingsTL / 12).toFixed(0)),
    co2Saved: Number((annualProduction * 0.45 / 1000).toFixed(2)) // tons
  };
};