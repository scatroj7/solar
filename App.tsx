
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  Sun, 
  CheckCircle, 
  Zap, 
  Settings as SettingsIcon,
  LayoutDashboard,
  Home,
  ChevronLeft,
  Users,
  LogOut,
  Compass,
  Info,
  DollarSign,
  Download,
  Share2,
  AlertTriangle,
  Award,
  Leaf,
  Loader2,
  PenTool,
  Grid,
  Maximize,
  Ruler,
  Box,
  Factory,
  Building,
  Briefcase,
  Moon,
  Clock,
  Key
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Select, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  Toast,
  Progress,
  Dialog,
  Badge
} from './components/ui/UIComponents';
import { RoofMapper } from './components/RoofMapper';
import { ProductionChart, FinancialComparisonChart, ROIChart } from './components/Charts';
import { LeadForm } from './components/LeadForm';
import { CITIES, DEFAULT_SETTINGS, MOCK_PANELS, MOCK_INVERTERS, TARIFF_RATES } from './constants';
import { calculateSolarSystem } from './lib/calculator';
import { performEngineeringDesign } from './lib/engineeringCalculator';
import { SettingsService, LeadService, AuthService } from './services/mockService';
import { CalculationInput, SimulationResult, RoofDirection, GlobalSettings, Lead, LeadStatus, ScenarioType, SolarPanel, Inverter, DesignResult, BuildingType, ConsumptionProfile } from './types';

// Imports for PDF generation
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Configuration ---
// Updated with the provided valid key.
// SECURITY NOTE: Ensure this key is restricted by HTTP Referrer in Google Cloud Console.
const DEFAULT_GOOGLE_MAPS_API_KEY = "AIzaSyAaa5cznPQZJ7wrGMUgZ3QUEvGiaf8zgBo";

// --- Types ---
type View = 'WIZARD' | 'RESULT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
type WizardStep = 'ROOF_MAP' | 'PROFILE' | 'BILL';

// --- Components ---

