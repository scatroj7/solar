
import { SolarPanel, Inverter, DesignResult, CityData } from '../types';

/**
 * Calculates string sizing based on temperature coefficients.
 * Returns compatible string lengths (min/max).
 */
export const calculateStringSizing = (
    panel: SolarPanel,
    inverter: Inverter
): { minPanels: number; maxPanels: number; vocMax: number; vmppMin: number; isCompatible: boolean; reason?: string } => {

    let coeffVoc = panel.tempCoeffVoc;
    if (coeffVoc > 0) {
        // Safety fix for positive coefficient input
        coeffVoc = -Math.abs(coeffVoc);
    }

    // 1. Calculate Max Voltage at Coldest Temp (-10°C)
    const tempDiffCold = -10 - 25; 
    const voltageRiseFactor = 1 + (tempDiffCold * (coeffVoc / 100));
    const vPanelMax = panel.voc * voltageRiseFactor;

    // Max Panels per String
    const maxPanels = Math.floor(inverter.maxInputVoltage / vPanelMax);

    // 2. Calculate Min Voltage at Hottest Temp (70°C) for MPPT Activation
    const tempDiffHot = 70 - 25; 
    const voltageDropFactor = 1 + (tempDiffHot * (coeffVoc / 100));
    const vPanelMin = panel.vmpp * voltageDropFactor;

    // Min Panels per String
    const minPanels = Math.ceil(inverter.mpptVoltageRange.min / vPanelMin);

    let isCompatible = true;
    let reason = "";

    if (maxPanels < minPanels) {
        isCompatible = false;
        reason = "Panel voltaj aralığı inverter MPPT aralığına uymuyor (Max < Min).";
    }

    if (panel.impp > inverter.maxInputCurrent) {
         reason = reason ? reason + " Ayrıca panel akımı inverter giriş akımından yüksek (clipping oluşabilir)." : "Panel akımı inverter giriş sınırını aşıyor.";
    }

    return {
        minPanels,
        maxPanels,
        vocMax: vPanelMax,
        vmppMin: vPanelMin,
        isCompatible,
        reason
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
    
    // CRITICAL FIX: Prevent division by zero or extremely large values
    if (Math.abs(tanAlpha) < 0.01) {
        const safeShadowLength = 15.0; // Reasonable default limit
        return { 
            minSpacing: safeShadowLength, 
            alphaAngle: parseFloat(alphaDegrees.toFixed(2)), 
            shadowLength: safeShadowLength 
        };
    }

    // Formula: Shadow Length = Panel_Length * (sin(Beta) / tan(Alpha))
    const shadowLength = panelLengthM * (Math.sin(tiltRadians) / tanAlpha);
    
    // Safety clamp for visualization (avoid drawing 100m shadows)
    const clampedShadow = Math.min(Math.max(0.5, shadowLength), 20);

    return {
        minSpacing: parseFloat(clampedShadow.toFixed(2)),
        alphaAngle: parseFloat(alphaDegrees.toFixed(2)),
        shadowLength: parseFloat(clampedShadow.toFixed(2))
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
    isFlatRoof: boolean = false
): DesignResult => {
    
    const stringResult = calculateStringSizing(panel, inverter);
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
    const totalPanelCount = Math.max(0, nEn * nBoy); // Prevent negative

    const visualGrid: { x: number; y: number; w: number; h: number }[] = [];
    
    // Limit grid rendering for performance if too many panels
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
        tiltAngle,
        stringDesign: {
            minPanels: stringResult.minPanels,
            maxPanels: stringResult.maxPanels,
            vocAtMinTemp: parseFloat(stringResult.vocMax.toFixed(2)),
            vmppAtMaxTemp: parseFloat(stringResult.vmppMin.toFixed(2)),
            isCompatible: stringResult.isCompatible,
            reason: stringResult.reason
        },
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
