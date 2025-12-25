import React, { useState, useEffect } from 'react';
import { 
  Sun, Zap, LayoutDashboard, Home,
  LogOut, Info, Download, Award, Leaf,
  Loader2, PenTool, Factory, Briefcase, Moon, Clock, Lock,
  FileQuestion, Trees
} from 'lucide-react';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Input, Tabs, TabsList, TabsTrigger, 
  TabsContent, Progress, Badge, Logo
} from './components/ui/UIComponents';
import Hero from './components/ui/animated-shader-hero';
import { RoofMapper } from './components/RoofMapper';
import { ProductionChart, FinancialComparisonChart, ROIChart } from './components/Charts';
import { LeadForm } from './components/LeadForm';
import { AdminDashboard } from './components/AdminDashboard'; // Imported Extracted Component
import { DEFAULT_SETTINGS, TARIFF_RATES } from './constants';
import { calculateSolarSystem } from './lib/calculator';
import { SettingsService, AuthService } from './services/mockService';
import { DB } from './services/db';
import { CalculationInput, SimulationResult, RoofDirection, GlobalSettings, BuildingType, ConsumptionProfile, ScenarioType } from './types';

// PDF imports
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Configuration ---
const DEV_MAP_KEY = ""; 
const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || DEV_MAP_KEY;

// --- Types ---
type View = 'LANDING' | 'WIZARD' | 'RESULT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
type WizardStep = 'ROOF_MAP' | 'PROFILE' | 'BILL';

// --- Components ---

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
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
        <div className="flex items-center justify-center min-h-[calc(100vh-160px)] animate-in fade-in duration-500">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-navy-900">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-navy-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-navy-900" />
                    </div>
                    <CardTitle>Yönetici Girişi</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input 
                            type="password" 
                            placeholder="Şifre" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            error={error} 
                            autoFocus
                        />
                        <Button type="submit" className="w-full bg-navy-900 hover:bg-navy-800">Giriş Yap</Button>
                    </form>
                    <div className="mt-4 text-center text-xs text-slate-400">
                        Demo Şifresi: <strong>admin123</strong>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Wizard Component ---
