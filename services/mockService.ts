
import { Lead, GlobalSettings, SolarPanel, Inverter, Battery, HeatPump } from '../types';
import { DEFAULT_SETTINGS, MOCK_PANELS, MOCK_INVERTERS, MOCK_BATTERIES, MOCK_HEATPUMPS } from '../constants';

// Simulating a database using localStorage for the demo environment
const LEADS_KEY = 'solarsmart_leads';
const SETTINGS_KEY = 'solarsmart_settings';
const AUTH_KEY = 'solarsmart_auth_token';

// Equipment Keys
const EQ_PANELS_KEY = 'solarsmart_eq_panels';
const EQ_INVERTERS_KEY = 'solarsmart_eq_inverters';
const EQ_BATTERIES_KEY = 'solarsmart_eq_batteries';
const EQ_HEATPUMPS_KEY = 'solarsmart_eq_heatpumps';

export const AuthService = {
  login: (password: string): boolean => {
    // Mock authentication - simple password check
    if (password === 'admin123') {
      localStorage.setItem(AUTH_KEY, 'valid_token');
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};

export const LeadService = {
  getAll: (): Lead[] => {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  },

  create: (lead: Omit<Lead, 'id' | 'createdAt' | 'status'>): void => {
    const leads = LeadService.getAll();
    const newLead: Lead = {
      ...lead,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'New'
    };
    leads.unshift(newLead);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  },

  updateStatus: (id: string, status: Lead['status']): void => {
    const leads = LeadService.getAll();
    // FIX: Ensure spread operator is used correctly (...)
    const updated = leads.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem(LEADS_KEY, JSON.stringify(updated));
  }
};

export const SettingsService = {
  get: (): GlobalSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    
    // FIX: Ensure spread operator is used correctly (...)
    // Merge with default to ensure no missing keys if schema changes
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  },
  
  update: (settings: GlobalSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

// --- NEW EQUIPMENT SERVICE ---
export const EquipmentService = {
    getPanels: (): SolarPanel[] => {
        const data = localStorage.getItem(EQ_PANELS_KEY);
        return data ? JSON.parse(data) : MOCK_PANELS;
    },
    savePanels: (items: SolarPanel[]) => localStorage.setItem(EQ_PANELS_KEY, JSON.stringify(items)),

    getInverters: (): Inverter[] => {
        const data = localStorage.getItem(EQ_INVERTERS_KEY);
        return data ? JSON.parse(data) : MOCK_INVERTERS;
    },
    saveInverters: (items: Inverter[]) => localStorage.setItem(EQ_INVERTERS_KEY, JSON.stringify(items)),

    getBatteries: (): Battery[] => {
        const data = localStorage.getItem(EQ_BATTERIES_KEY);
        return data ? JSON.parse(data) : MOCK_BATTERIES;
    },
    saveBatteries: (items: Battery[]) => localStorage.setItem(EQ_BATTERIES_KEY, JSON.stringify(items)),

    getHeatPumps: (): HeatPump[] => {
        const data = localStorage.getItem(EQ_HEATPUMPS_KEY);
        return data ? JSON.parse(data) : MOCK_HEATPUMPS;
    },
    saveHeatPumps: (items: HeatPump[]) => localStorage.setItem(EQ_HEATPUMPS_KEY, JSON.stringify(items)),
};
