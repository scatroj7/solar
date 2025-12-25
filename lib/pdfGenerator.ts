
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, Lead, DesignResult } from '../types';

export const generateProposalPDF = async (
    proposal: Proposal, 
    lead: Lead, 
    designResult: DesignResult | null
) => {
    // Wait for the hidden template to be rendered in the DOM
    const captureRoot = document.getElementById('proposal-capture-root');
    if (!captureRoot) {
        console.error("Proposal capture root not found");
        return;
    }

    // Temporarily show the template for capture
    captureRoot.style.display = 'block';
    captureRoot.style.position = 'absolute';
    captureRoot.style.left = '-9999px';

    // Increased timeout to ensure Static Maps images are fully loaded
    await new Promise(resolve => setTimeout(resolve, 3000));

    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
    });
    
    // Capture each of the 4 pages defined in ProposalTemplate
    for (let i = 1; i <= 4; i++) {
        const pageElement = document.getElementById(`proposal-page-${i}`);
        if (!pageElement) continue;

        const canvas = await html2canvas(pageElement, {
            scale: 2.5, // High DPI capture for crisp text
            useCORS: true, // Required for Static Map images
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // Standard A4 pixel width @ 96dpi
            windowHeight: 1123,
            onclone: (clonedDoc) => {
                const clonedRoot = clonedDoc.getElementById('proposal-capture-root');
                if (clonedRoot) clonedRoot.style.display = 'block';
            }
        });

        // Use JPEG for better performance with large images
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 1) {
            pdf.addPage();
        }

        // Add to PDF fitting the whole A4 page (210mm x 297mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'SLOW');
    }

    // Hide the template again
    captureRoot.style.display = 'none';

    // Save PDF
    const safeName = lead.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `solarsmart_yatirim_teklifi_${safeName}.pdf`;
    pdf.save(fileName);
};