const Wizard = ({ step, setStep, data, setData, onCalculate, apiKey }: any) => {
    useEffect(() => {
        if (step === 'BILL' && data.billAmount === 0 && data.buildingType) {
            const defaults: any = { [BuildingType.MESKEN]: 1500, [BuildingType.TICARETHANE]: 8000, [BuildingType.SANAYI]: 50000 };
            setData({ ...data, billAmount: defaults[data.buildingType] || 2000 });
        }
    }, [step, data.buildingType]);
    
    const progressValue = step === 'ROOF_MAP' ? 33 : step === 'PROFILE' ? 66 : 100;
    
    return (
        <div className="max-w-3xl mx-auto mt-8 px-4 pb-20 animate-in fade-in duration-300">
            <div className="mb-6 text-center"><h2 className="text-2xl font-bold text-navy-900 mb-2">Solar Hesaplama Sihirbazı</h2></div>
            <div className="mb-8 max-w-xl mx-auto"><Progress value={progressValue} className="h-2" /></div>
            <Card className="shadow-2xl border-0 ring-1 ring-slate-100 overflow-hidden"><CardContent className="space-y-6 pt-8 pb-8">
                {step === 'ROOF_MAP' && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-navy-900">Çatı Alanınızı Belirleyin</h3>
                            <p className="text-slate-500 text-sm">Harita üzerinden çatınızı bulun ve köşelerini işaretleyerek alanını ölçün.</p>
                        </div>
                        <RoofMapper apiKey={apiKey} onComplete={(res) => { setData({...data, roofArea: res.area, coordinates: res.coordinates, locationName: res.locationName}); setTimeout(()=>setStep('PROFILE'),500); }} />
                    </div>
                )}
                
                {step === 'PROFILE' && (
                    <div>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-navy-900">Bina Tipi Nedir?</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[
                                { id: BuildingType.MESKEN, icon: Home, label: 'Müstakil Ev / Villa', desc: 'Düşük Tarife' },
                                { id: BuildingType.TICARETHANE, icon: Briefcase, label: 'İş Yeri / Ofis', desc: 'Yüksek Tarife, Hızlı ROI' },
                                { id: BuildingType.SANAYI, icon: Factory, label: 'Fabrika / Depo', desc: 'Endüstriyel Tarife' }
                            ].map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setData({...data, buildingType: item.id})} 
                                    className={`cursor-pointer p-6 rounded-xl border-2 text-center transition-all hover:shadow-md h-full flex flex-col items-center justify-center ${data.buildingType === item.id ? 'border-energy-500 ring-2 ring-energy-200' : 'border-slate-200 hover:border-energy-300'}`}
                                >
                                    <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${data.buildingType === item.id ? 'bg-energy-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <item.icon className="h-7 w-7"/>
                                    </div>
                                    <p className={`font-bold text-navy-900 mb-1 ${data.buildingType === item.id ? 'text-lg' : ''}`}>{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mb-4 mt-8">
                            <h3 className="text-lg font-bold text-navy-900">Elektrik Tüketim Zamanı</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: ConsumptionProfile.GUNDUZ, icon: Sun, label: 'Gündüz Ağırlıklı', desc: '08:00 - 18:00' },
                                { id: ConsumptionProfile.DENGELI, icon: Clock, label: 'Dengeli (7/24)', desc: 'Ev / Home Office' },
                                { id: ConsumptionProfile.AKSAM, icon: Moon, label: 'Akşam Ağırlıklı', desc: '18:00 Sonrası' }
                            ].map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setData({...data, consumptionProfile: item.id})} 
                                    className={`cursor-pointer px-4 py-4 rounded-xl border flex items-center gap-4 transition-all hover:shadow-sm ${data.consumptionProfile === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className={`p-2 rounded-lg ${data.consumptionProfile === item.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <item.icon className="h-5 w-5"/>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm text-navy-900">{item.label}</p>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="col-span-3 mt-8 flex justify-between">
                             <Button variant="ghost" onClick={() => setStep('ROOF_MAP')}>&larr; Geri</Button>
                             <Button onClick={() => setStep('BILL')}>Devam Et &rarr;</Button>
                        </div>
                    </div>
                )}
                
                {step === 'BILL' && (
                    <div className="text-center max-w-lg mx-auto py-2">
                        <h3 className="text-2xl font-bold text-navy-900 mb-8">Son Adım: Fatura Bilgisi</h3>
                        <div className="relative mb-6">
                            <Input 
                                type="number" 
                                value={data.billAmount || ''} 
                                onChange={(e) => setData({...data, billAmount: Number(e.target.value)})} 
                                className="text-4xl text-center py-8 font-bold text-navy-900 tracking-tight border-slate-300 shadow-sm" 
                                placeholder="1500"
                                autoFocus
                            />
                            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl">₺</span>
                            <p className="text-xs text-slate-400 mt-2">Aylık ortalama elektrik faturası tutarı</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg py-3 px-4 mb-6 inline-flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-600 fill-blue-600" />
                            <span className="text-blue-800 font-semibold text-sm">Seçilen Tarife: <span className="text-blue-900 font-bold">{TARIFF_RATES[data.buildingType as BuildingType] || 2.4} TL/kWh</span></span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3 text-left mb-8">
                             <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                             <p className="text-sm text-yellow-800 leading-snug">
                                <strong>İpucu:</strong> Girdiğiniz fatura tutarı ve bina tipi üzerinden yıllık tüketiminiz (kWh) hesaplanacaktır.
                             </p>
                        </div>
                        <div className="flex gap-4">
                             <Button variant="ghost" className="flex-1" onClick={() => setStep('PROFILE')}>&larr; Geri</Button>
                             <Button className="flex-[2] py-6 text-lg bg-energy-500 hover:bg-energy-600 text-white shadow-lg shadow-energy-200" onClick={onCalculate}>
                                Analizi Başlat
                             </Button>
                        </div>
                    </div>
                )}
            </CardContent></Card>
        </div>
    );
};

