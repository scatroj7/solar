
import { SolarPanel, Inverter, DesignResult, CityData } from '../types';

/**
 * Calculates string sizing based on temperature coefficients.
 * Returns compatible string lengths (min/max).
 */
export const calculateStringSizing = (
    panel: SolarPanel,
    inverter: Inverter
): { minPanels: number; maxPanels: number; vocMax: number; vmppMin: number; isCompatible: boolean; reason?: string } => {

    // 1. Calculate Max Voltage at Coldest Temp (-10°C)
    const tempDiffCold = -10 - 25; // -35 degrees diff
    const voltageRiseFactor = 1 + (tempDiffCold * (panel.tempCoeffVoc / 100));
    const vPanelMax = panel.voc * voltageRiseFactor;

    // Max Panels per String
    const maxPanels = Math.floor(inverter.maxInputVoltage / vPanelMax);

    // 2. Calculate Min Voltage at Hottest Temp (70°C) for MPPT Activation
    const tempDiffHot = 70 - 25; // 45 degrees diff
    const voltageDropFactor = 1 + (tempDiffHot * (panel.tempCoeffVoc / 100));
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
    panelLengthM: number // l (typically height if portrait)
): { minSpacing: number; alphaAngle: number; shadowLength: number } => {
    
    // Formula: Alpha (Sun Altitude) = 90 - Latitude - 23.45
    const alphaDegrees = 90 - latitude - 23.45;
    const alphaRadians = alphaDegrees * (Math.PI / 180);
    const tiltRadians = tiltAngle * (Math.PI / 180);

    // Formula: Shadow Length = Panel_Length * (sin(Beta) / tan(Alpha))
    const shadowLength = panelLengthM * (Math.sin(tiltRadians) / Math.tan(alphaRadians));
    
    // Minimum clean distance (d) is effectively the shadow length
    return {
        minSpacing: parseFloat(shadowLength.toFixed(2)),
        alphaAngle: parseFloat(alphaDegrees.toFixed(2)),
        shadowLength: parseFloat(shadowLength.toFixed(2))
    };
};

/**
 * Main Engineering Calculation Function
 */
export const performEngineeringDesign = (
    leadId: string,
    city: CityData,
    roofWidth: number,
    roofLength: number,
    panel: SolarPanel,
    inverter: Inverter,
    tiltAngle: number = 20, // Default typical tilt
    isFlatRoof: boolean = false
): DesignResult => {
    
    // 1. String Sizing
    const stringResult = calculateStringSizing(panel, inverter);

    // 2. Shadow Analysis
    // Assume Portrait mounting -> panelLength = panel.dimensions.height
    const panelLength = panel.dimensions.height; 
    const shadowResult = calculateShadowSpacing(city.coordinates.lat, tiltAngle, panelLength);

    // 3. Layout & Capacity Analysis
    
    // Gaps (clamps and expansion joints)
    const LATERAL_GAP = 0.02; // 2cm side gap
    const LONGITUDINAL_GAP = 0.05; // 5cm vertical gap

    // Effective dimensions per unit (footprint)
    const capEn = panel.dimensions.width + LATERAL_GAP;
    
    // For flat roof, the effective 'length' includes the shadow spacing
    let capBoy = 0;
    let rowPitch = 0;

    if (isFlatRoof) {
        // Projection on ground = cos(tilt) * length
        const projection = Math.cos(tiltAngle * (Math.PI / 180)) * panelLength;
        // Pitch = Projection + Shadow Free Distance
        rowPitch = projection + shadowResult.minSpacing;
        capBoy = rowPitch;
    } else {
        // Flush mount on pitched roof
        capBoy = panel.dimensions.height + LONGITUDINAL_GAP;
        rowPitch = capBoy;
    }

    // Number of panels
    const nEn = Math.floor(roofWidth / capEn);
    const nBoy = Math.floor(roofLength / capBoy);
    const totalPanelCount = nEn * nBoy;

    // Generate Visual Grid Data
    // Coordinates are relative to Top-Left (0,0) of the roof
    const visualGrid: { x: number; y: number; w: number; h: number }[] = [];
    
    for (let r = 0; r < nBoy; r++) {
        for (let c = 0; c < nEn; c++) {
            visualGrid.push({
                x: c * capEn,
                y: r * capBoy,
                // We draw the actual panel size, the gaps are just spacing
                w: panel.dimensions.width,
                h: isFlatRoof ? (Math.cos(tiltAngle * (Math.PI / 180)) * panelLength) : panel.dimensions.height // Draw projection for flat roof top-down view
            });
        }
    }

    const usedArea = totalPanelCount * (panel.dimensions.width * panel.dimensions.height);
    const roofArea = roofWidth * roofLength;
    const packingEfficiency = (usedArea / roofArea) * 100;

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
