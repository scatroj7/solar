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
  DollarSign
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
  Toast
} from './components/ui/UIComponents';
import { ProductionChart } from './components/Charts';
import { LeadForm } from './components/LeadForm';
import { CITIES, DEFAULT_SETTINGS } from './constants';
import { calculateSolarSystem } from './lib/calculator';
import { SettingsService, LeadService, AuthService } from './services/mockService';
import { CalculationInput, CalculationResult, RoofDirection, GlobalSettings, Lead, LeadStatus } from './types';

// --- Types ---
type View = 'WIZARD' | 'RESULT' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
type WizardStep = 'LOCATION' | 'ROOF' | 'BILL';

// --- Sub-Components ---

const Wizard = ({ 
    step, 
    setStep, 
    data, 
    setData, 
    onCalculate 
}: { 
    step: WizardStep, 
    setStep: (s: WizardStep) => void, 
    data: CalculationInput, 
    setData: (d: CalculationInput) => void, 
    onCalculate: () => void 
}) => {
    const progress = {
        'LOCATION': 33,
        'ROOF': 66,
        'BILL': 100
    };

    // Memoize city options to prevent sorting mutation on every render
    const cityOptions = useMemo(() => {
        return [...CITIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({ label: c.name, value: c.id }));
    }, []);

    const handleNext = () => {
        if (step === 'LOCATION') {
            if(!data.cityId) return alert('Lütfen bir şehir seçiniz.');
            setStep('ROOF');
        }
        else if (step === 'ROOF') {
            if(!data.roofArea) return alert('Lütfen çatı alanı giriniz.');
            setStep('BILL');
        }
        else if (step === 'BILL') {
            if(!data.billAmount) return alert('Lütfen fatura tutarı giriniz.');
            onCalculate();
        }
    };

    const handleBack = () => {
        if (step === 'ROOF') setStep('LOCATION');
        if (step === 'BILL') setStep('ROOF');
    };

    return (
        <div className="max-w-2xl mx-auto mt-12 px-4 pb-20">
            <div className="mb-8">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-energy-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress[step]}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-sm text-slate-500 font-medium">
                    <span className={step === 'LOCATION' ? 'text-navy-900' : ''}>Konum</span>
                    <span className={step === 'ROOF' ? 'text-navy-900' : ''}>Çatı Bilgisi</span>
                    <span className={step === 'BILL' ? 'text-navy-900' : ''}>Tüketim</span>
                </div>
            </div>

            <Card className="shadow-xl border-0 ring-1 ring-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle>
                        {step === 'LOCATION' && "Güneş enerjisi potansiyelini keşfedin"}
                        {step === 'ROOF' && "Çatı özellikleriniz neler?"}
                        {step === 'BILL' && "Elektrik faturanız ne kadar?"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {step === 'LOCATION' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Şehir Seçiniz</label>
                            <Select 
                                options={cityOptions}
                                value={data.cityId || ""}
                                onChange={(e) => setData({...data, cityId: Number(e.target.value)})}
                            />
                            <div className="flex items-start gap-3 mt-4 bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                <Info className="h-5 w-5 shrink-0" />
                                <p>Şehrinizin coğrafi konumu ve yıllık güneşlenme süresi, yatırım geri dönüş analizinde temel faktördür.</p>
                            </div>
                        </div>
                    )}

                    {step === 'ROOF' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Input 
                                label="Yaklaşık Çatı Alanı (m²)"
                                type="number"
                                min="10"
                                placeholder="Örn: 120"
                                value={data.roofArea || ''}
                                onChange={(e) => setData({...data, roofArea: Number(e.target.value)})}
                            />
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Çatı Yönü</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Object.values(RoofDirection).map((dir) => (
                                        <div 
                                            key={dir}
                                            onClick={() => setData({...data, roofDirection: dir})}
                                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${
                                                data.roofDirection === dir 
                                                ? 'bg-navy-50 border-navy-500 ring-1 ring-navy-500 text-navy-900 font-medium' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Compass className={`h-6 w-6 mx-auto mb-1 ${data.roofDirection === dir ? 'text-energy-500' : 'text-slate-400'}`} />
                                            <span className="text-sm">{dir}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'BILL' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Input 
                                label="Ortalama Aylık Fatura (TL)"
                                type="number"
                                min="100"
                                placeholder="Örn: 1500"
                                value={data.billAmount || ''}
                                onChange={(e) => setData({...data, billAmount: Number(e.target.value)})}
                            />
                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mt-4 text-sm flex gap-3">
                                <Zap className="h-5 w-5 shrink-0" />
                                <p><strong>İpucu:</strong> Daha doğru bir sonuç için yaz ve kış aylarının ortalamasını girmenizi öneririz.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        {step !== 'LOCATION' ? (
                            <Button variant="outline" onClick={handleBack}>
                                <ChevronLeft className="h-4 w-4 mr-2" /> Geri
                            </Button>
                        ) : <div />}
                        
                        <Button onClick={handleNext} className="bg-navy-800 hover:bg-navy-900 ml-auto">
                            {step === 'BILL' ? 'Analizi Tamamla' : 'Devam Et'}
                            {step !== 'BILL' && <ArrowRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const ResultView = ({ 
    result, 
    onReset, 
    inputData, 
    leadSubmitted, 
    setLeadSubmitted 
}: { 
    result: CalculationResult | null, 
    onReset: () => void, 
    inputData: CalculationInput,
    leadSubmitted: boolean,
    setLeadSubmitted: (v: boolean) => void
}) => {
    if (!result) return null;

    const formatCurrency = (amount: number, currency: 'USD' | 'TL') => {
        const currencyCode = currency === 'TL' ? 'TRY' : currency;
        return new Intl.NumberFormat('tr-TR', { 
            style: 'currency', 
            currency: currencyCode,
            maximumFractionDigits: 0 
        }).format(amount);
    };

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-navy-900">Güneş Enerjisi Potansiyeliniz</h1>
                <Button variant="outline" onClick={onReset}>Yeni Hesaplama</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-navy-900 text-white border-0 shadow-lg">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <span className="text-slate-300 text-sm mb-1">Önerilen Sistem</span>
                                <span className="text-3xl font-bold text-energy-500">{result.systemSizeKW} kWp</span>
                                <span className="text-xs text-slate-400 mt-2">{result.panelCount} Adet Panel</span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <span className="text-slate-500 text-sm mb-1">Tahmini Maliyet</span>
                                <span className="text-3xl font-bold text-navy-900">{formatCurrency(result.totalCostUSD, 'USD')}</span>
                                <span className="text-xs text-slate-500 mt-2">~{formatCurrency(result.totalCostTL, 'TL')}</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-100">
                            <CardContent className="flex flex-col items-center justify-center py-8">
                                <span className="text-green-700 text-sm mb-1">Geri Dönüş (ROI)</span>
                                <span className="text-3xl font-bold text-green-700">{result.roiYears} Yıl</span>
                                <span className="text-xs text-green-600 mt-2">Amortisman Süresi</span>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Yıllık Üretim vs Tüketim (kWh)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductionChart result={result} />
                            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-slate-500 mb-1">Aylık Tahmini Tasarruf</p>
                                    <p className="text-xl font-bold text-navy-900">{formatCurrency(result.monthlySavings, 'TL')}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-slate-500 mb-1">Doğaya Katkı (CO₂)</p>
                                    <p className="text-xl font-bold text-green-600">{result.co2Saved} Ton/Yıl</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className={`border-t-4 ${leadSubmitted ? 'border-green-500' : 'border-energy-500'} h-full shadow-lg`}>
                        <CardHeader>
                            <CardTitle>{leadSubmitted ? 'Talebiniz Alındı!' : 'Ücretsiz Detaylı Rapor'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leadSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="bg-green-100 p-4 rounded-full inline-flex mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="text-slate-600 mb-4 font-medium">Başvurunuz başarıyla ulaştı.</p>
                                    <p className="text-sm text-slate-500 mb-6">Mühendislerimiz çatınızı uydudan inceleyip 24 saat içinde size özel teklif sunacaklar.</p>
                                    <Button variant="outline" className="w-full" onClick={onReset}>Ana Sayfaya Dön</Button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                        Bu hesaplama bir ön analizdir. Çatınızın net ölçüleri ve gölgelenme analizi için uzmanlarımızdan <strong>ücretsiz keşif</strong> isteyin.
                                    </p>
                                    <LeadForm 
                                        inputData={inputData} 
                                        resultData={result} 
                                        onSuccess={() => setLeadSubmitted(true)} 
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

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
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader>
                    <CardTitle>Admin Girişi</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input 
                            type="password" 
                            placeholder="Şifre" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            error={error}
                        />
                        <Button type="submit" className="w-full">Giriş Yap</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

const AdminDashboard = ({ 
    onLogout, 
    settings, 
    updateSettings 
}: { 
    onLogout: () => void,
    settings: GlobalSettings,
    updateSettings: (s: GlobalSettings) => void
}) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
    const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');
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
                <Button variant="outline" onClick={onLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
                    <LogOut className="h-4 w-4 mr-2" /> Çıkış
                </Button>
            </div>
            
            <Tabs className="w-full">
                <TabsList className="mb-6 w-full justify-start border-b rounded-none p-0 h-auto bg-transparent border-slate-200">
                    <TabsTrigger active={activeTab === 'leads'} onClick={() => setActiveTab('leads')}>
                        <Users className="h-4 w-4 mr-2" /> Müşteri Adayları
                    </TabsTrigger>
                    <TabsTrigger active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                        <SettingsIcon className="h-4 w-4 mr-2" /> Sistem Ayarları
                    </TabsTrigger>
                </TabsList>

                <TabsContent active={activeTab === 'leads'}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Gelen Başvurular ({leads.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Tarih</th>
                                            <th className="px-4 py-3">Ad Soyad</th>
                                            <th className="px-4 py-3">Lokasyon</th>
                                            <th className="px-4 py-3">Telefon</th>
                                            <th className="px-4 py-3">Sistem</th>
                                            <th className="px-4 py-3">Maliyet (USD)</th>
                                            <th className="px-4 py-3">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {leads.length === 0 ? (
                                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Henüz başvuru bulunmamaktadır.</td></tr>
                                        ) : (
                                            leads.map((lead) => (
                                                <tr key={lead.id} className="hover:bg-slate-50 group">
                                                    <td className="px-4 py-3 text-slate-500">{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-4 py-3 font-medium text-navy-900">{lead.fullName}</td>
                                                    <td className="px-4 py-3 text-slate-600">{lead.city}</td>
                                                    <td className="px-4 py-3 text-slate-600">{lead.phone}</td>
                                                    <td className="px-4 py-3 font-semibold text-energy-600">{lead.systemSize} kWp</td>
                                                    <td className="px-4 py-3 text-slate-600">${lead.estimatedCost.toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <select 
                                                            className="bg-transparent text-xs font-medium border-none focus:ring-0 cursor-pointer"
                                                            value={lead.status}
                                                            onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                                                        >
                                                            <option value="New">Yeni</option>
                                                            <option value="Contacted">Arandı</option>
                                                            <option value="OfferSent">Teklif Verildi</option>
                                                            <option value="Closed">Satış Kapandı</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent active={activeTab === 'settings'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Finansal Parametreler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dolar Kuru (TL)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input 
                                            type="number" 
                                            className="pl-10"
                                            value={localSettings.usdRate}
                                            onChange={(e) => setLocalSettings({...localSettings, usdRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">Müşteriye gösterilen TL maliyetleri bu kur üzerinden hesaplanır.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Elektrik Birim Fiyatı (TL/kWh)</label>
                                    <Input 
                                        type="number"
                                        step="0.1" 
                                        value={localSettings.electricityPrice}
                                        onChange={(e) => setLocalSettings({...localSettings, electricityPrice: Number(e.target.value)})}
                                    />
                                    <p className="text-xs text-slate-500">ROI ve tasarruf hesaplamalarında kullanılır.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sistem Maliyetleri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Kurulum Maliyeti (USD / kW)</label>
                                    <Input 
                                        type="number" 
                                        value={localSettings.systemCostPerKw}
                                        onChange={(e) => setLocalSettings({...localSettings, systemCostPerKw: Number(e.target.value)})}
                                    />
                                    <p className="text-xs text-slate-500">Panel, inverter, işçilik dahil anahtar teslim kW fiyatı.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Varsayılan Panel Gücü (Watt)</label>
                                    <Input 
                                        type="number" 
                                        value={localSettings.panelWattage}
                                        onChange={(e) => setLocalSettings({...localSettings, panelWattage: Number(e.target.value)})}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSaveSettings} size="lg" className="bg-green-600 hover:bg-green-700">
                            Değişiklikleri Kaydet
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
            <Toast show={!!toastMessage} message={toastMessage || ''} onClose={() => setToastMessage(null)} />
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [currentView, setCurrentView] = useState<View>('WIZARD');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState<WizardStep>('LOCATION');
  const [inputData, setInputData] = useState<CalculationInput>({
    cityId: 0,
    roofArea: 0,
    roofDirection: RoofDirection.SOUTH,
    billAmount: 0
  });

  // Result State
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  // Admin & Settings State
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setSettings(SettingsService.get());
    setIsAuthenticated(AuthService.isAuthenticated());
  }, []);

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
          alert('Hesaplama hatası.');
      }
  };

  const resetApp = () => {
      setWizardStep('LOCATION');
      setInputData({ cityId: 0, roofArea: 0, roofDirection: RoofDirection.SOUTH, billAmount: 0 });
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
    <header className="bg-navy-900 text-white py-4 shadow-lg sticky top-0 z-50">
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
    </div>
  );
};

export default App;