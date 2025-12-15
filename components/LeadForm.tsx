
import React, { useState } from 'react';
import { Button, Input, Dialog } from './ui/UIComponents';
import { DB } from '../services/db';
import { EmailService } from '../services/emailService';
import { CalculationInput, ScenarioResult } from '../types';
import { CITIES } from '../constants';

interface LeadFormProps {
  inputData: CalculationInput;
  resultData: ScenarioResult;
  onSuccess: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ inputData, resultData, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('Sistem kaydediliyor...');
    
    const cityName = inputData.locationName || CITIES.find(c => c.id === Number(inputData.cityId))?.name || 'Bilinmiyor';

    try {
        // 1. Veritabanına Kaydet (Supabase)
        const savedLead = await DB.createLead({
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            city: cityName,
            billAmount: inputData.billAmount,
            roofArea: inputData.roofArea,
            systemSize: resultData.systemSizeKW,
            estimatedCost: resultData.totalCostUSD,
            inputData: inputData // ÖNEMLİ: Input verisini saklıyoruz ki raporda tekrar hesaplayabilelim
        });

        if (savedLead) {
            setStatusMsg('E-posta gönderiliyor...');
            // 2. Email Gönder (Rapor Linkiyle)
            await EmailService.sendLeadNotification(savedLead);
            
            setStatusMsg('Tamamlandı!');
            setTimeout(() => {
                onSuccess();
                setLoading(false);
            }, 1000);
        } else {
            throw new Error("Kayıt oluşturulamadı.");
        }

    } catch (error) {
        console.error(error);
        setStatusMsg('Bir hata oluştu.');
        setLoading(false);
        alert("Başvuru alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
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
          {loading ? (
             <span className="flex items-center gap-2">
                 <Loader2 className="h-4 w-4 animate-spin" /> {statusMsg}
             </span>
          ) : 'Ücretsiz Teklif Al'}
        </Button>
        <p className="text-xs text-center text-slate-500 mt-2">
          Bilgileriniz KVKK kapsamında korunmaktadır.
        </p>
    </form>
  );
};

// Simple Loader Icon import shim if needed inside this file scope, 
// though typically it's imported from lucide-react in parent.
const Loader2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
