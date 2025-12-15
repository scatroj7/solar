import React, { useState, useEffect } from 'react';
import { 
  LogOut, ExternalLink, PenTool, Zap, Settings as SettingsIcon, Save,
  Users, Layout, DollarSign
} from 'lucide-react';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Tabs, TabsList, TabsTrigger, 
  TabsContent, Toast, Badge, Logo
} from './ui/UIComponents';
import { DB } from '../services/db';
import { SettingsService } from '../services/mockService';
import { Lead, LeadStatus, GlobalSettings, DesignResult } from '../types';
import { MOCK_PANELS, MOCK_INVERTERS, CITIES } from '../constants';
import { performEngineeringDesign } from '../lib/engineeringCalculator';

// --- Design Studio Sub-Component ---
const DesignStudio = ({ leads }: { leads: Lead[] }) => {
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [selectedPanelId, setSelectedPanelId] = useState<string>('p1');
    const [selectedInverterId, setSelectedInverterId] = useState<string>('inv1');
    const [tiltAngle, setTiltAngle] = useState<number>(20);
    const [isFlatRoof, setIsFlatRoof] = useState<boolean>(false);
    
    const [roofWidth, setRoofWidth] = useState<number>(10);
    const [roofLength, setRoofLength] = useState<number>(10);
    
    const [designResult, setDesignResult] = useState<DesignResult | null>(null);

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

    const handleDesign = () => {
        if (!selectedLeadId) return alert("Lütfen bir müşteri seçiniz.");
        const lead = leads.find(l => l.id === selectedLeadId);
        if (!lead) return;

        const city = CITIES.find(c => c.name === lead.city) || CITIES[5]; 
        const panel = MOCK_PANELS.find(p => p.id === selectedPanelId);
        const inverter = MOCK_INVERTERS.find(i => i.id === selectedInverterId);

        if (!city || !panel || !inverter) return alert("Veri hatası.");

        const result = performEngineeringDesign(lead.id, city, roofWidth, roofLength, panel, inverter, tiltAngle, isFlatRoof);
        setDesignResult(result);
    };

    const panelOptions = MOCK_PANELS.map(p => ({ label: `${p.brand} - ${p.powerW}W`, value: p.id }));
    const inverterOptions = MOCK_INVERTERS.map(i => ({ label: `${i.brand} - ${i.powerKW}kW`, value: i.id }));
    const leadOptions = leads.map(l => ({ label: `${l.fullName} (${l.city})`, value: l.id }));

    const GridPreview = ({ result }: { result: DesignResult }) => {
        const { roofDim, visualGrid } = result.layoutAnalysis;
        const padding = 1;
        const viewBoxW = roofDim.width + padding * 2;
        const viewBoxH = roofDim.length + padding * 2;

        return (
            <div className="w-full bg-slate-100 rounded-lg p-4 flex justify-center border border-slate-300 overflow-hidden">
                <svg 
                    viewBox={`-${padding} -${padding} ${viewBoxW} ${viewBoxH}`} 
                    className="max-h-[350px] w-auto border-2 border-dashed border-slate-400 bg-white shadow-sm"
                    style={{ aspectRatio: `${roofDim.width}/${roofDim.length}` }}
                >
                    <rect x="0" y="0" width={roofDim.width} height={roofDim.length} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.05" />
                    {visualGrid.map((p, idx) => (
                        <rect key={idx} x={p.x} y={p.y} width={p.w} height={p.h} fill="#0f172a" stroke="#334155" strokeWidth="0.02" opacity="0.9" />
                    ))}
                </svg>
            </div>
        )
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-t-4 border-t-purple-600 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-purple-600" /> Proje Tasarım Stüdyosu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Select label="Müşteri (Lead)" options={leadOptions} value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} />
                        <Select label="Panel Modeli" options={panelOptions} value={selectedPanelId} onChange={e => setSelectedPanelId(e.target.value)} />
                        <Select label="İnverter Modeli" options={inverterOptions} value={selectedInverterId} onChange={e => setSelectedInverterId(e.target.value)} />
                        <div className="space-y-4">
                           <div className="flex gap-4">
                                <Input label="Panel Açısı (°)" type="number" value={tiltAngle} onChange={e => setTiltAngle(Number(e.target.value))} />
                                <div className="flex items-center pt-6">
                                     <input type="checkbox" id="flatRoof" checked={isFlatRoof} onChange={e => setIsFlatRoof(e.target.checked)} className="mr-2 h-4 w-4" />
                                     <label htmlFor="flatRoof" className="text-sm font-medium">Düz Çatı</label>
                                </div>
                           </div>
                        </div>
                        <Input label="Çatı Eni (m)" type="number" step="0.1" value={roofWidth} onChange={e => setRoofWidth(Number(e.target.value))} />
                        <Input label="Çatı Boyu (m)" type="number" step="0.1" value={roofLength} onChange={e => setRoofLength(Number(e.target.value))} />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleDesign} className="bg-purple-600 hover:bg-purple-700 text-white"><Zap className="h-4 w-4 mr-2" /> Mühendislik Analizini Çalıştır</Button>
                    </div>
                </CardContent>
            </Card>
            {designResult && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card><CardHeader><CardTitle>Dizi Tasarımı</CardTitle></CardHeader><CardContent>{designResult.stringDesign.isCompatible ? <Badge variant="success">UYGUN</Badge> : <Badge variant="warning">HATALI</Badge>}</CardContent></Card>
                    <Card><CardHeader><CardTitle>DC Kapasite</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{designResult.layoutAnalysis.totalDCSizeKW} kWp</CardContent></Card>
                </div>
                <Card className="mt-6"><CardContent className="p-8"><GridPreview result={designResult} /></CardContent></Card>
                </>
            )}
        </div>
    );
};

