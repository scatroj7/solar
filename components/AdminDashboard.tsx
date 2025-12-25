import React, { useState, useEffect } from 'react';
import { 
  LogOut, ExternalLink, PenTool, Zap, Settings as SettingsIcon, Save,
  Users, Layout, DollarSign, AlertTriangle, CheckCircle, XCircle, Gauge, Battery as BatteryIcon, Thermometer,
  Plus, Trash2, Edit2, Box, X, Calculator, FileText, Send, Link as LinkIcon, Lock,
  LayoutGrid, List, FileDown, MessageCircle, Share2, Mail, Loader2
} from 'lucide-react';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Tabs, TabsList, TabsTrigger, 
  TabsContent, Toast, Badge, Logo, Dialog
} from './ui/UIComponents';
import { DB } from '../services/db';
import { SettingsService, EquipmentService } from '../services/mockService';
import { Lead, LeadStatus, GlobalSettings, DesignResult, ValidationReport, SolarPanel, Inverter, Battery, HeatPump, Proposal } from '../types';
import { CITIES } from '../constants';
import { performEngineeringDesign } from '../lib/engineeringCalculator';
import { generateProposalPDF } from '../lib/pdfGenerator';
import { ProposalTemplate } from './ProposalTemplate';
import { EmailService } from '../services/emailService';

// --- Design Studio Sub-Component ---
interface DesignStudioProps {
    leads: Lead[];
    panels: SolarPanel[];
    inverters: Inverter[];
    batteries: Battery[];
    heatPumps: HeatPump[];
    onProposalGenerated: () => void; // Callback to refresh lead list
    initialLeadId?: string; // NEW PROP: To pre-select lead from other tabs
}

