import { 
  CITY_SOLAR_DATA, 
  DIRECTION_EFFICIENCY, 
  GRID_PRICING,
  CITIES,
  TARIFF_RATES,
  PROFILE_SCR
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

// Helper to find closest city solar data if exact API not available
const findClosestCityData = (lat: number, lng: number) => {
    let closestCityId = 6; // Default Ankara
    let minDist = Infinity;

    CITIES.forEach(city => {
        const d = Math.sqrt(
            Math.pow(city.coordinates.lat - lat, 2) + 
            Math.pow(city.coordinates.lon - lng, 2)
        );
        if (d < minDist) {
            minDist = d;
            closestCityId = city.id;
        }
    });

    // FIX: Warn if location is very far (> approx 200km or 1.8 degrees)
    if (minDist > 1.8) {
        console.warn(`Location is far from nearest city data point (Dist: ${minDist.toFixed(2)} deg). Solar estimates may vary.`);
    }
    
    return {
        data: CITY_SOLAR_DATA[closestCityId],
        cityInfo: CITIES.find(c => c.id === closestCityId)!
    };
}

export const calculateSolarSystem = (
  input: CalculationInput, 
  settings: GlobalSettings
): SimulationResult => {
  
  // 1. Get Solar Data (Dynamic Location)
  let solarData;
  let cityInfo;

  if (input.coordinates) {
      const nearest = findClosestCityData(input.coordinates.lat, input.coordinates.lng);
      solarData = nearest.data;
      cityInfo = nearest.cityInfo;
      // Note: In a real app, we would fetch specific irradiation data from Open-Meteo here.
  } else {
      // Fallback legacy
      const city = CITIES.find(c => c.id === input.cityId);
      if (!city) throw new Error('Şehir bulunamadı');
      cityInfo = city;
      solarData = CITY_SOLAR_DATA[input.cityId];
  }
  
  if (!solarData) throw new Error('Güneş verisi bulunamadı');
  
  const directionEff = DIRECTION_EFFICIENCY[input.roofDirection] || 1.0;
  
  // 2. Determine Electricity Price based on Building Type
  const electricityPrice = TARIFF_RATES[input.buildingType] || settings.electricityPrice;

  const annualConsumption = (input.billAmount / electricityPrice) * 12;
  const maxPowerFromRoof = input.roofArea / 6; // 1kWp ~ 6m2

  const scenarios: Record<string, ScenarioResult> = {};

  SCENARIOS.forEach(config => {
    // 3. Calculate Required Power based on Offset Target
    const systemEfficiency = 1 - config.systemLossFactor;
    const specificYield = solarData.avgInsolation * 365 * directionEff;
    
    let targetKW = (annualConsumption * config.offsetTarget) / (specificYield * systemEfficiency);
    
    // 4. Limit by Roof Area
    const actualSystemKW = Math.min(targetKW, maxPowerFromRoof);
    const panelCount = Math.ceil((actualSystemKW * 1000) / settings.panelWattage);
    
    // 5. Get SCR (Self Consumption Rate) from Profile
    // We adjust it slightly based on the scenario type (Conservative scenario implies less optimization)
    let baseSCR = PROFILE_SCR[input.consumptionProfile] || 0.65;
    if (config.type === 'CONSERVATIVE') baseSCR -= 0.05;
    if (config.type === 'AGGRESSIVE') baseSCR += 0.05;
    baseSCR = Math.min(0.95, Math.max(0.20, baseSCR)); // Clamp

    // 6. Monthly Simulation
    const monthlyProduction: MonthlyData[] = solarData.monthlyFactors.map((factor, index) => {
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index];
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      
      const monthlyInsolation = solarData.avgInsolation * factor;
      const production = actualSystemKW * monthlyInsolation * daysInMonth * systemEfficiency * directionEff;
      const consumption = annualConsumption / 12; // Simplified flat profile
      
      // Dynamic SCR Logic per month (Summer higher production might lower SCR if consumption is flat)
      // For simplicity, we use the Base SCR to split production.
      const selfConsumed = Math.min(production, consumption) * baseSCR; 
      const surplus = Math.max(0, production - selfConsumed);
      
      // Note: "Deficit" is grid import. "SelfConsumed" is savings. "Surplus" is sold.
      // Net Bill = (Consumption - SelfConsumed) * BuyPrice - (Surplus * SellPrice)
      // Savings = OldBill - NetBill
      // OldBill = Consumption * BuyPrice
      // Savings = (SelfConsumed * BuyPrice) + (Surplus * SellPrice)

      const savings = (selfConsumed * electricityPrice) + 
                     (surplus * electricityPrice * GRID_PRICING.sellPriceMultiplier);
      
      return {
        month: monthNames[index],
        production: Math.round(production),
        consumption: Math.round(consumption),
        surplus: Math.round(surplus),
        deficit: Math.round(Math.max(0, consumption - selfConsumed)),
        savings: Math.round(savings)
      };
    });

    // 7. Annual Totals
    const annualProduction = monthlyProduction.reduce((sum, m) => sum + m.production, 0);
    const annualSavings = monthlyProduction.reduce((sum, m) => sum + m.savings, 0);
    const totalSurplus = monthlyProduction.reduce((sum, m) => sum + m.surplus, 0);
    
    // 8. Costs
    const totalCostUSD = actualSystemKW * settings.systemCostPerKw;
    const totalCostTL = totalCostUSD * settings.usdRate;
    
    // 9. 25-Year Projection
    const yearlyAnalysis: YearlyData[] = [];
    let cumulativeSavings = 0;
    let cumulativeCost = totalCostTL;
    let cumulativeBillWithoutSolar = 0;
    
    for (let year = 1; year <= 25; year++) {
      const degFactor = Math.pow(1 - settings.panelDegradationRate, year - 1);
      const infFactor = Math.pow(1 + settings.energyInflationRate, year - 1);
      
      const yProd = annualProduction * degFactor;
      const yCons = annualConsumption; 
      const ySavings = annualSavings * degFactor * infFactor;
      
      const yBillWithoutSolar = annualConsumption * electricityPrice * infFactor;
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
    const calculatedSCR = ((annualProduction - totalSurplus) / annualProduction) * 100;
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
      selfConsumptionRate: parseFloat(calculatedSCR.toFixed(1)),
      monthlyProduction,
      yearlyAnalysis,
      averageROI: yearlyAnalysis[24].roi,
      gridSaleRevenue: Math.round(totalSurplus * electricityPrice * GRID_PRICING.sellPriceMultiplier),
      initialInvestment: Math.round(totalCostTL)
    };
  });

  return {
    scenarios: scenarios as unknown as Record<ScenarioType, ScenarioResult>,
    recommendedScenario: 'OPTIMAL',
    city: cityInfo,
    input
  };
};