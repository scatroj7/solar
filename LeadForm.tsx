import React, { useState } from 'react';
import { Button, Input } from './ui/UIComponents';
import { LeadService } from '../services/mockService';
import { CalculationInput, CalculationResult } from '../types';
import { CITIES } from '../constants';

interface LeadFormProps {
  inputData: CalculationInput;
  resultData: CalculationResult;
  onSuccess: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ inputData, resultData, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const cityName = CITIES.find(c => c.id === Number(inputData.cityId))?.name || 'Unknown';
      
      LeadService.create({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        city: cityName,
        billAmount: inputData.billAmount,
        roofArea: inputData.roofArea,
        systemSize: resultData.systemSizeKW,
        estimatedCost: resultData.totalCostUSD
      });
      
      setLoading(false);
      onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Ad Soyad" 
          required 
          placeholder="Örn: Ahmet Yılmaz"
          value={formData.fullName}
          onChange={e => setFormData({...formData, fullName: e.target.value})}
        />
        <Input 
          label="Telefon" 
          required 
          type="tel" 
          placeholder="555 123 45 67"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />
      </div>
      <Input 
        label="E-posta" 
        required 
        type="email" 
        placeholder="ahmet@ornek.com"
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
      />
      <Button 
        type="submit" 
        className="w-full bg-energy-500 hover:bg-energy-600 text-white font-bold"
        disabled={loading}
      >
        {loading ? 'Gönderiliyor...' : 'Ücretsiz Teklif Al'}
      </Button>
      <p className="text-xs text-center text-slate-500 mt-2">
        Bilgileriniz KVKK kapsamında korunmaktadır.
      </p>
    </form>
  );
};