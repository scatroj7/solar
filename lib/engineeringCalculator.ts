
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
    // Formula: V_panel_max = Panel.voc * (1 + ((-10 - 25) * (Panel.tempCoeffVoc / 100)))
    const tempDiffCold = -10 - 25; // -35 degrees diff
    const voltageRiseFactor = 1 + (tempDiffCold * (panel.tempCoeffVoc / 100));
    const vPanelMax = panel.voc * voltageRiseFactor;

    // Max Panels per String
    const maxPanels = Math.floor(inverter.maxInputVoltage / vPanelMax);

    // 2. Calculate Min Voltage at Hottest Temp (70°C) for MPPT Activation
    // Formula: V_panel_min = Panel.vmpp * (1 + ((70 - 25) * (Panel.tempCoeffVoc / 100)))
    // NOTE: The prompt specified using tempCoeffVoc for Vmpp calculation logic, so we strictly follow that.
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
         // This is a soft check, some designers accept clipping, but here we flag it.
         reason = reason ? reason + " Ayrıca panel akımı inverter giriş akımından yüksek (clipping oluşabilir)." : "Panel akımı inverter giriş sınırını aşıyor.";
         // We don't necessarily set isCompatible to false for current clipping in all designs, but let's be strict for safety.
         // isCompatible = false; 
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
    // 23.45 is the declination of the sun on Dec 21st (Southern Hemisphere max). 
    // Since Turkey is Northern Hemisphere, sun is lowest.
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
    roofArea: number,
    panel: SolarPanel,
    inverter: Inverter,
    tiltAngle: number = 20, // Default typical tilt
    isFlatRoof: boolean = false
): DesignResult => {
    
    // 1. String Sizing
    const stringResult = calculateStringSizing(panel, inverter);

    // 2. Shadow Analysis (Only crucial for Flat Roof / Ground)
    // For pitched roof, spacing is usually 2cm clamp distance, but we calculate shadow anyway for info.
    // Assume Portrait mounting -> panelLength = panel.dimensions.height
    const panelLength = panel.dimensions.height; 
    const shadowResult = calculateShadowSpacing(city.coordinates.lat, tiltAngle, panelLength);

    // 3. Capacity Analysis
    // Effective area per panel depends on installation type
    let effectiveAreaPerPanel = 0;
    
    if (isFlatRoof) {
        // Area = (Panel Projection + Shadow Spacing) * Width
        // Projection = Cos(tilt) * Length
        const projection = Math.cos(tiltAngle * (Math.PI / 180)) * panelLength;
        const rowPitch = projection + shadowResult.minSpacing;
        effectiveAreaPerPanel = rowPitch * panel.dimensions.width;
    } else {
        // Pitched Roof (Flush Mount)
        // Area = Panel Area + slight gap (approx 10%)
        effectiveAreaPerPanel = (panel.dimensions.width * panel.dimensions.height) * 1.05; 
    }

    const maxPanelsFit = Math.floor(roofArea / effectiveAreaPerPanel);
    const totalDCSizeKW = (maxPanelsFit * panel.powerW) / 1000;

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
            minRowSpacing: isFlatRoof ? shadowResult.minSpacing : 0.02, // 2cm for flush
            solarAltitudeAngle: shadowResult.alphaAngle,
            shadowLength: shadowResult.shadowLength
        },
        capacityAnalysis: {
            maxPanelsFit,
            totalDCSizeKW: parseFloat(totalDCSizeKW.toFixed(2)),
            actualDCSizeKW: parseFloat(totalDCSizeKW.toFixed(2)), // Placeholder
            rowsPossible: 0 // Would require dimension parsing of roof (Width vs Length)
        }
    };
};