const Wizard = ({ 
    step, 
    setStep, 
    data, 
    setData, 
    onCalculate,
    apiKey
}: { 
    step: WizardStep, 
    setStep: (s: WizardStep) => void, 
    data: CalculationInput, 
    setData: (d: CalculationInput) => void, 
    onCalculate: () => void,
    apiKey: string
}) => {
    
    // Smart Defaults
    useEffect(() => {
        if (step === 'BILL' && data.billAmount === 0 && data.buildingType) {
            // Suggest bill based on building type
            const defaults = {
                [BuildingType.MESKEN]: 1500,
                [BuildingType.TICARETHANE]: 8000,
                [BuildingType.SANAYI]: 50000
            };
            setData({ ...data, billAmount: defaults[data.buildingType] || 2000 });
        }
    }, [step, data.buildingType]);

    const progressValue = step === 'ROOF_MAP' ? 33 : step === 'PROFILE' ? 66 : 100;
    
    const handleNext = () => {
        if (step === 'ROOF_MAP') {
            if(!data.roofArea || data.roofArea === 0) return alert('Lütfen harita üzerinden çatınızı çiziniz veya manuel giriş yapınız.');
            setStep('PROFILE');
        }
        else if (step === 'PROFILE') {
            if(!data.buildingType) return alert('Lütfen bina tipini seçiniz.');
            setStep('BILL');
        }
        else if (step === 'BILL') {
            if(!data.billAmount) return alert('Lütfen fatura tutarı giriniz.');
            onCalculate();
        }
    };

    const handleBack = () => {
        if (step === 'PROFILE') setStep('ROOF_MAP');
        if (step === 'BILL') setStep('PROFILE');
    };

    const handleRoofComplete = (result: { area: number, coordinates: { lat: number; lng: number }, locationName?: string }) => {
        setData({
            ...data,
            roofArea: result.area,
            coordinates: result.coordinates,
            locationName: result.locationName
        });
        // Auto advance after short delay for UX
        setTimeout(() => setStep('PROFILE'), 1000);
    };

    return (
        <div className="max-w-3xl mx-auto mt-8 px-4 pb-20">
            <div className="mb-6 text-center">
                 <h2 className="text-2xl font-bold text-navy-900 mb-2">Solar Hesaplama Sihirbazı</h2>
                 <p className="text-slate-500 text-sm">3 adımda güneş enerjisi potansiyelinizi öğrenin.</p>
            </div>

            <div className="mb-8 max-w-xl mx-auto">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
                    <span className={step === 'ROOF_MAP' ? 'text-energy-600' : ''}>Çatı Çizimi</span>
                    <span className={step === 'PROFILE' ? 'text-energy-600' : ''}>Profil</span>
                    <span className={step === 'BILL' ? 'text-energy-600' : ''}>Tüketim</span>
                </div>
            </div>

            <Card className="shadow-2xl border-0 ring-1 ring-slate-100 overflow-hidden">
                <CardContent className="space-y-6 pt-8 pb-8">
                    
                    {/* STEP 1: ROOF MAPPING */}
                    {step === 'ROOF_MAP' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-4 text-center">
                                <h3 className="text-lg font-semibold text-slate-800">Çatınızı Belirleyin</h3>
                                <p className="text-sm text-slate-500">Adresinizi arayın ve çatınızın köşelerini işaretleyerek alanını ölçün.</p>
                            </div>
                            
                            <RoofMapper 
                                apiKey={apiKey} 
                                onComplete={handleRoofComplete} 
                            />
                            
                            {data.roofArea > 0 && (
                                <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                                    <CheckCircle className="h-5 w-5" />
                                    <span>Seçilen Alan: <strong>{data.roofArea} m²</strong></span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: BUILDING & PROFILE */}
                    {step === 'PROFILE' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            
                            {/* Building Type Selection */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Bina Tipi Nedir?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: BuildingType.MESKEN, icon: Home, label: 'Müstakil Ev / Villa', desc: 'Düşük Tarife' },
                                        { id: BuildingType.TICARETHANE, icon: Briefcase, label: 'İş Yeri / Ofis', desc: 'Yüksek Tarife, Hızlı ROI' },
                                        { id: BuildingType.SANAYI, icon: Factory, label: 'Fabrika / Depo', desc: 'Endüstriyel Tarife' }
                                    ].map((item) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setData({...data, buildingType: item.id})}
                                            className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-lg flex flex-col items-center text-center gap-3 ${
                                                data.buildingType === item.id 
                                                ? 'border-energy-500 bg-energy-50 text-navy-900 ring-2 ring-energy-500 ring-offset-2' 
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`p-3 rounded-full ${data.buildingType === item.id ? 'bg-energy-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{item.label}</p>
                                                <p className="text-xs opacity-70 mt-1">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Consumption Profile Selection */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Elektrik Tüketim Zamanı</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: ConsumptionProfile.GUNDUZ, icon: Sun, label: 'Gündüz Ağırlıklı', desc: '08:00 - 18:00' },
                                        { id: ConsumptionProfile.DENGELI, icon: Clock, label: 'Dengeli (7/24)', desc: 'Ev / Home Office' },
                                        { id: ConsumptionProfile.AKSAM, icon: Moon, label: 'Akşam Ağırlıklı', desc: '18:00 Sonrası' }
                                    ].map((item) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setData({...data, consumptionProfile: item.id})}
                                            className={`cursor-pointer p-4 rounded-xl border transition-all hover:shadow-md flex items-center gap-4 ${
                                                data.consumptionProfile === item.id 
                                                ? 'border-blue-500 bg-blue-50 text-navy-900 shadow-md' 
                                                : 'border-slate-200 bg-white text-slate-500'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${data.consumptionProfile === item.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">{item.label}</p>
                                                <p className="text-xs opacity-70">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* STEP 3: BILL AMOUNT */}
                    {step === 'BILL' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto text-center">
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">Son Adım: Fatura Bilgisi</h3>
                            
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₺</span>
                                <Input 
                                    type="number"
                                    min="100"
                                    placeholder="Örn: 2000"
                                    value={data.billAmount || ''}
                                    onChange={(e) => setData({...data, billAmount: Number(e.target.value)})}
                                    className="text-2xl py-6 pl-10 text-center font-bold text-navy-900"
                                />
                                <p className="text-xs text-slate-400 mt-2">Aylık ortalama elektrik faturası tutarı</p>
                            </div>
                            
                            {data.buildingType && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                                    <Zap className="h-4 w-4" />
                                    <span>Seçilen Tarife: <strong>{TARIFF_RATES[data.buildingType]} TL/kWh</strong></span>
                                </div>
                            )}

                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mt-4 text-sm flex gap-3 border border-yellow-100 text-left">
                                <Info className="h-5 w-5 shrink-0 text-yellow-600" />
                                <p><strong>İpucu:</strong> Girdiğiniz fatura tutarı ve bina tipi üzerinden yıllık tüketiminiz (kWh) hesaplanacaktır.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-6 border-t border-slate-100 mt-6 max-w-2xl mx-auto">
                        {step !== 'ROOF_MAP' ? (
                            <Button variant="outline" onClick={handleBack} className="text-slate-500 border-slate-300">
                                <ChevronLeft className="h-4 w-4 mr-2" /> Geri
                            </Button>
                        ) : <div />}
                        
                        <Button 
                            onClick={handleNext} 
                            disabled={step === 'ROOF_MAP' && data.roofArea === 0}
                            className={`bg-energy-500 hover:bg-energy-600 text-white shadow-lg shadow-energy-500/20 px-8 ${step === 'ROOF_MAP' && data.roofArea === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {step === 'BILL' ? 'Analizi Başlat' : 'Devam Et'}
                            {step !== 'BILL' && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// ... ResultView, AdminLogin, DesignStudio, AdminDashboard components remain largely the same, 
// just ensuring they pass types correctly. (ResultView logic for display is fine).

const ResultView = ({ 
    result, 
    onReset, 
    inputData, 
    leadSubmitted, 
    setLeadSubmitted 
}: { 
    result: SimulationResult | null, 
    onReset: () => void, 
    inputData: CalculationInput,
    leadSubmitted: boolean,
    setLeadSubmitted: (v: boolean) => void
}) => {
    const [activeScenario, setActiveScenario] = useState<ScenarioType>('OPTIMAL');
    const [showTechDetails, setShowTechDetails] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!result) return null;

    const currentData = result.scenarios[activeScenario];
    const roi = currentData.roiYears;
    const isGood = roi <= 7;
    const isAverage = roi > 7 && roi <= 10;
    
    const trafficColor = isGood ? 'bg-green-100 border-green-200 text-green-800' : isAverage ? 'bg-yellow-50 border-yellow-100 text-yellow-800' : 'bg-red-50 border-red-100 text-red-800';
    const trafficTitle = isGood ? 'Mükemmel Yatırım Fırsatı' : isAverage ? 'Makul Yatırım' : 'Dikkatli Değerlendirin';
    const trafficDesc = isGood ? `Sisteminiz kendini ${roi} yılda amorti ediyor. Bu, borsadan veya dolardan daha yüksek bir getiri oranıdır.` : isAverage ? `Amortisman süresi ${roi} yıl. Uzun vadeli düşünüyorsanız kârlı bir yatırımdır.` : `Amortisman süresi ${roi} yıl. Çatı alanınız veya tüketiminiz verimli bir sistem için sınırda olabilir.`;

    const formatCurrency = (amount: number, currency: 'TL' | 'USD' = 'TL') => {
        const currencyCode = currency === 'TL' ? 'TRY' : 'USD';
        return new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: currencyCode,
            maximumFractionDigits: 0 
        }).format(amount);
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content');
        if(!element) return;
        setIsGeneratingPdf(true);
        element.classList.add('pdf-mode');
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            const imgWidth = 297; 
            const pageHeight = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            if (imgHeight > pageHeight) {
                let heightLeft = imgHeight - pageHeight;
                let position = -pageHeight;
                while (heightLeft > 0) {
                     pdf.addPage();
                     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                     heightLeft -= pageHeight;
                     position -= pageHeight;
                }
            }
            pdf.save(`SolarSmart_Rapor_${result.city.name}.pdf`);
        } catch (err) {
            console.error("PDF creation failed", err);
            alert("PDF oluşturulurken bir hata oluştu.");
        } finally {
            element.classList.remove('pdf-mode');
            setIsGeneratingPdf(false);
        }
    };
    
    const handleShare = () => {
        const text = `SolarSmart ile evimin güneş enerjisi potansiyelini hesapladım! 25 yılda ${formatCurrency(currentData.netProfit25Years)} tasarruf edebiliyorum.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Fizibilite Raporu</h1>
                    <p className="text-slate-500 text-sm">{result.city.name} lokasyonu için özel analiz</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex-1 md:flex-none" disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} 
                        {isGeneratingPdf ? 'Rapor Oluşturuluyor...' : 'PDF İndir'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 md:flex-none"><Share2 className="h-4 w-4 mr-2" /> WhatsApp</Button>
                    <Button variant="ghost" size="sm" onClick={onReset} className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4 mr-2" /> Çıkış</Button>
                </div>
            </div>

            <div id="report-content" className="bg-slate-50 p-1 md:p-4 rounded-xl transition-all">
                <div className="pdf-header flex-col items-center justify-center mb-8 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-energy-500 p-2 rounded-full"><Sun className="h-8 w-8 text-white" /></div>
                        <span className="text-3xl font-bold text-navy-900">SolarSmart</span>
                    </div>
                    <h2 className="text-xl font-medium text-slate-600">Güneş Enerjisi Fizibilite Raporu</h2>
                    <p className="text-sm text-slate-400 mt-1">{new Date().toLocaleDateString('tr-TR')} - {result.city.name}</p>
                </div>

                <div className={`p-4 rounded-xl border mb-6 flex items-start gap-4 ${trafficColor} shadow-sm print-break-inside-avoid`}>
                    <div className={`p-2 rounded-full ${isGood ? 'bg-green-200' : isAverage ? 'bg-yellow-200' : 'bg-red-200'}`}>
                        {isGood ? <Award className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{trafficTitle}</h3>
                        <p className="text-sm opacity-90 mt-1">{trafficDesc}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs className="w-full no-print no-pdf">
                            <TabsList className="w-full grid grid-cols-3 bg-white border border-slate-200 p-1 h-auto">
                                <TabsTrigger active={activeScenario === 'CONSERVATIVE'} onClick={() => setActiveScenario('CONSERVATIVE')} className="py-3 data-[active=true]:bg-navy-50 data-[active=true]:text-navy-900">
                                    <div className="flex flex-col items-center"><span className="font-bold">Muhafazakâr</span><span className="text-xs opacity-60 mt-1">%70 Tüketim</span></div>
                                </TabsTrigger>
                                <TabsTrigger active={activeScenario === 'OPTIMAL'} onClick={() => setActiveScenario('OPTIMAL')} className="py-3 data-[active=true]:bg-energy-50 data-[active=true]:text-energy-700">
                                    <div className="flex flex-col items-center"><span className="font-bold">⭐ Optimal</span><span className="text-xs opacity-60 mt-1">%100 Tüketim</span></div>
                                </TabsTrigger>
                                <TabsTrigger active={activeScenario === 'AGGRESSIVE'} onClick={() => setActiveScenario('AGGRESSIVE')} className="py-3 data-[active=true]:bg-green-50 data-[active=true]:text-green-700">
                                    <div className="flex flex-col items-center"><span className="font-bold">Maksimum</span><span className="text-xs opacity-60 mt-1">%120 Satış</span></div>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-navy-900 text-white border-0"><CardContent className="p-4 text-center"><span className="text-slate-400 text-xs">Sistem Gücü</span><div className="text-2xl font-bold text-energy-500 mt-1">{currentData.systemSizeKW} kWp</div><span className="text-xs text-slate-500">{currentData.panelCount} Panel</span></CardContent></Card>
                            <Card><CardContent className="p-4 text-center"><span className="text-slate-500 text-xs">Yatırım Maliyeti</span><div className="text-xl font-bold text-navy-900 mt-1">{formatCurrency(currentData.totalCostUSD, 'USD')}</div><span className="text-xs text-slate-400">~{formatCurrency(currentData.totalCostTL, 'TL')}</span></CardContent></Card>
                            <Card><CardContent className="p-4 text-center"><span className="text-slate-500 text-xs">Amortisman</span><div className="text-2xl font-bold text-green-600 mt-1">{currentData.roiYears} Yıl</div><span className="text-xs text-slate-400">Geri Dönüş</span></CardContent></Card>
                            <Card><CardContent className="p-4 text-center"><span className="text-slate-500 text-xs">25 Yıllık Kâr</span><div className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(currentData.netProfit25Years, 'TL')}</div><span className="text-xs text-slate-400">Net Kazanç</span></CardContent></Card>
                        </div>

                        <div id="summary-charts" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96 print-break-inside-avoid"><ProductionChart result={currentData} /><FinancialComparisonChart result={currentData} /></div>
                            <div className="h-80 print-break-inside-avoid"><ROIChart result={currentData} /></div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print-break-inside-avoid">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-energy-500" />Kazanılan Rozetler</h4>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100"><div className="bg-green-200 p-2 rounded-full"><Leaf className="h-5 w-5 text-green-700" /></div><div><p className="font-bold text-green-900 text-sm">Doğa Dostu</p><p className="text-xs text-green-700">{currentData.co2Saved} Ton CO₂ Engellendi</p></div></div>
                                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100"><div className="bg-blue-200 p-2 rounded-full"><DollarSign className="h-5 w-5 text-blue-700" /></div><div><p className="font-bold text-blue-900 text-sm">Enerji Bağımsızlığı</p><p className="text-xs text-blue-700">Elektriğin %{Math.min(100, currentData.selfConsumptionRate).toFixed(0)}'ini kendin üret</p></div></div>
                            </div>
                        </div>

                        <div className="text-center no-print no-pdf"><button onClick={() => setShowTechDetails(true)} className="text-xs text-slate-400 hover:text-slate-600 underline">Hesaplama metodolojisi ve mühendislik detaylarını gör</button></div>
                    </div>

                    <div className="lg:col-span-1 no-print right-column">
                        <Card className={`border-t-4 ${leadSubmitted ? 'border-green-500' : 'border-energy-500'} h-auto shadow-xl sticky top-6`}>
                            <CardHeader className="bg-slate-50 border-b border-slate-100"><CardTitle className="text-lg">{leadSubmitted ? 'Talebiniz Alındı!' : 'Ücretsiz Keşif İste'}</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                {leadSubmitted ? (
                                    <div className="text-center py-8">
                                        <div className="bg-green-100 p-4 rounded-full inline-flex mb-4 animate-in zoom-in duration-300"><CheckCircle className="h-10 w-10 text-green-600" /></div>
                                        <p className="text-slate-800 font-bold mb-2">Teşekkürler!</p>
                                        <p className="text-sm text-slate-500 mb-2">Başvurunuz başarıyla ulaştı.</p>
                                        <p className="text-xs text-slate-400 mb-6">Detaylı bilgilendirme e-postası adresinize gönderilmiştir.</p>
                                        <Button variant="outline" className="w-full" onClick={onReset}>Yeni Hesaplama Yap</Button>
                                    </div>
                                ) : (
                                    <><p className="text-sm text-slate-600 mb-6 leading-relaxed">Bu rapor bir simülasyondur. Evinize özel net fiyat teklifi ve gölge analizi için formu doldurun.</p><LeadForm inputData={inputData} resultData={currentData} onSuccess={() => setLeadSubmitted(true)} /><div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center"><p>7.000+ mutlu müşteri SolarSmart altyapısını kullanıyor.</p></div></>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="hidden pdf-header text-center mt-10 text-slate-400 text-xs"><p>Bu rapor SolarSmart Altyapısı ile oluşturulmuştur. www.solarsmart.com.tr</p></div>
            </div>

            <Dialog isOpen={showTechDetails} onClose={() => setShowTechDetails(false)} title="Mühendislik Varsayımları">
                <div className="space-y-4 text-sm text-slate-600">
                    <p>SolarSmart hesaplama motoru, uluslararası IEC 61724 standartlarına uygun olarak aşağıdaki parametreleri kullanır:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Işınım Verisi:</strong> GEPA (Güneş Enerjisi Potansiyeli Atlası) ve NASA POWER veritabanlarından alınan 10 yıllık ortalama veriler.</li>
                        <li><strong>Sistem Kayıpları:</strong> Kablo, inverter dönüşümü, sıcaklık ve kirlenme kayıpları senaryoya göre %12 ile %20 arasında modellenmiştir.</li>
                        <li><strong>Panel Degradasyonu:</strong> İlk yıl %2, sonraki yıllar %0.5 verim kaybı (Linear Warranty Standard).</li>
                        <li><strong>Finansal:</strong> Yıllık enerji enflasyonu %{DEFAULT_SETTINGS.energyInflationRate * 100}, bakım maliyetleri ve 10. yılda inverter değişimi hesaba katılmıştır.</li>
                        <li><strong>Simülasyon:</strong> Hesaplamalar aylık bazda üretim/tüketim dengesi kurularak (Net Metering) yapılmaktadır.</li>
                    </ul>
                </div>
            </Dialog>
        </div>
    );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
    // ... (Login code unchanged)
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (AuthService.login(password)) {
            onLogin();
        } else {
            setError('Hatalı şifre. (İpucu: admin123)');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader>
                    <CardTitle>Admin Girişi</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} error={error} />
                        <Button type="submit" className="w-full">Giriş Yap</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

// ... DesignStudio and AdminDashboard remain essentially the same, just imports updated

const DesignStudio = ({ leads }: { leads: Lead[] }) => {
    // ... (Existing implementation, just needs to handle new lead data structure if needed, but works fine with existing interfaces)
    // Reuse existing implementation but ensure imports are clean. 
    // Since we are modifying App.tsx completely, we must include the full code for DesignStudio & AdminDashboard or they get lost.
    
    // START RE-INJECTING EXISTING ADMIN COMPONENTS TO KEEP THEM WORKING
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

        // Try to match city from lead string or default
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
                    <text x={roofDim.width / 2} y="-0.2" fontSize="0.3" textAnchor="middle" fill="#64748b">{roofDim.width}m</text>
                    <text x="-0.2" y={roofDim.length / 2} fontSize="0.3" textAnchor="middle" fill="#64748b" transform={`rotate(-90, -0.2, ${roofDim.length / 2})`}>{roofDim.length}m</text>
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
                    <Card className={`border-l-4 ${designResult.stringDesign.isCompatible ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Grid className="h-5 w-5 text-slate-500" /> Dizi (String) Tasarımı</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded">
                                <span className="text-sm text-slate-500">Uyumluluk</span>
                                <Badge variant={designResult.stringDesign.isCompatible ? 'success' : 'warning'}>{designResult.stringDesign.isCompatible ? 'UYGUN' : 'UYGUNSUZ'}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><p className="text-slate-400 text-xs">Min Panel</p><p className="font-bold text-lg">{designResult.stringDesign.minPanels}</p></div>
                                <div><p className="text-slate-400 text-xs">Max Panel</p><p className="font-bold text-lg">{designResult.stringDesign.maxPanels}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-energy-500">
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Maximize className="h-5 w-5 text-slate-500" /> Kapasite</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <div><p className="text-xs text-slate-400">Sığan Panel</p><p className="text-2xl font-bold text-navy-900">{designResult.layoutAnalysis.totalPanelCount}</p></div>
                                 <div><p className="text-xs text-slate-400">DC Güç</p><p className="text-2xl font-bold text-energy-600">{designResult.layoutAnalysis.totalDCSizeKW} kWp</p></div>
                             </div>
                             <Progress value={designResult.layoutAnalysis.packingEfficiency} className="h-1.5 mt-2" />
                        </CardContent>
                    </Card>
                </div>
                <Card className="mt-6 shadow-md border-slate-300">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                         <CardTitle className="flex items-center gap-2 text-base"><LayoutDashboard className="h-5 w-5 text-slate-600" /> 2D Yerleşim</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8"><GridPreview result={designResult} /></CardContent>
                </Card>
                </>
            )}
        </div>
    );
};

const AdminDashboard = ({ onLogout, settings, updateSettings }: { onLogout: () => void, settings: GlobalSettings, updateSettings: (s: GlobalSettings) => void }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
    const [activeTab, setActiveTab] = useState<'leads' | 'design' | 'settings'>('leads');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        setLeads(LeadService.getAll());
        setLocalSettings(SettingsService.get());
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }
    const handleSaveSettings = () => {
        SettingsService.update(localSettings);
        updateSettings(localSettings);
        showToast("Sistem parametreleri güncellendi.");
    };
    const handleStatusUpdate = (id: string, newStatus: string) => {
        LeadService.updateStatus(id, newStatus as LeadStatus);
        setLeads(LeadService.getAll());
        showToast("Müşteri durumu güncellendi.");
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-navy-900">Yönetim Paneli</h1>
                <Button variant="outline" onClick={onLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"><LogOut className="h-4 w-4 mr-2" /> Çıkış</Button>
            </div>
            <Tabs className="w-full">
                <TabsList className="mb-6 w-full justify-start border-b rounded-none p-0 h-auto bg-transparent border-slate-200">
                    <TabsTrigger active={activeTab === 'leads'} onClick={() => setActiveTab('leads')}><Users className="h-4 w-4 mr-2" /> Müşteri Adayları</TabsTrigger>
                    <TabsTrigger active={activeTab === 'design'} onClick={() => setActiveTab('design')}><PenTool className="h-4 w-4 mr-2" /> Design Studio</TabsTrigger>
                    <TabsTrigger active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><SettingsIcon className="h-4 w-4 mr-2" /> Sistem Ayarları</TabsTrigger>
                </TabsList>
                <TabsContent active={activeTab === 'leads'}>
                    <Card><CardHeader><CardTitle>Gelen Başvurular ({leads.length})</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200"><tr><th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Ad Soyad</th><th className="px-4 py-3">Lokasyon</th><th className="px-4 py-3">Telefon</th><th className="px-4 py-3">Sistem</th><th className="px-4 py-3">Durum</th></tr></thead><tbody className="divide-y divide-slate-100">{leads.map((lead) => (<tr key={lead.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-500">{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</td><td className="px-4 py-3 font-medium text-navy-900">{lead.fullName}</td><td className="px-4 py-3">{lead.city}</td><td className="px-4 py-3">{lead.phone}</td><td className="px-4 py-3 font-semibold text-energy-600">{lead.systemSize} kWp</td><td className="px-4 py-3"><select className="bg-transparent text-xs font-medium border-none focus:ring-0 cursor-pointer" value={lead.status} onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}><option value="New">Yeni</option><option value="Contacted">Arandı</option><option value="OfferSent">Teklif Verildi</option><option value="Closed">Satış Kapandı</option></select></td></tr>))}</tbody></table></div></CardContent></Card>
                </TabsContent>
                <TabsContent active={activeTab === 'design'}><DesignStudio leads={leads} /></TabsContent>
                <TabsContent active={activeTab === 'settings'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Finansal</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium">Dolar Kuru</label><Input type="number" value={localSettings.usdRate} onChange={(e) => setLocalSettings({...localSettings, usdRate: Number(e.target.value)})} /></div></CardContent></Card>
                        <Card><CardHeader><CardTitle>Maliyet</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium">Kurulum $/kW</label><Input type="number" value={localSettings.systemCostPerKw} onChange={(e) => setLocalSettings({...localSettings, systemCostPerKw: Number(e.target.value)})} /></div></CardContent></Card>
                    </div>
                    <div className="mt-6 flex justify-end"><Button onClick={handleSaveSettings} size="lg" className="bg-green-600 hover:bg-green-700">Kaydet</Button></div>
                </TabsContent>
            </Tabs>
            <Toast show={!!toastMessage} message={toastMessage || ''} onClose={() => setToastMessage(null)} />
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [currentView, setCurrentView] = useState<View>('WIZARD');
  
  // Dynamic API Key Management
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Wizard State
  const [wizardStep, setWizardStep] = useState<WizardStep>('ROOF_MAP');
  const [inputData, setInputData] = useState<CalculationInput>({
    cityId: 0,
    roofArea: 0,
    roofDirection: RoofDirection.SOUTH,
    billAmount: 0,
    buildingType: BuildingType.MESKEN,
    consumptionProfile: ConsumptionProfile.DENGELI
  });

  // Result State
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  // Admin & Settings State
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setSettings(SettingsService.get());
    setIsAuthenticated(AuthService.isAuthenticated());

    // API Key Logic
    const storedKey = localStorage.getItem('google_maps_api_key');
    
    // Logic update: Since we now have a valid hardcoded key, we don't need to force the dialog
    // unless the developer explicitly changed the variable back to the placeholder.
    const isPlaceholder = (DEFAULT_GOOGLE_MAPS_API_KEY as string) === "YOUR_GOOGLE_MAPS_API_KEY";
    
    if (storedKey) {
        setGoogleMapsApiKey(storedKey);
    } else if (!isPlaceholder) {
        setGoogleMapsApiKey(DEFAULT_GOOGLE_MAPS_API_KEY);
        // Do NOT show dialog if hardcoded key is valid.
    } else {
        // Only show dialog if we are in the Map step AND the key is invalid
        if (wizardStep === 'ROOF_MAP') {
             setShowApiKeyDialog(true);
        }
    }
  }, [wizardStep]);

  const handleSaveApiKey = () => {
      if(apiKeyInput.trim()) {
          localStorage.setItem('google_maps_api_key', apiKeyInput);
          setGoogleMapsApiKey(apiKeyInput);
          setShowApiKeyDialog(false);
      }
  };

  const handleAdminAccess = () => {
      if (isAuthenticated) {
          setCurrentView('ADMIN_DASHBOARD');
      } else {
          setCurrentView('ADMIN_LOGIN');
      }
  };

  const handleCalculate = () => {
      try {
          const res = calculateSolarSystem(inputData, settings);
          setResult(res);
          setCurrentView('RESULT');
      } catch (e) {
          alert('Hesaplama hatası. Lütfen tüm alanları doldurunuz.');
      }
  };

  const resetApp = () => {
      setWizardStep('ROOF_MAP');
      setInputData({ 
          cityId: 0, 
          roofArea: 0, 
          roofDirection: RoofDirection.SOUTH, 
          billAmount: 0,
          buildingType: BuildingType.MESKEN,
          consumptionProfile: ConsumptionProfile.DENGELI
      });
      setResult(null);
      setLeadSubmitted(false);
      setCurrentView('WIZARD');
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentView('WIZARD');
  };

  const renderHeader = () => (
    <header className="bg-navy-900 text-white py-4 shadow-lg sticky top-0 z-50 print:hidden">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={resetApp}
        >
          <div className="bg-energy-500 p-2 rounded-full">
            <Sun className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SolarSmart</span>
        </div>
        <nav className="flex gap-4">
            <Button 
                variant="ghost" 
                className="text-white hover:bg-navy-800 hover:text-energy-500"
                onClick={() => setCurrentView('WIZARD')}
            >
                <Home className="h-4 w-4 mr-2" />
                Hesapla
            </Button>
            <Button 
                variant="ghost" 
                className="text-white hover:bg-navy-800 hover:text-energy-500"
                onClick={handleAdminAccess}
            >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Panel
            </Button>
        </nav>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {renderHeader()}
      <main>
        {currentView === 'WIZARD' && (
            <Wizard 
                step={wizardStep} 
                setStep={setWizardStep} 
                data={inputData} 
                setData={setInputData} 
                onCalculate={handleCalculate}
                apiKey={googleMapsApiKey}
            />
        )}
        
        {currentView === 'RESULT' && (
            <ResultView 
                result={result} 
                onReset={resetApp} 
                inputData={inputData}
                leadSubmitted={leadSubmitted}
                setLeadSubmitted={setLeadSubmitted}
            />
        )}

        {currentView === 'ADMIN_LOGIN' && (
            <AdminLogin 
                onLogin={() => { 
                    setIsAuthenticated(true); 
                    setCurrentView('ADMIN_DASHBOARD'); 
                }} 
            />
        )}

        {currentView === 'ADMIN_DASHBOARD' && (
            <AdminDashboard 
                onLogout={handleLogout}
                settings={settings}
                updateSettings={setSettings}
            />
        )}
      </main>

      {/* API Key Entry Modal */}
      <Dialog 
        isOpen={showApiKeyDialog} 
        onClose={() => setShowApiKeyDialog(false)} 
        title="Google Maps API Anahtarı"
      >
        <div className="space-y-4">
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex items-start gap-2">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Harita özelliğini kullanmak için geçerli bir Google Maps API Anahtarı gereklidir. Anahtarınız tarayıcınızda yerel olarak saklanacaktır.</p>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">API Anahtarınız</label>
                <div className="relative">
                    <Key className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="AIzaSy..." 
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <p className="text-xs text-slate-500">
                    Anahtarınız yok mu? <a href="#" onClick={(e) => { e.preventDefault(); setShowApiKeyDialog(false); }} className="text-blue-600 hover:underline">Manuel giriş modunu kullanın.</a>
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSaveApiKey} className="bg-blue-600 hover:bg-blue-700 text-white">Kaydet ve Devam Et</Button>
            </div>
        </div>
      </Dialog>
    </div>
  );
};

export default App;