// --- ResultView Component ---
const ResultView = ({ result, onReset, inputData, leadSubmitted, setLeadSubmitted, isCustomerView }: any) => {
    const [activeScenario, setActiveScenario] = useState<ScenarioType>('OPTIMAL');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!result) return null;

    const currentData = result.scenarios[activeScenario];
    const roi = currentData.roiYears;
    
    // Sustainability Calculation
    const treeEquivalent = Math.round(currentData.co2Saved * 17); // 1 Ton CO2 approx 17 trees

    // Narrative Logic
    const selfConsumptionPercent = Math.round((currentData.selfConsumptionRate));
    const monthlySaving = currentData.monthlySavings.toLocaleString('tr-TR');
    
    // Senaryo Adı Eşleşmesi
    const SCENARIO_LABELS: Record<string, string> = {
        'OPTIMAL': 'Optimal',
        'CONSERVATIVE': 'Muhafazakar',
        'AGGRESSIVE': 'Agresif'
    };

    const handleDownloadPDF = async () => {
        const reportElement = document.getElementById('report-content');
        if(!reportElement) return;

        window.scrollTo(0, 0); 
        setIsGeneratingPdf(true);
        reportElement.classList.add('pdf-mode');

        // 🔥 CRITICAL FIX: Trigger Resize Event so Charts redraw at 1200px width
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for CSS class
        window.dispatchEvent(new Event('resize')); // Force Recharts update
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for animation/render

        try {
            const canvas = await html2canvas(reportElement, { 
                scale: 2, // High quality
                useCORS: true, 
                backgroundColor: '#ffffff',
                scrollY: 0,
                y: 0,
                // Force fixed width capture to match PDF mode
                width: 1200,
                windowWidth: 1200
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // FIT TO ONE PAGE LOGIC
            const widthRatio = pdfWidth / imgWidth;
            const heightRatio = pdfHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            const x = (pdfWidth - finalWidth) / 2;
            const y = 0; 

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(`SolarSmart_Rapor_${result.city.name}.pdf`);

        } catch (err) {
            console.error("PDF Fail:", err);
            alert("PDF oluşturulurken hata meydana geldi.");
        } finally {
            reportElement.classList.remove('pdf-mode');
            setIsGeneratingPdf(false);
            // Revert charts to normal size
            window.dispatchEvent(new Event('resize'));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-2xl font-bold text-navy-900">Fizibilite Raporu</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="animate-spin mr-2"/> : <Download className="mr-2"/>} PDF İndir
                    </Button>
                    {!isCustomerView && (
                        <Button variant="ghost" size="sm" onClick={onReset} className="text-red-600"><LogOut className="mr-2"/> Çıkış</Button>
                    )}
                </div>
            </div>

            <div id="report-content" className="bg-slate-50 p-4 md:p-8 rounded-xl relative max-w-[1200px] mx-auto">
                
                {/* PDF Spacer */}
                <div className="hidden pdf-spacer h-[40px]"></div>

                {/* PDF Header */}
                <div id="pdf-header" className="hidden pdf-header text-center mb-10 border-b pb-4">
                    <div className="flex justify-center mb-4"><Logo className="scale-125 origin-center" /></div>
                    <div className="flex justify-center items-center gap-4 mt-2">
                        <p className="text-slate-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                        <span className="text-slate-300">|</span>
                        <p className="text-energy-600 font-bold uppercase tracking-wider">
                            {SCENARIO_LABELS[activeScenario]} Senaryosu
                        </p>
                    </div>
                </div>
                
                {/* 1. Executive Summary (Hikaye Modu) */}
                <div id="pdf-executive" className="bg-blue-50 border-l-8 border-energy-500 rounded-r-xl p-8 mb-12 shadow-sm">
                    <h3 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                        <Award className="h-6 w-6 text-energy-600" />
                        Yönetici Özeti
                    </h3>
                    <p className="text-slate-700 text-lg leading-relaxed">
                        Sayın Kullanıcı, <span className="font-bold text-navy-900">{inputData.locationName || result.city.name}</span> bölgesindeki mülkünüz için 
                        <span className="font-bold text-navy-900"> {currentData.systemSizeKW} kWp</span> gücünde bir güneş enerjisi sistemi kurulumu öngörülmüştür. 
                        
                        Bu sistem, yıllık enerji ihtiyacınızın <span className="font-bold text-green-700">%{selfConsumptionPercent}'ini</span> doğrudan karşılayarak, 
                        elektrik faturanızda aylık ortalama <span className="font-bold text-green-700">{monthlySaving} TL</span> tasarruf sağlayacaktır.
                        
                        Yatırımınız kendini yaklaşık <span className="font-bold text-navy-900">{roi} yılda</span> amorti edecek olup, 
                        sistemin 25 yıllık ekonomik ömrü boyunca size toplam <span className="font-bold text-navy-900">{currentData.netProfit25Years.toLocaleString('tr-TR')} TL</span> net nakit akışı yaratacaktır.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* 2. Key Metrics Grid */}
                        <div id="pdf-stats">
                            <Tabs className="w-full no-print mb-6"><TabsList className="w-full grid grid-cols-3"><TabsTrigger active={activeScenario==='OPTIMAL'} onClick={()=>setActiveScenario('OPTIMAL')}>Optimal</TabsTrigger><TabsTrigger active={activeScenario==='CONSERVATIVE'} onClick={()=>setActiveScenario('CONSERVATIVE')}>Muhafazakar</TabsTrigger><TabsTrigger active={activeScenario==='AGGRESSIVE'} onClick={()=>setActiveScenario('AGGRESSIVE')}>Agresif</TabsTrigger></TabsList></Tabs>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <Card className="border-t-4 border-t-energy-500"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-navy-900">{currentData.systemSizeKW} <span className="text-sm font-normal text-slate-500">kWp</span></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sistem Gücü</span></CardContent></Card>
                                <Card className="border-t-4 border-t-blue-500"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-navy-900">${currentData.totalCostUSD.toLocaleString()}</div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Yatırım Tutarı</span></CardContent></Card>
                                <Card className="border-t-4 border-t-green-500"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-green-600">{currentData.roiYears} <span className="text-sm font-normal text-slate-500">Yıl</span></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amortisman</span></CardContent></Card>
                                <Card className="border-t-4 border-t-purple-500"><CardContent className="p-6 text-center"><div className="text-3xl font-bold text-navy-900">{currentData.netProfit25Years.toLocaleString()} <span className="text-sm font-normal text-slate-500">₺</span></div><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">25 Yıllık Getiri</span></CardContent></Card>
                            </div>
                        </div>

                        {/* 3. Charts Area */}
                        <div id="pdf-charts" className="space-y-12">
                            <div className="h-[400px] w-full"><ProductionChart result={currentData} /></div>
                            <div className="h-[400px] w-full"><FinancialComparisonChart result={currentData} /></div>
                            <div className="h-[400px] w-full"><ROIChart result={currentData} /></div>
                        </div>

                        {/* 4. Sustainability Card */}
                        <div id="pdf-sustainability" className="mt-8">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                                <div className="bg-green-100 p-6 rounded-full shrink-0">
                                    <Leaf className="h-12 w-12 text-green-600" />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h4 className="text-xl font-bold text-green-900 mb-2">Gezegen İçin Büyük Adım</h4>
                                    <p className="text-green-800 text-lg">
                                        Bu sistem sayesinde yılda <span className="font-bold">{currentData.co2Saved} Ton</span> karbon salınımını engelliyorsunuz. 
                                        Bu, her yıl doğaya <span className="font-bold text-2xl mx-1">{treeEquivalent}</span> adet ağaç dikmeye eşdeğerdir.
                                    </p>
                                </div>
                                <div className="hidden md:block opacity-20">
                                    <Trees className="h-24 w-24 text-green-900" />
                                </div>
                            </div>
                            <div className="hidden pdf-header text-center mt-8 pt-4 border-t text-sm text-slate-400">
                                SolarSmart Teknoloji A.Ş. tarafından oluşturulmuştur.
                            </div>
                        </div>
                    </div>

                    {!isCustomerView && (
                        <div className="lg:col-span-1 right-column no-print">
                            <Card className="sticky top-6 border-t-4 border-energy-500 shadow-xl">
                                <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-center">{leadSubmitted ? 'Talebiniz Alındı' : 'Ücretsiz Teklif İste'}</CardTitle></CardHeader>
                                <CardContent className="p-6">
                                    {leadSubmitted ? (
                                        <div className="text-center py-8">
                                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-navy-900 mb-2">Başvurunuz Alındı!</h3>
                                            <p className="text-slate-600">Uzmanlarımız en kısa sürede sizinle iletişime geçecektir. Rapor linkiniz e-posta adresinize gönderildi.</p>
                                        </div>
                                    ) : (
                                        <LeadForm inputData={inputData} resultData={currentData} onSuccess={() => setLeadSubmitted(true)} />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<View>('LANDING');
  const [step, setStep] = useState<WizardStep>('ROOF_MAP');
  const [inputData, setInputData] = useState<CalculationInput>({
    cityId: 6, roofArea: 0, roofDirection: RoofDirection.SOUTH, billAmount: 0, 
    buildingType: BuildingType.MESKEN, consumptionProfile: ConsumptionProfile.DENGELI
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCustomerView, setIsCustomerView] = useState(false);
  
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(SettingsService.get());
    setIsAuthenticated(AuthService.isAuthenticated());

    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('proposalId');

    if (proposalId) {
        loadProposal(proposalId);
    }
  }, []);

  const loadProposal = async (id: string) => {
      setIsLoadingProposal(true);
      setProposalError(null);
      try {
          const lead = await DB.getLeadById(id);
          if (lead) {
              if (lead.inputData) {
                  try {
                      const simResult = calculateSolarSystem(lead.inputData, SettingsService.get());
                      setResult(simResult);
                      setInputData(lead.inputData);
                      setView('RESULT');
                      setIsCustomerView(true);
                      setLeadSubmitted(true);
                  } catch(err) {
                       console.error("Calculation error for proposal:", err);
                       setProposalError("Rapor verileri hesaplanırken bir hata oluştu.");
                  }
              } else {
                  setProposalError("Bu rapor için gerekli veri bulunamadı.");
              }
          } else {
              setProposalError("Rapor bulunamadı veya süresi dolmuş.");
          }
      } catch (e) {
          console.error(e);
          setProposalError("Sunucu hatası.");
      } finally {
          setIsLoadingProposal(false);
      }
  };

  const handleCalculate = () => {
    try {
      const simulationResult = calculateSolarSystem(inputData, settings);
      setResult(simulationResult);
      setView('RESULT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert("Hata oluştu.");
    }
  };

  const handleReset = () => {
    setResult(null);
    // Reset to Landing unless logged in as admin? No, reset goes to wizard usually, but let's go to Landing for full reset.
    // Actually, going to WIZARD is better for UX after "Reset", but let's go to Landing for "Home" feel.
    setView('LANDING'); 
    setStep('ROOF_MAP');
    setLeadSubmitted(false);
    setInputData(prev => ({ ...prev, roofArea: 0, billAmount: 0, coordinates: undefined, locationName: undefined }));
    window.history.pushState({}, '', window.location.pathname);
    setIsCustomerView(false);
    setProposalError(null);
  };

  const handleAdminAccess = () => {
      if (isAuthenticated) setView('ADMIN_DASHBOARD');
      else setView('ADMIN_LOGIN');
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setView('LANDING');
  };

  if (isLoadingProposal) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-energy-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-navy-900">Raporunuz Hazırlanıyor...</h2>
          </div>
      )
  }

  if (proposalError) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                  <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <FileQuestion className="h-8 w-8 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-navy-900 mb-2">Hata</h2>
                  <p className="text-slate-600 mb-6 text-sm">{proposalError}</p>
                  <Button onClick={handleReset}>Ana Sayfaya Dön</Button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-energy-200">
      {/* Header hidden on Landing Page and Admin Dashboard (which has its own header) */}
      {!isCustomerView && view !== 'LANDING' && view !== 'ADMIN_DASHBOARD' && (
          <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-40 shadow-md">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={handleReset}>
                <Logo />
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="ghost" size="sm" onClick={handleAdminAccess} className="text-slate-300 hover:text-white hover:bg-navy-800">
                    {isAuthenticated ? <LayoutDashboard className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                 </Button>
              </div>
            </div>
          </header>
      )}

      <main className={view === 'LANDING' ? 'pb-0' : 'pb-20'}>
        {/* LANDING PAGE INTEGRATION */}
        {view === 'LANDING' && (
             <Hero
                trustBadge={{
                  text: "Geleceğe Yatırım Yapın",
                  icons: ["☀️"]
                }}
                headline={{
                  line1: "Güneşin Gücü",
                  line2: "Geleceğin Enerjisi"
                }}
                subtitle="SolarSmart ile çatı güneş enerjisi potansiyelinizi saniyeler içinde keşfedin, yatırım geri dönüş sürenizi hesaplayın ve ücretsiz teklif alın."
                buttons={{
                  primary: {
                    text: "Ücretsiz Hesapla",
                    onClick: () => setView('WIZARD')
                  },
                  secondary: {
                    text: "Yönetici Girişi",
                    onClick: handleAdminAccess
                  }
                }}
             />
        )}

        {view === 'WIZARD' && <Wizard step={step} setStep={setStep} data={inputData} setData={setInputData} onCalculate={handleCalculate} apiKey={GOOGLE_MAPS_API_KEY} />}
        {view === 'RESULT' && <ResultView result={result} onReset={handleReset} inputData={inputData} leadSubmitted={leadSubmitted} setLeadSubmitted={setLeadSubmitted} isCustomerView={isCustomerView} />}
        {view === 'ADMIN_LOGIN' && <AdminLogin onLogin={() => { setIsAuthenticated(true); setView('ADMIN_DASHBOARD'); }} />}
        {view === 'ADMIN_DASHBOARD' && <AdminDashboard onLogout={handleLogout} settings={settings} updateSettings={setSettings} />}
      </main>

      {!isCustomerView && (view === 'WIZARD' || view === 'RESULT') && (
      <footer className="bg-navy-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs">
            &copy; {new Date().getFullYear()} SolarSmart Teknoloji A.Ş. Tüm hakları saklıdır.
        </div>
      </footer>
      )}
    </div>
  );
};

export default App;
// Helper icon
const CheckCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);