// --- Settings Sub-Component ---
const SettingsPanel = ({ settings, onSave }: { settings: GlobalSettings, onSave: (s: GlobalSettings) => void }) => {
    const [formData, setFormData] = useState<GlobalSettings>(settings);

    const handleChange = (key: keyof GlobalSettings, value: string) => {
        setFormData(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <Card className="border-t-4 border-t-slate-600 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-slate-600" /> Global Hesaplama Parametreleri</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input 
                        label="Dolar Kuru (TL)" 
                        type="number" step="0.01" 
                        value={formData.usdRate} 
                        onChange={e => handleChange('usdRate', e.target.value)} 
                    />
                    <Input 
                        label="Elektrik Birim Fiyatı (TL/kWh)" 
                        type="number" step="0.01" 
                        value={formData.electricityPrice} 
                        onChange={e => handleChange('electricityPrice', e.target.value)} 
                    />
                    <Input 
                        label="Panel Gücü (Watt)" 
                        type="number" step="5" 
                        value={formData.panelWattage} 
                        onChange={e => handleChange('panelWattage', e.target.value)} 
                    />
                    <Input 
                        label="Sistem Maliyeti ($/kW)" 
                        type="number" step="10" 
                        value={formData.systemCostPerKw} 
                        onChange={e => handleChange('systemCostPerKw', e.target.value)} 
                    />
                    <Input 
                        label="Enerji Enflasyonu (Yıllık %)" 
                        type="number" step="0.01" 
                        value={formData.energyInflationRate} 
                        onChange={e => handleChange('energyInflationRate', e.target.value)} 
                    />
                    <Input 
                        label="Panel Eskime Oranı (Yıllık %)" 
                        type="number" step="0.001" 
                        value={formData.panelDegradationRate} 
                        onChange={e => handleChange('panelDegradationRate', e.target.value)} 
                    />
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSave} className="bg-slate-800 hover:bg-slate-900 text-white">
                        <Save className="h-4 w-4 mr-2" /> Ayarları Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// --- Main Admin Dashboard Component ---
export const AdminDashboard = ({ onLogout, settings, updateSettings }: { onLogout: () => void, settings: GlobalSettings, updateSettings: (s: GlobalSettings) => void }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
    const [activeTab, setActiveTab] = useState<'leads' | 'design' | 'settings'>('leads');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await DB.getAllLeads();
            setLeads(data);
        };
        load();
        setLocalSettings(SettingsService.get());
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }
    
    const handleStatusUpdate = async (id: string, newStatus: string) => {
        await DB.updateLeadStatus(id, newStatus as LeadStatus);
        const data = await DB.getAllLeads();
        setLeads(data);
        showToast(`Durum güncellendi.`);
    };

    const handleSettingsUpdate = (newSettings: GlobalSettings) => {
        SettingsService.update(newSettings);
        setLocalSettings(newSettings);
        updateSettings(newSettings); // Propagate up to App
        showToast("Ayarlar başarıyla güncellendi.");
    };

    const handleViewProposal = (id: string) => {
        const url = `${window.location.origin}/?proposalId=${id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-20 max-w-7xl">
            <div className="bg-navy-900 rounded-xl p-6 flex justify-between items-center mb-8 shadow-lg">
                <Logo />
                <Button variant="outline" onClick={onLogout} className="text-red-200 border-red-900 hover:bg-red-900 hover:text-white"><LogOut className="h-4 w-4 mr-2" /> Çıkış</Button>
            </div>

            <Tabs className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger active={activeTab === 'leads'} onClick={() => setActiveTab('leads')}><Users className="h-4 w-4 mr-2"/> Müşteri Adayları</TabsTrigger>
                    <TabsTrigger active={activeTab === 'design'} onClick={() => setActiveTab('design')}><Layout className="h-4 w-4 mr-2"/> Design Studio</TabsTrigger>
                    <TabsTrigger active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><DollarSign className="h-4 w-4 mr-2"/> Parametreler</TabsTrigger>
                </TabsList>

                <TabsContent active={activeTab === 'leads'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                            <Card key={lead.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-navy-900">{lead.fullName}</h4>
                                            <p className="text-xs text-slate-500">{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                        <Badge variant={lead.status === 'New' ? 'info' : 'success'}>{lead.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Şehir:</span>
                                        <span className="font-medium">{lead.city}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Sistem:</span>
                                        <span className="font-bold text-energy-600">{lead.systemSize} kWp</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Maliyet:</span>
                                        <span className="font-medium">${lead.estimatedCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tel:</span>
                                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>
                                    </div>
                                    
                                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                                        <Select 
                                            className="h-9 text-xs flex-1"
                                            options={[
                                                {label: 'Yeni', value: 'New'},
                                                {label: 'Arandı', value: 'Contacted'},
                                                {label: 'Teklif', value: 'OfferSent'},
                                                {label: 'Satış', value: 'Closed'},
                                            ]}
                                            value={lead.status}
                                            onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                                        />
                                        <Button size="sm" variant="outline" onClick={() => handleViewProposal(lead.id)} title="Raporu Gör">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {leads.length === 0 && <p className="text-center text-slate-500 py-10">Henüz kayıt yok.</p>}
                </TabsContent>
                
                <TabsContent active={activeTab === 'design'}><DesignStudio leads={leads} /></TabsContent>
                
                <TabsContent active={activeTab === 'settings'}>
                    <SettingsPanel settings={localSettings} onSave={handleSettingsUpdate} />
                </TabsContent>
            </Tabs>
            <Toast show={!!toastMessage} message={toastMessage || ''} onClose={() => setToastMessage(null)} />
        </div>
    );
};
