
import emailjs from '@emailjs/browser';
import { Lead } from '../types';

const CONFIG = {
    SERVICE_ID: "solarsmart", 
    TEMPLATE_ID: "template_l62h9d7", 
    PUBLIC_KEY: "sFX5lZDNbFKYA6eMk" 
};

export const EmailService = {
    async sendLeadNotification(lead: Lead): Promise<boolean> {
        const baseUrl = window.location.origin;
        const reportUrl = `${baseUrl}/?proposalId=${lead.id}`;
        
        const formattedCost = lead.proposalPriceUSD 
            ? lead.proposalPriceUSD.toLocaleString('en-US') 
            : lead.estimatedCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
        
        const formattedSystemSize = lead.systemSize.toFixed(2);
        const locationText = lead.city && lead.city !== 'Manuel Giriş' ? lead.city : "Belirtilen Lokasyon";

        const templateParams = {
            to_email: lead.email,
            to_name: lead.fullName,
            city: locationText,
            phone: lead.phone,
            system_size: formattedSystemSize,
            cost: formattedCost,
            report_url: reportUrl,
            subject: `SolarSmart Yatırım Teklifi - ${lead.fullName}`,
            message: `Sayın ${lead.fullName}, ${formattedSystemSize} kWp gücündeki güneş enerjisi sistemi yatırım teklifiniz hazırlanmıştır. Teklif dosyanıza ve detaylı analizinize aşağıdaki linkten ulaşabilirsiniz.`
        };

        try {
            if(CONFIG.PUBLIC_KEY && CONFIG.SERVICE_ID) {
                await emailjs.send(
                    CONFIG.SERVICE_ID,
                    CONFIG.TEMPLATE_ID,
                    templateParams,
                    CONFIG.PUBLIC_KEY
                );
                return true;
            }
            return true;
        } catch (error: any) {
            console.warn("Email Error:", error);
            return false; 
        }
    }
};
