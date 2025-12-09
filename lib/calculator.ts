import { 
  CITY_SOLAR_DATA, 
  DIRECTION_EFFICIENCY, 
  GRID_PRICING,
  CITIES
} from '../constants';
import { CalculationInput, GlobalSettings, MonthlyData, YearlyData, SimulationResult, ScenarioType, ScenarioResult } from '../types';

interface ScenarioConfig {
  type: ScenarioType;
  offsetTarget: number; // 0.7, 1.0, 1.2
  systemLossFactor: number; // 0.20, 0.15, 0.12
}

const SCENARIOS: ScenarioConfig[] = [
  { type: 'CONSERVATIVE', offsetTarget: 0.7, systemLossFactor: 0.20 },
  { type: 'OPTIMAL', offsetTarget: 1.0, systemLossFactor: 0.15 },
  { type: 'AGGRESSIVE', offsetTarget: 1.2, systemLossFactor: 0.12 },
];

export const calculateSolarSystem = (
  input: CalculationInput, 
  settings: GlobalSettings
): SimulationResult => {
  
  const city = CITIES.find(c => c.id === input.cityId);
  if (!city) throw new Error('Şehir bulunamadı');
  
  const solarData = CITY_SOLAR_DATA[input.cityId];
  if (!solarData) throw new Error('Güneş verisi bulunamadı');
  
  const directionEff = DIRECTION_EFFICIENCY[input.roofDirection] || 1.0;
  const annualConsumption = (input.billAmount / settings.electricityPrice) * 12;
  const maxPowerFromRoof = input.roofArea / 6; // 1kWp ~ 6m2

  const scenarios: Record<string, ScenarioResult> = {};

  SCENARIOS.forEach(config => {
    // 1. Calculate Required Power based on Offset Target
    // Formula: Required = Consumption * Offset / (SpecificYield * (1 - Loss))
    const systemEfficiency = 1 - config.systemLossFactor;
    const specificYield = solarData.avgInsolation * 365 * directionEff;
    
    let targetKW = (annualConsumption * config.offsetTarget) / (specificYield * systemEfficiency);
    
    // 2. Limit by Roof Area
    const actualSystemKW = Math.min(targetKW, maxPowerFromRoof);
    const panelCount = Math.ceil((actualSystemKW * 1000) / settings.panelWattage);
    
    // 3. Monthly Simulation
    const monthlyProduction: MonthlyData[] = solarData.monthlyFactors.map((factor, index) => {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      
      const monthlyInsolation = solarData.avgInsolation * factor;
      const production = actualSystemKW * monthlyInsolation * daysInMonth * systemEfficiency * directionEff;
      const consumption = annualConsumption / 12; // Simplified flat profile
      
      const surplus = Math.max(0, production - consumption);
      const deficit = Math.max(0, consumption - production);
      
      const savings = (Math.min(production, consumption) * settings.electricityPrice) + 
                     (surplus * settings.electricityPrice * GRID_PRICING.sellPriceMultiplier) - 
                     (deficit * settings.electricityPrice * GRID_PRICING.buyPriceMultiplier); // Note: Deficit is a cost, but we track "Savings" against the baseline bill.
      
      // True Savings = Bill Without Solar - Bill With Solar
      // Bill Without Solar = consumption * price
      // Bill With Solar = deficit * price - surplus * sell_price
      // Savings = (consumption * price) - (deficit * price - surplus * sell_price)
      // This simplifies to: self_consumed * price + surplus * sell_price.
      
      return {
        month: monthNames[index],
        production: Math.round(production),
        consumption: Math.round(consumption),
        surplus: Math.round(surplus),
        deficit: Math.round(deficit),
        savings: Math.round(savings)
      };
    });

    // 4. Annual Totals
    const annualProduction = monthlyProduction.reduce((sum, m) => sum + m.production, 0);
    const annualSavings = monthlyProduction.reduce((sum, m) => sum + m.savings, 0);
    const totalSurplus = monthlyProduction.reduce((sum, m) => sum + m.surplus, 0);
    
    // 5. Costs
    const totalCostUSD = actualSystemKW * settings.systemCostPerKw;
    const totalCostTL = totalCostUSD * settings.usdRate;
    
    // 6. 25-Year Projection
    const yearlyAnalysis: YearlyData[] = [];
    let cumulativeSavings = 0;
    let cumulativeCost = totalCostTL;
    let cumulativeBillWithoutSolar = 0;
    
    for (let year = 1; year <= 25; year++) {
      const degFactor = Math.pow(1 - settings.panelDegradationRate, year - 1);
      const infFactor = Math.pow(1 + settings.energyInflationRate, year - 1);
      
      const yProd = annualProduction * degFactor;
      const yCons = annualConsumption; // Assuming constant consumption volume
      const ySavings = annualSavings * degFactor * infFactor;
      
      const yBillWithoutSolar = annualConsumption * settings.electricityPrice * infFactor;
      cumulativeBillWithoutSolar += yBillWithoutSolar;

      // Inverter Replacement at Year 10
      const maintenance = (year === 10) ? (totalCostTL * settings.maintenanceCostPercent) : 0;
      
      cumulativeSavings += ySavings;
      cumulativeCost += maintenance;
      
      yearlyAnalysis.push({
        year,
        production: Math.round(yProd),
        consumption: Math.round(yCons),
        savings: Math.round(ySavings),
        cumulativeSavings: Math.round(cumulativeSavings),
        cumulativeCost: Math.round(cumulativeCost),
        netProfit: Math.round(cumulativeSavings - cumulativeCost),
        roi: parseFloat(((cumulativeSavings / totalCostTL) * 100).toFixed(1)),
        degradationFactor: parseFloat(degFactor.toFixed(4)),
        cashFlowWithoutSolar: -Math.round(cumulativeBillWithoutSolar)
      });
    }

    const roiYear = yearlyAnalysis.find(y => y.netProfit > 0)?.year || 25;
    const selfConsumptionRate = ((Math.min(annualProduction, annualConsumption) / annualProduction) * 100);
    const co2 = (annualProduction * 0.65) / 1000;

    scenarios[config.type] = {
      type: config.type,
      systemSizeKW: parseFloat(actualSystemKW.toFixed(2)),
      panelCount,
      totalCostUSD: Math.round(totalCostUSD),
      totalCostTL: Math.round(totalCostTL),
      roiYears: roiYear,
      netProfit25Years: Math.round(yearlyAnalysis[24].netProfit),
      monthlySavings: Math.round(annualSavings / 12),
      co2Saved: parseFloat(co2.toFixed(2)),
      selfConsumptionRate: parseFloat(selfConsumptionRate.toFixed(1)),
      monthlyProduction,
      yearlyAnalysis,
      averageROI: yearlyAnalysis[24].roi,
      gridSaleRevenue: Math.round(totalSurplus * settings.electricityPrice * GRID_PRICING.sellPriceMultiplier),
      initialInvestment: Math.round(totalCostTL)
    };
  });

  return {
    scenarios: scenarios as unknown as Record<ScenarioType, ScenarioResult>,
    recommendedScenario: 'OPTIMAL',
    city,
    input
  };
};