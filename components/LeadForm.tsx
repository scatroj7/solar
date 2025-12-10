
import React, { useState } from 'react';
import { Button, Input, Dialog } from './ui/UIComponents';
import { LeadService } from '../services/mockService';
import { CalculationInput, ScenarioResult } from '../types';
import { CITIES } from '../constants';
import html2canvas from 'html2canvas';

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
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailContent, setEmailContent] = useState('');

  // Helper to generate the HTML Email Template
  const generateEmailTemplate = (name: string, city: string, result: ScenarioResult, chartImage: string) => {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #0A2342; padding: 25px; text-align: center;">
             <h2 style="color: #ffffff; margin: 0; font-size: 24px;">SolarSmart Fizibilite Raporu</h2>
             <p style="color: #FF9F1C; margin: 5px 0 0 0; font-size: 14px;">Güneşin Gücünü Keşfedin</p>
        </div>

        <div style="padding: 25px;">
            <p>Merhaba <strong>${name}</strong>,</p>
            <p>${city} bölgesindeki eviniz için yaptığımız güneş enerjisi potansiyel analizi tamamlandı. İşte geleceğiniz:</p>
            
            <!-- Key Metrics Grid -->
            <div style="display: flex; gap: 10px; margin: 20px 0; background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; color: #64748b;">Sistem Gücü</div>
                    <div style="font-size: 18px; font-weight: bold; color: #0A2342;">${result.systemSizeKW} kWp</div>
                </div>
                <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; color: #64748b;">Yatırım</div>
                    <div style="font-size: 18px; font-weight: bold; color: #0A2342;">$${result.totalCostUSD.toLocaleString()}</div>
                </div>
                <div style="flex: 1; text-align: center; border-right: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; color: #64748b;">Amortisman</div>
                    <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${result.roiYears} Yıl</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 12px; color: #64748b;">25 Yıllık Kazanç</div>
                    <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${result.netProfit25Years.toLocaleString()} TL</div>
                </div>
            </div>

            <!-- Chart Image -->
            <div style="margin: 25px 0; text-align: center;">
                <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Analiz Grafikleri:</p>
                <img src="${chartImage}" alt="Analiz Grafiği" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0;" />
            </div>

            <p style="line-height: 1.6;">Uzman mühendislerimiz 24 saat içinde çatınızın uydu görüntüleri üzerinden <strong>gölge analizi</strong> yapacak ve net fiyat teklifi için sizi <strong>${formData.phone}</strong> numarasından arayacaktır.</p>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="#" style="background-color: #FF9F1C; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Teklifi Online İncele</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p>Bu e-posta SolarSmart demo uygulaması tarafından otomatik oluşturulmuştur.</p>
        </div>
      </div>
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // FIX: Prioritize the detected location name from Google Maps. Fallback to CITIES lookup or 'Bilinmiyor'.
    const cityName = inputData.locationName || CITIES.find(c => c.id === Number(inputData.cityId))?.name || 'Bilinmiyor';

    // 1. Capture the Charts from the DOM
    let chartBase64 = '';
    const chartElement = document.getElementById('summary-charts');
    
    if (chartElement) {
        try {
            const canvas = await html2canvas(chartElement, {
                scale: 1, // Normal resolution for email to keep size down
                backgroundColor: '#ffffff'
            });
            chartBase64 = canvas.toDataURL('image/png');
        } catch (err) {
            console.error("Chart capture failed", err);
        }
    }

    // 2. Generate the Email Content with the captured image
    const emailHtml = generateEmailTemplate(formData.fullName, cityName, resultData, chartBase64);
    setEmailContent(emailHtml);
    
    // Simulate API delay
    setTimeout(() => {
      // 3. Save Lead
      LeadService.create({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        city: cityName, // Use the correct city/district name
        billAmount: inputData.billAmount,
        roofArea: inputData.roofArea,
        systemSize: resultData.systemSizeKW,
        estimatedCost: resultData.totalCostUSD
      });
      
      setLoading(false);
      
      // 4. Show Email Preview (Demo Feature) instead of just closing
      setShowEmailPreview(true);
    }, 1500);
  };

  const handleClosePreview = () => {
    setShowEmailPreview(false);
    onSuccess(); // Update parent state to show "Success Card"
  };

  return (
    <>
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
                 Rapor Hazırlanıyor...
             </span>
          ) : 'Ücretsiz Teklif Al'}
        </Button>
        <p className="text-xs text-center text-slate-500 mt-2">
          Bilgileriniz KVKK kapsamında korunmaktadır.
        </p>
      </form>

      {/* Email Simulation Modal */}
      <Dialog 
        isOpen={showEmailPreview} 
        onClose={handleClosePreview} 
        title="✉️ E-posta Simülasyonu"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm">
            <strong>Başarılı!</strong> Canlı sistemde müşteriye aşağıdaki formatta, grafikleri içeren bir e-posta gönderilecektir:
          </div>
          <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-inner max-h-[600px] overflow-y-auto">
             <div dangerouslySetInnerHTML={{ __html: emailContent }} />
          </div>
          <div className="flex justify-end">
             <Button onClick={handleClosePreview}>Tamam</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