const DesignStudio = ({ leads, panels, inverters, batteries, heatPumps, onProposalGenerated, initialLeadId }: DesignStudioProps) => {
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [selectedPanelId, setSelectedPanelId] = useState<string>('');
    const [selectedInverterId, setSelectedInverterId] = useState<string>('');
    
    // --- Sub-Tab Navigation State ---
    const [activeSubTab, setActiveSubTab] = useState<'engineering' | 'commercial'>('engineering');

    // Update defaults when props change
    useEffect(() => {
        if (panels.length > 0 && !selectedPanelId) setSelectedPanelId(panels[0].id);
        if (inverters.length > 0 && !selectedInverterId) setSelectedInverterId(inverters[0].id);
    }, [panels, inverters]);

    // FIX: Auto-select lead if initialLeadId is provided OR if leads exist but none selected
    useEffect(() => {
        if (initialLeadId) {
            setSelectedLeadId(initialLeadId);
        } else if (!selectedLeadId && leads.length > 0) {
            setSelectedLeadId(leads[0].id);
        }
    }, [leads, initialLeadId]);

    const [selectedBatteryId, setSelectedBatteryId] = useState<string>('');
    const [selectedHeatPumpId, setSelectedHeatPumpId] = useState<string>('');
    
    const [tiltAngle, setTiltAngle] = useState<number>(20);
    const [isFlatRoof, setIsFlatRoof] = useState<boolean>(false);
    
    const [roofWidth, setRoofWidth] = useState<number>(10);
    const [roofLength, setRoofLength] = useState<number>(10);
    
    const [designResult, setDesignResult] = useState<DesignResult | null>(null);

    // --- COMMERCIAL STATE ---
    const [commercialForm, setCommercialForm] = useState({
        laborCost: 500,
        overheadCost: 300,
        marginPercent: 20, // 20% Markup
        taxRate: 20
    });
    const [lastProposal, setLastProposal] = useState<Proposal | null>(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // 1. Sync Data: Update form inputs when Lead Data changes (or ID changes)
    useEffect(() => {
        if(selectedLeadId) {
            const lead = leads.find(l => l.id === selectedLeadId);
            if(lead) {
                const side = Math.sqrt(lead.roofArea);
                setRoofWidth(parseFloat(side.toFixed(1)));
                setRoofLength(parseFloat(side.toFixed(1)));
            }
        }
    }, [selectedLeadId, leads]);

    // 2. Reset UI: Only reset results/modal when the USER selects a NEW lead ID
    useEffect(() => {
        setDesignResult(null); // Reset result on lead change
        setActiveSubTab('engineering'); // Reset tab to engineering
        setLastProposal(null);
    }, [selectedLeadId]);

    const handleDesign = () => {
        if (!selectedLeadId) return alert("Lütfen bir müşteri seçiniz.");
        const lead = leads.find(l => l.id === selectedLeadId);
        if (!lead) return;

        const city = CITIES.find(c => c.name === lead.city) || CITIES.find(c => c.id === 6); 
        const panel = panels.find(p => p.id === selectedPanelId);
        const inverter = inverters.find(i => i.id === selectedInverterId);
        const battery = selectedBatteryId ? batteries.find(b => b.id === selectedBatteryId) : undefined;
        const heatPump = selectedHeatPumpId ? heatPumps.find(h => h.id === selectedHeatPumpId) : undefined;

        if (!city || !panel || !inverter) {
            console.error("Missing Data:", { city, panel, inverter });
            return alert("Veri hatası: Seçilen donanım veritabanında bulunamadı.");
        }

        const result = performEngineeringDesign(
            lead.id, 
            city, 
            roofWidth, 
            roofLength, 
            panel, 
            inverter, 
            tiltAngle, 
            isFlatRoof,
            battery,
            heatPump
        );
        setDesignResult(result);
        
        // FIX: Auto-switch to Commercial Tab if Engineering is Valid
        if (result.engineeringReport.isValid) {
            setActiveSubTab('commercial');
        }
    };

    // Calculate Financials Live
    const calculateFinancials = () => {
        if(!designResult) return { hardware: 0, totalCost: 0, finalPrice: 0, profit: 0 };
        
        const panelCost = designResult.layoutAnalysis.totalPanelCount * designResult.selectedPanel.priceUSD;
        const inverterCost = designResult.selectedInverter.priceUSD; 
        const batteryCost = designResult.selectedBattery ? designResult.selectedBattery.priceUSD : 0;
        const heatPumpCost = designResult.selectedHeatPump ? designResult.selectedHeatPump.priceUSD : 0;
        const mountingCost = panelCost * 0.10; 

        const hardwareTotal = panelCost + inverterCost + batteryCost + heatPumpCost + mountingCost;
        const totalBaseCost = hardwareTotal + commercialForm.laborCost + commercialForm.overheadCost;
        const profitAmount = totalBaseCost * (commercialForm.marginPercent / 100);
        const finalPrice = totalBaseCost + profitAmount;

        return {
            hardware: hardwareTotal,
            totalCost: totalBaseCost,
            profit: profitAmount,
            finalPrice: finalPrice
        };
    };

    const financials = calculateFinancials();

    const handleCreateProposal = async () => {
        if (!designResult || !selectedLeadId) return;
        
        const settings = SettingsService.get();
        const financials = calculateFinancials();

        const newProposal: Omit<Proposal, 'id' | 'createdAt' | 'status'> = {
            leadId: selectedLeadId,
            validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            systemSizeKW: designResult.layoutAnalysis.totalDCSizeKW,
            panelModel: designResult.selectedPanel.model,
            panelCount: designResult.layoutAnalysis.totalPanelCount,
            inverterModel: designResult.selectedInverter.model,
            batteryModel: designResult.selectedBattery?.model,
            hardwareCostUSD: financials.hardware,
            laborCostUSD: commercialForm.laborCost,
            overheadCostUSD: commercialForm.overheadCost,
            marginPercent: commercialForm.marginPercent,
            taxRate: commercialForm.taxRate,
            finalPriceUSD: financials.finalPrice,
            finalPriceTL: financials.finalPrice * settings.usdRate,
            usdRateSnapshot: settings.usdRate
        };

        const created = await DB.createProposal(newProposal);
        setLastProposal(created);
        onProposalGenerated(); // Refresh parent list
    };

    // --- Advanced Multi-Page PDF Trigger ---
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const handleDownloadPDF = async () => {
        if (lastProposal && designResult) {
            const lead = leads.find(l => l.id === selectedLeadId);
            if (lead) {
                setIsGeneratingPdf(true);
                await generateProposalPDF(lastProposal, lead, designResult);
                setIsGeneratingPdf(false);
            }
        }
    };

    const handleSendEmail = async () => {
        const lead = leads.find(l => l.id === selectedLeadId);
        if(lead && lastProposal) {
            setIsSendingEmail(true);
            try {
                // EmailJS Service Call
                await EmailService.sendLeadNotification({
                    ...lead,
                    proposalId: lastProposal.id,
                    proposalPriceUSD: lastProposal.finalPriceUSD
                });
                alert("Teklif başarıyla e-posta ile gönderildi.");
            } catch (err) {
                alert("E-posta gönderilemedi.");
            } finally {
                setIsSendingEmail(false);
            }
        }
    };

    const leadOptions = leads.map(l => ({ label: `${l.fullName} (${l.city})`, value: l.id }));
    const panelOptions = panels.map(p => ({ label: `${p.brand} - ${p.powerW}W (${p.priceUSD}$)`, value: p.id }));
    const inverterOptions = inverters.map(i => ({ label: `${i.brand} - ${i.powerKW}kW (${i.priceUSD}$)`, value: i.id }));
    const batteryOptions = [{ label: 'Batarya Yok', value: '' }, ...batteries.map(b => ({ label: `${b.brand} - ${b.capacityKWh}kWh (${b.priceUSD}$)`, value: b.id }))];
    const heatPumpOptions = [{ label: 'Isı Pompası Yok', value: '' }, ...heatPumps.map(h => ({ label: `${h.brand} - ${h.thermalPowerKW}kW (${h.priceUSD}$)`, value: h.id }))];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HIDDEN TEMPLATE FOR PDF GENERATION */}
            {lastProposal && designResult && (
                <ProposalTemplate 
                    proposal={lastProposal} 
                    lead={leads.find(l => l.id === selectedLeadId)!} 
                    designResult={designResult} 
                />
            )}

            <Card className="border-t-4 border-t-purple-600 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-purple-600" /> Proje Tasarım Stüdyosu</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Tabs className="w-full">
                        <div className="px-6 border-b bg-slate-50/50">
                            <TabsList>
                                <TabsTrigger active={activeSubTab === 'engineering'} onClick={() => setActiveSubTab('engineering')}>Mühendislik Tasarımı</TabsTrigger>
                                <TabsTrigger active={activeSubTab === 'commercial'} onClick={() => setActiveSubTab('commercial')} disabled={!designResult}>Teklif Oluştur</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="p-6">
                            <TabsContent active={activeSubTab === 'engineering'}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                    <Select label="Müşteri (Lead)" options={leadOptions} value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} />
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <Input label="Panel Açısı (°)" type="number" value={tiltAngle} onChange={e => setTiltAngle(Number(e.target.value))} />
                                            <div className="flex items-center pt-6">
                                                <input type="checkbox" id="flatRoof" checked={isFlatRoof} onChange={e => setIsFlatRoof(e.target.checked)} className="mr-2 h-4 w-4" />
                                                <label htmlFor="flatRoof" className="text-sm font-medium">Düz Çatı</label>
                                            </div>
                                        </div>
                                    </div>
                                    <Input label="Çatı Eni (m)" type="number" value={roofWidth} onChange={e => setRoofWidth(Number(e.target.value))} />
                                    <Input label="Çatı Boyu (m)" type="number" value={roofLength} onChange={e => setRoofLength(Number(e.target.value))} />
                                </div>
                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <Select label="Panel Modeli" options={panelOptions} value={selectedPanelId} onChange={e => setSelectedPanelId(e.target.value)} />
                                        <Select label="İnverter Modeli" options={inverterOptions} value={selectedInverterId} onChange={e => setSelectedInverterId(e.target.value)} />
                                        <Select label="Batarya" options={batteryOptions} value={selectedBatteryId} onChange={e => setSelectedBatteryId(e.target.value)} />
                                        <Select label="Isı Pompası" options={heatPumpOptions} value={selectedHeatPumpId} onChange={e => setSelectedHeatPumpId(e.target.value)} />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end"><Button onClick={handleDesign} className="bg-purple-600 hover:bg-purple-700 text-white"><Zap className="h-4 w-4 mr-2" /> Analizi Çalıştır</Button></div>
                            </TabsContent>
                            <TabsContent active={activeSubTab === 'commercial'}>
                                {designResult?.engineeringReport.isValid ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <h3 className="font-bold text-lg flex items-center gap-2"><Calculator className="h-5 w-5"/> Maliyet Kalemleri</h3>
                                            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                                                <div className="flex justify-between text-sm"><span>Donanım:</span><span className="font-bold">${financials.hardware.toLocaleString()}</span></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label="İşçilik ($)" type="number" value={commercialForm.laborCost} onChange={e => setCommercialForm({...commercialForm, laborCost: Number(e.target.value)})} />
                                                <Input label="Genel ($)" type="number" value={commercialForm.overheadCost} onChange={e => setCommercialForm({...commercialForm, overheadCost: Number(e.target.value)})} />
                                            </div>
                                            <Input label="Kâr Marjı (%)" type="number" value={commercialForm.marginPercent} onChange={e => setCommercialForm({...commercialForm, marginPercent: Number(e.target.value)})} />
                                        </div>
                                        <div className="bg-navy-900 text-white p-8 rounded-xl flex flex-col justify-between">
                                            <div>
                                                <h4 className="text-slate-400 uppercase text-xs font-bold mb-6">Teklif Özeti</h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between border-b border-navy-700 pb-4"><span>Toplam Maliyet</span><span>${financials.totalCost.toLocaleString()}</span></div>
                                                    <div className="flex justify-between border-b border-navy-700 pb-4"><span>Kâr</span><span className="text-green-400">+${financials.profit.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                            <div className="mt-8 pt-8 border-t border-navy-700">
                                                <div className="text-4xl font-bold">${financials.finalPrice.toLocaleString()}</div>
                                                <Button onClick={handleCreateProposal} className="w-full mt-6 bg-energy-500 hover:bg-energy-600 text-white py-4 font-bold shadow-lg">TEKLİFİ OLUŞTUR</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : <div className="p-12 text-center text-red-600">Mühendislik onayı alınamadı.</div>}
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <Dialog open={!!lastProposal} onClose={() => setLastProposal(null)}>
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-8 w-8 text-green-600" /></div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">Teklif Hazır!</h3>
                    <p className="text-slate-600 mb-6 text-sm">Kurumsal yatırım teklifi dosyası başarıyla oluşturuldu.</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <Button onClick={handleDownloadPDF} variant="outline" className="w-full border-blue-200 text-blue-700" disabled={isGeneratingPdf}>
                            {isGeneratingPdf ? <Loader2 className="animate-spin h-4 w-4" /> : <FileDown className="h-4 w-4 mr-2" />} PDF İndir
                        </Button>
                        <Button onClick={handleSendEmail} variant="outline" className="w-full border-purple-200 text-purple-700" disabled={isSendingEmail}>
                            {isSendingEmail ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail className="h-4 w-4 mr-2" />} Mail Gönder
                        </Button>
                    </div>
                    <Button className="w-full bg-navy-900 text-white" onClick={() => window.open(`/?proposalId=${lastProposal?.leadId}`, '_blank')}>Önizleme Sayfasını Aç</Button>
                    <Button variant="ghost" className="w-full text-slate-400 mt-2" onClick={() => setLastProposal(null)}>Kapat</Button>
                </div>
            </Dialog>

            {designResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b pb-4"><CardTitle>Yerleşim Planı</CardTitle></CardHeader>
                            <CardContent className="p-6 bg-slate-100/50">
                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="text-center"><div className="text-2xl font-bold">{designResult.layoutAnalysis.totalPanelCount}</div><div className="text-xs text-slate-500 uppercase">Toplam Panel</div></div>
                                    <div className="text-center"><div className="text-2xl font-bold text-energy-600">{designResult.layoutAnalysis.totalDCSizeKW} kWp</div><div className="text-xs text-slate-500 uppercase">DC Güç</div></div>
                                    <div className="text-center"><div className="text-2xl font-bold">{designResult.layoutAnalysis.packingEfficiency}%</div><div className="text-xs text-slate-500 uppercase">Doluluk</div></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminDashboard = ({ onLogout, settings, updateSettings }: { 
    onLogout: () => void, 
    settings: GlobalSettings, 
    updateSettings: (s: GlobalSettings) => void 
}) => {
    const [activeTab, setActiveTab] = useState('leads');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [panels, setPanels] = useState<SolarPanel[]>([]);
    const [inverters, setInverters] = useState<Inverter[]>([]);
    const [batteries, setBatteries] = useState<Battery[]>([]);
    const [heatPumps, setHeatPumps] = useState<HeatPump[]>([]);

    useEffect(() => {
        const loadData = async () => {
             const l = await DB.getAllLeads();
             setLeads(l);
             setPanels(EquipmentService.getPanels());
             setInverters(EquipmentService.getInverters());
             setBatteries(EquipmentService.getBatteries());
             setHeatPumps(EquipmentService.getHeatPumps());
        }
        loadData();
    }, [refreshTrigger]);

    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [designLeadId, setDesignLeadId] = useState<string>('');
    const handleOpenDesign = (leadId: string) => {
        setDesignLeadId(leadId);
        setActiveTab('design');
    };

    const handleQuickDownload = async (lead: Lead) => {
        if (!lead.proposalId) return alert("Teklif bulunamadı.");
        const proposals = await DB.getProposalsByLead(lead.id);
        const proposal = proposals.find(p => p.id === lead.proposalId) || proposals[0];
        if (proposal) generateProposalPDF(proposal, lead, null);
    };

    const KanbanBoard = () => {
        const columns: { id: LeadStatus, title: string, color: string }[] = [
            { id: 'New', title: 'Yeni Başvuru', color: 'bg-blue-100 text-blue-800' },
            { id: 'Contacted', title: 'Görüşüldü', color: 'bg-yellow-100 text-yellow-800' },
            { id: 'OfferSent', title: 'Teklif Gönderildi', color: 'bg-purple-100 text-purple-800' },
            { id: 'Closed', title: 'Satış Kapandı', color: 'bg-green-100 text-green-800' },
        ];
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                {columns.map(col => (
                    <div key={col.id} className="min-w-[300px] w-full bg-slate-100 rounded-xl p-3 flex flex-col">
                        <div className={`flex justify-between items-center px-3 py-2 rounded-lg mb-3 ${col.color}`}>
                            <h4 className="font-bold text-sm">{col.title}</h4>
                            <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold">{leads.filter(l => l.status === col.id).length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {leads.filter(l => l.status === col.id).map(lead => (
                                <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between mb-2"><h5 className="font-bold text-navy-900 text-sm">{lead.fullName}</h5><span className="text-xs text-slate-400">{lead.city}</span></div>
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDesign(lead.id)} className="flex-1 text-xs">Tasarla</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-navy-900 text-white shadow-lg sticky top-0 z-30 h-16 flex items-center justify-between px-6">
                <Logo className="scale-75 origin-left" />
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-400"><LogOut className="h-5 w-5" /></Button>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8">
                <Tabs className="w-full">
                    <TabsList className="w-full justify-start bg-white border rounded-lg p-1 mb-6 shadow-sm inline-flex">
                        <TabsTrigger active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} className="flex-1">Müşteriler</TabsTrigger>
                        <TabsTrigger active={activeTab === 'design'} onClick={() => setActiveTab('design')} className="flex-1">Design Studio</TabsTrigger>
                        <TabsTrigger active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} className="flex-1">Ayarlar</TabsTrigger>
                    </TabsList>
                    <TabsContent active={activeTab === 'leads'}>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Gelen Başvurular</CardTitle>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded ${viewMode === 'LIST' ? 'bg-white shadow' : 'text-slate-500'}`}><List className="h-4 w-4" /></button>
                                    <button onClick={() => setViewMode('KANBAN')} className={`p-1.5 rounded ${viewMode === 'KANBAN' ? 'bg-white shadow' : 'text-slate-500'}`}><LayoutGrid className="h-4 w-4" /></button>
                                </div>
                            </CardHeader>
                            <CardContent>{viewMode === 'LIST' ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b"><tr><th className="px-4 py-3">Ad Soyad</th><th className="px-4 py-3">Şehir</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3 text-right">İşlem</th></tr></thead>
                                    <tbody>{leads.map(lead => (
                                        <tr key={lead.id} className="border-b hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium">{lead.fullName}</td>
                                            <td className="px-4 py-3">{lead.city}</td>
                                            <td className="px-4 py-3"><Badge variant={lead.status === 'New' ? 'info' : 'default'}>{lead.status}</Badge></td>
                                            <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => handleOpenDesign(lead.id)}>Tasarla</Button></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            ) : <KanbanBoard />}</CardContent>
                         </Card>
                    </TabsContent>
                    <TabsContent active={activeTab === 'design'}>
                        <DesignStudio leads={leads} panels={panels} inverters={inverters} batteries={batteries} heatPumps={heatPumps} onProposalGenerated={handleRefresh} initialLeadId={designLeadId} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};
