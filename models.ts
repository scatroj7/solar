// NOTE: This file represents the Server-Side MongoDB Schema logic.
// In a real Next.js app, this would be in models/Calculation.ts and models/Settings.ts

import mongoose, { Schema, Document } from 'mongoose';

// --- Calculation/Lead Schema ---
export interface ILead extends Document {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district?: string;
  billAmount: number;
  roofArea: number;
  calculatedSystemSize: number;
  estimatedCostUSD: number;
  status: 'New' | 'Contacted' | 'OfferSent' | 'Closed';
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String },
  billAmount: { type: Number, required: true },
  roofArea: { type: Number, required: true },
  calculatedSystemSize: { type: Number, required: true },
  estimatedCostUSD: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'OfferSent', 'Closed'], 
    default: 'New' 
  },
  createdAt: { type: Date, default: Date.now }
});

// export const LeadModel = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

// --- Settings Schema ---
export interface ISettings extends Document {
  usdRate: number;
  electricityPrice: number;
  panelWattage: number;
  panelPriceUSD: number;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  usdRate: { type: Number, required: true },
  electricityPrice: { type: Number, required: true },
  panelWattage: { type: Number, required: true },
  panelPriceUSD: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
