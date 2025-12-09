import { Lead, GlobalSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// Simulating a database using localStorage for the demo environment
const LEADS_KEY = 'solarsmart_leads';
const SETTINGS_KEY = 'solarsmart_settings';
const AUTH_KEY = 'solarsmart_auth_token';

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
    const updated = leads.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem(LEADS_KEY, JSON.stringify(updated));
  }
};

export const SettingsService = {
  get: (): GlobalSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    
    // Merge with default to ensure no missing keys if schema changes
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  },
  
  update: (settings: GlobalSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};