
import emailjs from '@emailjs/browser';
import { Lead } from '../types';

// CONFIG (Bu kısmı .env'den de çekebilirsin ama şimdilik burada kalsın)
const CONFIG = {
    SERVICE_ID: "solarsmart", 
    TEMPLATE_ID: "template_l62h9d7", 
    PUBLIC_KEY: "sFX5lZDNbFKYA6eMk" 
};

export const EmailService = {
    async sendLeadNotification(lead: Lead): Promise<boolean> {
        // Rapor Linki oluşturma
        const baseUrl = window.location.origin;
        const reportUrl = `${baseUrl}/?proposalId=${lead.id}`;

        // Formatlama işlemleri (Client-side formatting)
        // DÜZELTME: Birimleri (kWp, $) koddan kaldırdık. 
        // HTML şablonunda 'Sistem Gücü: {{system_size}} kWp' şeklinde kullanılacak.
        
        // "4.029" şeklinde string döner (Currency sembolü YOK)
        const formattedCost = lead.estimatedCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
        
        // "5.04" şeklinde string döner (Birim YOK)
        const formattedSystemSize = lead.systemSize.toFixed(2);
        
        const locationText = lead.city && lead.city !== 'Manuel Giriş' ? lead.city : "Belirtilen Lokasyon";

        const templateParams = {
            // EmailJS Standart Parametreleri
            to_email: lead.email,    // Alıcı mail adresi
            to_name: lead.fullName,  // Alıcı adı
            
            // Şablon Değişkenleri
            city: locationText,
            phone: lead.phone,
            
            system_size: formattedSystemSize, // Örn: "5.04"
            cost: formattedCost,              // Örn: "4.029"
            
            report_url: reportUrl,
            reply_to: "info@solarsmart.com" 
        };

        try {
            if(CONFIG.PUBLIC_KEY && CONFIG.SERVICE_ID) {
                await emailjs.send(
                    CONFIG.SERVICE_ID,
                    CONFIG.TEMPLATE_ID,
                    templateParams,
                    CONFIG.PUBLIC_KEY
                );
                console.log("Email başarıyla gönderildi (Kuyruğa alındı).");
                return true;
            } else {
                console.log("[MOCK] Email Config eksik. Gönderim simüle edildi.", templateParams);
                return true;
            }
        } catch (error: any) {
            const errorMessage = error?.text || error?.message || JSON.stringify(error, null, 2);
            console.warn("Email Servis Uyarısı (İşlem devam edecek):", errorMessage);
            return true; 
        }
    }
};
