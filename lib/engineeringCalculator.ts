import { SolarPanel, Inverter, DesignResult, CityData, ValidationReport, ElectricalConfig, Battery, HeatPump } from '../types';

/**
 * Calculates string sizing based on temperature coefficients.
 * Returns min/max panels per string based on voltage limits.
 */
export const calculateVoltageLimits = (
    panel: SolarPanel,
    inverter: Inverter
): { minPanels: number; maxPanels: number; vocMax: number; vmppMin: number } => {

    let coeffVoc = panel.tempCoeffVoc;
    if (coeffVoc > 0) {
        coeffVoc = -Math.abs(coeffVoc);
    }

    // 1. Max Voltage at Coldest Temp (-10°C)
    // Voc increases as temp drops
    const tempDiffCold = -10 - 25; 
    const voltageRiseFactor = 1 + (tempDiffCold * (coeffVoc / 100));
    const vPanelMax = panel.voc * voltageRiseFactor;

    // Max Panels: Inverter Max Voltage / Panel Max Voc
    const maxPanels = Math.floor(inverter.maxInputVoltage / vPanelMax);

    // 2. Min Voltage at Hottest Temp (70°C)
    // Vmpp drops as temp rises. Must be > Inverter Min MPPT
    const tempDiffHot = 70 - 25; 
    const voltageDropFactor = 1 + (tempDiffHot * (coeffVoc / 100)); // approx same coeff for Vmpp usually
    const vPanelMin = panel.vmpp * voltageDropFactor;

    // Min Panels: Inverter Min MPPT / Panel Min Vmpp
    const minPanels = Math.ceil(inverter.mpptVoltageRange.min / vPanelMin);

    return {
        minPanels,
        maxPanels,
        vocMax: vPanelMax,
        vmppMin: vPanelMin
    };
};

/**
 * Validates Panel Current against Inverter Input Limits
 */
export const validateCurrent = (panel: SolarPanel, inverter: Inverter): { isSafe: boolean; panelIsc: number; inverterMaxI: number } => {
    // Check Amperage Compatibility
    // Panel Short Circuit Current (Isc) must be < Inverter Max Input Current
    // Industrial safety factor often 1.25x (NEC), but here we do strict check per user prompt
    const isSafe = panel.isc <= inverter.maxCurrentPerMppt;
    
    return {
        isSafe,
        panelIsc: panel.isc,
        inverterMaxI: inverter.maxCurrentPerMppt
    };
};

/**
 * AC/DC Ratio (Overloading) Check
 */
export const calculateAcDcRatio = (totalPanelCount: number, panel: SolarPanel, inverter: Inverter) => {
    const totalDcPowerKW = (totalPanelCount * panel.powerW) / 1000;
    const ratio = totalDcPowerKW / inverter.powerKW;

    let status: 'UNDERLOADED' | 'NOMINAL' | 'OPTIMAL' | 'CLIPPING' = 'NOMINAL';
    if (ratio < 0.8) status = 'UNDERLOADED';
    else if (ratio <= 1.1) status = 'NOMINAL';
    else if (ratio <= 1.35) status = 'OPTIMAL';
    else status = 'CLIPPING';

    return { ratio, status };
};

/**
 * Intelligent String & MPPT Distributor
 * Tries to distribute 'totalPanels' evenly across available MPPTs and Strings.
 */
export const distributeStrings = (
    totalPanels: number,
    inverter: Inverter,
    minStr: number,
    maxStr: number
): { success: boolean; config: ElectricalConfig[]; error?: string } => {
    
    if (totalPanels === 0) return { success: true, config: [] };

    const totalAvailableMppts = inverter.mpptCount;
    const maxStringsPerMppt = inverter.maxStringsPerMppt;

    // Strategy 1: Perfect Symmetry (All MPPTs same, All strings same)
    // Try to find a string length L such that:
    // L is between minStr and maxStr
    // TotalPanels % L == 0
    // (TotalPanels / L) <= (totalAvailableMppts * maxStringsPerMppt)
    
    // We prefer longer strings for efficiency (higher voltage, less current loss)
    for (let L = maxStr; L >= minStr; L--) {
        if (totalPanels % L === 0) {
            const numStrings = totalPanels / L;
            if (numStrings <= (totalAvailableMppts * maxStringsPerMppt)) {
                
                // Distribute strings across MPPTs
                const config: ElectricalConfig[] = [];
                let stringsToAssign = numStrings;
                
                for(let m=1; m <= totalAvailableMppts; m++) {
                    if (stringsToAssign <= 0) break;
                    
                    // How many strings can this MPPT take?
                    // Try to balance: stringsToAssign / remainingMPPTs
                    const remainingMppts = totalAvailableMppts - (m - 1);
                    const stringsForThis = Math.ceil(stringsToAssign / remainingMppts);
                    
                    const assign = Math.min(stringsForThis, maxStringsPerMppt);
                    
                    config.push({
                        mpptId: m,
                        stringCount: assign,
                        panelPerString: L
                    });
                    
                    stringsToAssign -= assign;
                }
                
                return { success: true, config };
            }
        }
    }

    // Strategy 2: Unbalanced MPPTs (Not implemented in v1, strict symmetry required for simplicity)
    // For V1, if we can't divide panels evenly into valid strings, we fail.
    return { 
        success: false, 
        config: [], 
        error: `Paneller (${totalPanels} adet) dengeli bir şekilde dizi oluşturulamıyor. String uzunluğu ${minStr}-${maxStr} arası olmalı.` 
    };
};

export const performEngineeringDesign = (
    leadId: string,
    city: CityData,
    roofWidth: number,
    roofLength: number,
    panel: SolarPanel,
    inverter: Inverter,
    tiltAngle: number = 20, 
    isFlatRoof: boolean = false,
    selectedBattery?: Battery,  // New Optional Argument
    selectedHeatPump?: HeatPump // New Optional Argument
): DesignResult => {
    
    // 1. Layout Calculation (Geometric)
    const panelLength = panel.dimensions.height; 
    const shadowResult = calculateShadowSpacing(city.coordinates.lat, tiltAngle, panelLength);

    const LATERAL_GAP = 0.02; 
    const LONGITUDINAL_GAP = 0.05; 
    const capEn = panel.dimensions.width + LATERAL_GAP;
    let capBoy = 0;
    
    if (isFlatRoof) {
        const projection = Math.cos(tiltAngle * (Math.PI / 180)) * panelLength;
        capBoy = projection + shadowResult.minSpacing;
    } else {
        capBoy = panel.dimensions.height + LONGITUDINAL_GAP;
    }

    const nEn = Math.floor(roofWidth / capEn);
    const nBoy = Math.floor(roofLength / capBoy);
    const totalPanelCount = Math.max(0, nEn * nBoy);

    // 2. Electrical Validation (The Brain)
    const messages: { type: 'error' | 'warning' | 'success', text: string }[] = [];
    let isValid = true;

    // A. Current Check
    const currentCheck = validateCurrent(panel, inverter);
    if (!currentCheck.isSafe) {
        isValid = false;
        messages.push({ type: 'error', text: `KRİTİK: Panel akımı (${panel.isc}A) inverter limitini (${inverter.maxCurrentPerMppt}A) aşıyor! Yanma riski.` });
    }

    // B. Voltage Sizing
    const voltageCheck = calculateVoltageLimits(panel, inverter);
    if (voltageCheck.maxPanels < voltageCheck.minPanels) {
        isValid = false;
        messages.push({ type: 'error', text: 'Panel/İnverter voltaj uyumsuzluğu. Max panel sayısı Min sayısından küçük çıkıyor.' });
    }

    // C. AC/DC Ratio
    const acDc = calculateAcDcRatio(totalPanelCount, panel, inverter);
    if (acDc.status === 'CLIPPING') {
        messages.push({ type: 'warning', text: `Aşırı Yükleme: %${(acDc.ratio * 100).toFixed(0)} DC/AC oranı. Clipping kaybı oluşabilir.` });
    } else if (acDc.status === 'UNDERLOADED') {
        messages.push({ type: 'warning', text: `Düşük Yükleme: İnverter kapasitesi boşa harcanıyor (%${(acDc.ratio * 100).toFixed(0)}).` });
    } else {
        messages.push({ type: 'success', text: `Sistem Yüklemesi: %${(acDc.ratio * 100).toFixed(0)} (${acDc.status})` });
    }

    // D. Distribution
    const distResult = distributeStrings(totalPanelCount, inverter, voltageCheck.minPanels, voltageCheck.maxPanels);
    if (!distResult.success) {
        isValid = false;
        messages.push({ type: 'error', text: distResult.error || 'Dizi yapılandırması oluşturulamadı.' });
    }

    // E. Add-on Validation (Optional Logic)
    if(selectedBattery) {
         // Basic compatibility check (Simulated)
         // In real app, we check if inverter supports battery
         if(!selectedBattery.compatibleInverters.includes('All') && !selectedBattery.compatibleInverters.includes(inverter.brand)) {
             messages.push({ type: 'warning', text: `Seçilen batarya (${selectedBattery.brand}) inverter markası (${inverter.brand}) ile uyumsuz olabilir.` });
         } else {
             messages.push({ type: 'success', text: `Batarya Eklendi: ${selectedBattery.brand} ${selectedBattery.capacityKWh}kWh` });
         }
    }

    const engineeringReport: ValidationReport = {
        isValid: isValid && distResult.success,
        acDcRatio: parseFloat(acDc.ratio.toFixed(2)),
        ratioStatus: acDc.status,
        electricalConfig: distResult.config,
        voltageCheck: {
            vocMax: parseFloat(voltageCheck.vocMax.toFixed(1)),
            vmppMin: parseFloat(voltageCheck.vmppMin.toFixed(1)),
            minString: voltageCheck.minPanels,
            maxString: voltageCheck.maxPanels
        },
        currentCheck: {
            panelIsc: panel.isc,
            inverterMaxI: inverter.maxCurrentPerMppt,
            isSafe: currentCheck.isSafe
        },
        messages
    };

    // 3. Visual Grid Generation
    const visualGrid: { x: number; y: number; w: number; h: number }[] = [];
    const renderLimit = 500; 
    let renderedCount = 0;
    for (let r = 0; r < nBoy; r++) {
        for (let c = 0; c < nEn; c++) {
            if(renderedCount >= renderLimit) break;
            visualGrid.push({
                x: c * capEn,
                y: r * capBoy,
                w: panel.dimensions.width,
                h: isFlatRoof ? (Math.cos(tiltAngle * (Math.PI / 180)) * panelLength) : panel.dimensions.height 
            });
            renderedCount++;
        }
    }

    const usedArea = totalPanelCount * (panel.dimensions.width * panel.dimensions.height);
    const roofArea = roofWidth * roofLength;
    const packingEfficiency = roofArea > 0 ? (usedArea / roofArea) * 100 : 0;
    const totalDCSizeKW = (totalPanelCount * panel.powerW) / 1000;

    return {
        leadId,
        selectedPanel: panel,
        selectedInverter: inverter,
        selectedBattery,   // Include in result
        selectedHeatPump,  // Include in result
        tiltAngle,
        engineeringReport, 
        shadowAnalysis: {
            minRowSpacing: isFlatRoof ? shadowResult.minSpacing : 0.02, 
            solarAltitudeAngle: shadowResult.alphaAngle,
            shadowLength: shadowResult.shadowLength
        },
        layoutAnalysis: {
            totalPanelCount,
            rows: nBoy,
            columns: nEn,
            usedArea: parseFloat(usedArea.toFixed(2)),
            packingEfficiency: parseFloat(packingEfficiency.toFixed(1)),
            totalDCSizeKW: parseFloat(totalDCSizeKW.toFixed(2)),
            roofDim: { width: roofWidth, length: roofLength },
            visualGrid
        }
    };
};

/**
 * Calculates the minimum row spacing required to avoid shadowing on Dec 21st (Winter Solstice).
 */
export const calculateShadowSpacing = (
    latitude: number,
    tiltAngle: number, // Beta
    panelLengthM: number // l
): { minSpacing: number; alphaAngle: number; shadowLength: number } => {
    
    // Formula: Alpha (Sun Altitude) = 90 - Latitude - 23.45
    const alphaDegrees = 90 - latitude - 23.45;
    const alphaRadians = alphaDegrees * (Math.PI / 180);
    const tiltRadians = tiltAngle * (Math.PI / 180);

    const tanAlpha = Math.tan(alphaRadians);
    
    if (Math.abs(tanAlpha) < 0.01) {
        const safeShadowLength = 15.0; 
        return { 
            minSpacing: safeShadowLength, 
            alphaAngle: parseFloat(alphaDegrees.toFixed(2)), 
            shadowLength: safeShadowLength 
        };
    }

    // Formula: Shadow Length = Panel_Length * (sin(Beta) / tan(Alpha))
    const shadowLength = panelLengthM * (Math.sin(tiltRadians) / tanAlpha);
    const clampedShadow = Math.min(Math.max(0.5, shadowLength), 20);

    return {
        minSpacing: parseFloat(clampedShadow.toFixed(2)),
        alphaAngle: parseFloat(alphaDegrees.toFixed(2)),
        shadowLength: parseFloat(clampedShadow.toFixed(2))
    };
};