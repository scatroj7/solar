
import React from 'react';
import { Proposal, Lead, DesignResult } from '../types';
import { Logo, Badge } from './ui/UIComponents';
import { 
  CheckCircle2, ShieldCheck, Zap, TrendingUp, Award, 
  ArrowRight, MapPin, BarChart3, HelpCircle, Phone, Mail, Globe, MousePointer2
} from 'lucide-react';

interface ProposalTemplateProps {
  proposal: Proposal;
  lead: Lead;
  designResult: DesignResult;
}

// Name capitalization helper
const formatName = (name: string) => {
  if (!name) return 'Sayın Müşteri';
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const ProposalTemplate = ({ proposal, lead, designResult }: ProposalTemplateProps) => {
  const validUntil = new Date(new Date(proposal.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR');
  const proposalId = `TR-${new Date().getFullYear()}-${proposal.id ? proposal.id.substring(0, 5).toUpperCase() : 'XXXX'}`;
  const formattedCustomerName = formatName(lead.fullName);
  
  // FIX: Accessing locationName from inputData as it is not a direct property of Lead
  const location = (!lead.city || lead.city === 'Manuel Giriş') ? (lead.inputData?.locationName || 'Türkiye') : lead.city;

  // Use the API key provided via environment variables
  const GOOGLE_API_KEY = process.env.API_KEY || "";

  // --- ROOF VISUALIZER COMPONENT ---
  const RoofVisualizer = () => {
    const { roofDim, visualGrid } = designResult.layoutAnalysis;
    const lat = lead.inputData?.coordinates?.lat || 39.93;
    const lng = lead.inputData?.coordinates?.lng || 32.85;
    
    // Using Google Static Maps API to ensure rendering in PDF capture
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&scale=2&key=${GOOGLE_API_KEY}`;

    const padding = 1; 
    const viewBoxW = roofDim.width + padding * 2;
    const viewBoxH = roofDim.length + padding * 2;

    return (
      <div className="w-full bg-slate-900 border border-navy-800 rounded-2xl overflow-hidden shadow-xl relative h-[280px]">
        {/* Background Satellite View */}
        <div className="absolute inset-0 bg-slate-800">
             <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <img 
                src={staticMapUrl} 
                alt="Satellite View" 
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />
        </div>
        
        <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
            <div className="absolute top-4 left-4 bg-navy-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                Mühendislik Projesi
            </div>
            
            <svg 
                viewBox={`-${padding} -${padding} ${viewBoxW} ${viewBoxH}`} 
                className="w-full h-full drop-shadow-2xl max-w-[85%]"
            >
                {/* Roof Boundary */}
                <rect x="0" y="0" width={roofDim.width} height={roofDim.length} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.05" strokeDasharray="0.1" />
                
                {/* Styled Solar Panels */}
                {visualGrid.map((p, idx) => (
                    <g key={idx}>
                        <rect 
                            x={p.x} y={p.y} width={p.w} height={p.h} 
                            fill="url(#pvGradient)" 
                            stroke="rgba(255,255,255,0.6)" 
                            strokeWidth="0.02" 
                        />
                        <line x1={p.x + p.w/2} y1={p.y} x2={p.x + p.w/2} y2={p.y + p.h} stroke="rgba(255,255,255,0.2)" strokeWidth="0.01" />
                    </g>
                ))}
                <defs>
                    <linearGradient id="pvGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="100%" stopColor="#172554" />
                    </linearGradient>
                </defs>
            </svg>
            
            <div className="absolute bottom-4 right-4 bg-navy-900/80 backdrop-blur-md p-2 rounded-lg flex gap-3 text-[8px] font-bold text-white border border-white/10">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-700 border border-white/40"></div> PV Panel</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 border border-white/40"></div> Çatı Alanı</div>
            </div>
        </div>
      </div>
    );
  };

  const PageWrapper = ({ children, pageNum, noPadding = false }: { children?: React.ReactNode; pageNum: number, noPadding?: boolean }) => (
    <div 
      id={`proposal-page-${pageNum}`}
      className="bg-white relative overflow-hidden mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: noPadding ? '0' : '20mm',
        boxSizing: 'border-box'
      }}
    >
        <div className="h-full flex flex-col relative z-20">
            {children}
        </div>
        
        {/* Footer with high visibility */}
        {!noPadding && (
            <div className="absolute bottom-10 left-16 right-16 flex justify-between items-end border-t border-slate-100 pt-6 z-30 bg-white">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-[10px] text-navy-900 tracking-tight">SolarSmart Enerji Teknoloji A.Ş.</span>
                    </div>
                    <div className="flex gap-4 text-[9px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> 0850 123 45 67</span>
                        <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> info@solarsmart.com.tr</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-400">Teklif No: <span className="text-slate-900 font-bold">{proposalId}</span></p>
                    <p className="text-[10px] font-black text-navy-900 mt-0.5">SAYFA {pageNum} / 4</p>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div id="proposal-capture-root" className="bg-slate-900 p-20 hidden">
      
      {/* --- PAGE 1: EXECUTIVE COVER --- */}
      <PageWrapper pageNum={1} noPadding>
        <div className="h-full flex flex-col relative bg-navy-900">
            {/* Hero Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1509391366360-fe5bb62c63b2?auto=format&fit=crop&q=80&w=1200" 
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover opacity-40"
                    alt="Solar Energy Hero"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full p-16">
                <div className="flex justify-between items-start">
                    <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20">
                        <Logo variant="light" className="scale-110 origin-top-left" />
                    </div>
                    <div className="text-right">
                        <Badge className="bg-energy-500 text-navy-900 font-black px-4 py-1.5 text-[11px] uppercase tracking-widest mb-1.5">Resmi Yatırım Teklifi</Badge>
                        <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center mt-12">
                    <div className="w-16 h-2 bg-energy-500 mb-8 rounded-full"></div>
                    <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter mb-8">
                        ENERJİDE <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-energy-400 to-yellow-400">GELECEĞİ</span> <br/>
                        KONTROL EDİN.
                    </h1>
                    <p className="text-2xl text-slate-300 font-medium max-w-lg leading-snug">
                        <span className="text-white font-black underline decoration-energy-500 underline-offset-8">{formattedCustomerName}</span> için özelleştirilmiş güneş enerjisi yatırım analiz dosyası.
                    </p>
                </div>

                {/* Cover Metrics */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 mb-12 shadow-2xl">
                    <div className="grid grid-cols-3 gap-10 text-white">
                        <div>
                            <p className="text-4xl font-black">4.5 <span className="text-lg font-medium text-white/60">Yıl</span></p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-energy-400 font-black mt-2">Geri Dönüş (ROI)</p>
                        </div>
                        <div className="border-l border-white/10 pl-10">
                            <p className="text-4xl font-black">%{designResult.layoutAnalysis.packingEfficiency}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black mt-2">Alan Verimliliği</p>
                        </div>
                        <div className="border-l border-white/10 pl-10">
                            <p className="text-4xl font-black">Tier-1</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-black mt-2">Kalite Sınıfı</p>
                        </div>
                    </div>
                </div>

                {/* Client Info Pill */}
                <div className="bg-energy-500 p-10 rounded-[48px] flex justify-between items-center shadow-2xl">
                    <div>
                        <p className="text-[10px] font-black text-navy-900/40 uppercase tracking-widest mb-1">Hazırlanan Kurum / Kişi</p>
                        <h2 className="text-4xl font-black text-navy-900 tracking-tight">{formattedCustomerName}</h2>
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-navy-900/80 font-black">
                            <MapPin className="h-4 w-4" /> {location}
                        </div>
                    </div>
                    <div className="text-right border-l border-navy-900/20 pl-12">
                        <p className="text-navy-900/40 text-[10px] font-black uppercase mb-1">Geçerlilik Tarihi</p>
                        <p className="text-2xl font-black text-navy-900">{validUntil}</p>
                    </div>
                </div>
            </div>
        </div>
      </PageWrapper>

      {/* --- PAGE 2: ENGINEERING & TECHNICAL --- */}
      <PageWrapper pageNum={2}>
        <div className="space-y-10 flex flex-col h-full">
            <div className="border-b border-slate-100 pb-6">
                <span className="text-energy-600 font-black text-xs uppercase tracking-[0.3em]">01. Mühendislik & Teknik Tasarım</span>
                <h2 className="text-4xl font-black text-navy-900 mt-2">Varlık Optimizasyonu</h2>
                <p className="text-slate-500 text-lg mt-3 max-w-2xl leading-relaxed">Mülkünüzün çatı yapısı 3D simülasyonlar ile taranmış ve maksimum güneş kazanımı için optimize edilmiştir.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-7">
                    <RoofVisualizer />
                    <div className="mt-6 p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                        <div className="flex items-center gap-3 mb-3">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                            <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Neden Bu Tasarım?</span>
                        </div>
                        <p className="text-[11px] text-blue-900/70 leading-relaxed font-medium">
                            Bu yerleşim planı, kış gün dönümü gölge boyları (21 Aralık) dikkate alınarak hazırlanmıştır. 
                            <strong> Minimum %98 alan verimliliği</strong> hedeflenerek enerji kaybı minimize edilmiştir.
                        </p>
                    </div>
                </div>

                <div className="col-span-5 space-y-6">
                    <div className="bg-navy-900 text-white p-8 rounded-[40px] relative overflow-hidden shadow-xl">
                        <div className="relative z-10 space-y-6">
                            <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                                <Award className="h-4 w-4 text-energy-500" /> Sistem Mimari Özeti
                            </p>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-[11px] text-white/40 font-bold">Kurulu Güç (DC)</span>
                                    <span className="text-2xl font-black text-energy-500">{designResult.layoutAnalysis.totalDCSizeKW} kWp</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-[11px] text-white/40 font-bold">Yıllık Üretim</span>
                                    <span className="text-xl font-black">~{(designResult.layoutAnalysis.totalDCSizeKW * 1450).toLocaleString()} kWh</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-[11px] text-white/40 font-bold">Panel Adedi</span>
                                    <span className="text-xl font-bold">{designResult.layoutAnalysis.totalPanelCount} Adet</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-5 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm items-center">
                            <div className="h-12 w-12 bg-energy-50 rounded-2xl flex items-center justify-center shadow-inner"><Zap className="text-energy-600 h-6 w-6" /></div>
                            <div>
                                <h4 className="text-sm font-black text-navy-900 uppercase tracking-tight">{designResult.selectedPanel.brand}</h4>
                                <p className="text-[11px] text-slate-500 font-bold">Tier-1 Class | {designResult.selectedPanel.powerW}W Panel</p>
                            </div>
                        </div>
                        <div className="flex gap-5 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm items-center">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner"><BarChart3 className="text-blue-600 h-6 w-6" /></div>
                            <div>
                                <h4 className="text-sm font-black text-navy-900 uppercase tracking-tight">{designResult.selectedInverter.brand}</h4>
                                <p className="text-[11px] text-slate-500 font-bold">Akıllı Inverter | {designResult.selectedInverter.powerKW}kW</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </PageWrapper>

      {/* --- PAGE 3: INVESTMENT CASE --- */}
      <PageWrapper pageNum={3}>
        <div className="space-y-10">
            <div className="border-b border-slate-100 pb-6">
                <span className="text-green-600 font-black text-xs uppercase tracking-[0.3em]">02. Finansal Fizibilite & ROI Analizi</span>
                <h2 className="text-4xl font-black text-navy-900 mt-2">Yatırımın Geri Dönüşü</h2>
                <p className="text-slate-500 text-lg mt-3 max-w-2xl leading-relaxed">Bu sayfa, enerji maliyetlerinizi nakit akışına dönüştüren finansal parametreleri içerir.</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-green-600 p-10 rounded-[48px] text-white shadow-2xl flex flex-col justify-between h-[240px]">
                    <div>
                        <div className="flex items-center gap-2 mb-6 bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md">
                            <TrendingUp className="h-4 w-4 text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">ROI SÜRESİ</span>
                        </div>
                        <p className="text-6xl font-black tracking-tighter">4.5 <span className="text-2xl font-medium opacity-80">Yıl</span></p>
                    </div>
                    <p className="text-[11px] text-green-100/90 leading-relaxed font-medium">* Enerji enflasyonu ve tarife artışları dahil reel geri dönüş öngörüsüdür.</p>
                </div>

                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-[48px] p-10 flex flex-col justify-between shadow-inner">
                    <div className="flex items-start gap-6">
                        <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-200"><BarChart3 className="text-blue-600 h-8 w-8" /></div>
                        <div>
                            <h4 className="font-black text-navy-900 text-xl tracking-tight">Finansal Karar Desteği</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mt-3 font-medium">
                                Mevcut enerji maliyetleriniz karşısında bu yatırım, işletmeniz için bir masraf değil, 
                                <strong> yıllık %22+ reel getiri</strong> sağlayan bir finansal enstrümandır.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-200 pt-8 mt-8">
                        <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">25 Yıllık Net Kazanç</span>
                            <div className="text-4xl font-black text-navy-900 mt-2">₺{(proposal.finalPriceUSD * 5.2 * proposal.usdRateSnapshot).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 px-6 py-3 rounded-full font-black text-[11px] uppercase tracking-widest border border-green-200">Sıfır Karbon</Badge>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-100">
                        <tr>
                            <th className="p-6 pl-10">PROJEKSİYON DÖNEMİ</th>
                            <th className="p-6">ÜRETİM VERİMİ</th>
                            <th className="p-6">TASARRUF TUTARI</th>
                            <th className="p-6 pr-10 text-right">KÜMÜLATİF GETİRİ</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-navy-900">
                        {[1, 5, 10, 25].map((year, idx) => {
                            const yYield = Math.round(designResult.layoutAnalysis.totalDCSizeKW * 1450 * Math.pow(0.995, year));
                            const savings = Math.round(yYield * 0.12 * Math.pow(1.05, year));
                            return (
                                <tr key={year} className={`border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                    <td className="p-6 pl-10 font-black">{year}. Yıl Sonu</td>
                                    <td className="p-6 text-slate-500">{yYield.toLocaleString()} kWh</td>
                                    <td className="p-6 text-green-600 font-black">+${savings.toLocaleString()}</td>
                                    <td className="p-6 pr-10 text-right text-lg font-black">${Math.round(savings * year * 0.85).toLocaleString()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-12 bg-navy-900 rounded-[64px] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-energy-500/10 to-transparent"></div>
                <div className="relative z-10">
                    <p className="text-energy-500 font-black tracking-[0.3em] uppercase text-[11px] mb-2">Toplam Yatırım Maliyeti</p>
                    <div className="text-[54pt] font-black leading-none tracking-tighter">${proposal.finalPriceUSD.toLocaleString()}</div>
                    <p className="text-[11px] text-white/40 mt-6 font-bold uppercase tracking-widest">KDV Hariçtir • 1 USD = {proposal.usdRateSnapshot} TL • Tüm Mühendislik Dahil</p>
                </div>
                <div className="relative z-10 opacity-20 scale-150 mr-8">
                    <Logo variant="light" className="grayscale" />
                </div>
            </div>
        </div>
      </PageWrapper>

      {/* --- PAGE 4: PROCESS & COMMITMENT --- */}
      <PageWrapper pageNum={4}>
        <div className="space-y-10 flex flex-col h-full justify-between pb-12">
            <div className="space-y-10">
                <div className="border-b border-slate-100 pb-6">
                    <span className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">03. Süreç Yönetimi & Kapsam</span>
                    <h2 className="text-4xl font-black text-navy-900 mt-2">Taahhüt ve Güvence</h2>
                    <p className="text-slate-500 text-lg mt-3 max-w-2xl leading-relaxed">Yatırımınızın kurulumundan 25 yıllık ömrüne kadar tüm süreçler SolarSmart güvencesi altındadır.</p>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <h4 className="text-lg font-black text-navy-900 flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-energy-500" /> Hizmet Kapsamı
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                "Statik & Elektrik Projelendirme",
                                "Çağrı Mektubu (Resmi Başvuru) Süreci",
                                "T-1 Sınıfı Panel & Inverter Tedariği",
                                "Mekanik Montaj & Anahtar Teslim Kurulum",
                                "TEDAŞ Geçici Kabul İşlemleri",
                                "7/24 Uzaktan İzleme Aktivasyonu"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-xs font-black text-navy-900 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-2 h-2 bg-energy-500 rounded-full"></div> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <h4 className="text-lg font-black text-navy-900 flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-blue-500" /> Ürün Garantileri
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Panel Performans</span> 
                                <span className="font-black text-navy-900 text-2xl">25 Yıl</span>
                            </div>
                            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Inverter (Tier-1)</span> 
                                <span className="font-black text-navy-900 text-2xl">10 Yıl</span>
                            </div>
                            <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
                                <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Sistem İşçilik</span> 
                                <span className="font-black text-navy-900 text-2xl">2 Yıl</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic px-4 leading-relaxed mt-4 font-medium">* Panel performans garantisi, 25 yıl sonunda minimum %84 verimlilik taahhüt eder.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-200 shadow-inner">
                <h4 className="text-2xl font-black text-navy-900 mb-12 flex items-center gap-4">
                    <ArrowRight className="text-energy-500 h-10 w-10" /> Bir Sonraki Adım
                </h4>
                <div className="grid grid-cols-3 gap-12 relative">
                    <div className="absolute top-10 left-20 right-20 h-1 bg-slate-200 z-0"></div>
                    <div className="relative z-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl font-black text-2xl text-navy-900 border border-slate-100">1</div>
                        <div>
                            <p className="text-xs font-black text-navy-900 uppercase tracking-widest">Keşif Onayı</p>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium leading-tight">Teknik kontrol ve statik ölçümlerin yapılması.</p>
                        </div>
                    </div>
                    <div className="relative z-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl font-black text-2xl text-navy-900 border border-slate-100">2</div>
                        <div>
                            <p className="text-xs font-black text-navy-900 uppercase tracking-widest">Sözleşme</p>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium leading-tight">Hukuki süreçlerin ve ödeme planının netleşmesi.</p>
                        </div>
                    </div>
                    <div className="relative z-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-energy-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl font-black text-2xl text-navy-900 border-4 border-white">3</div>
                        <div>
                            <p className="text-xs font-black text-energy-700 uppercase tracking-widest">Aktivasyon</p>
                            <p className="text-[11px] text-slate-500 mt-2 font-medium leading-tight">Resmi başvurunun başlatılması ve kurulum.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center flex flex-col items-center space-y-8">
                <p className="text-xs text-slate-400 font-bold max-w-lg leading-relaxed">Bu teklif ön fizibilite analizi olup, nihai statik raporlar ve saha keşfi sonrası resmi sözleşme aşamasına geçilecektir.</p>
                <div className="flex gap-8">
                    <button className="px-14 py-6 bg-navy-900 text-white rounded-[32px] font-black text-sm shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
                         SÜRECİ BAŞLATALIM <MousePointer2 className="h-6 w-6" />
                    </button>
                    <button className="px-14 py-6 bg-white border border-slate-200 text-navy-900 rounded-[32px] font-black text-sm shadow-xl hover:bg-slate-50 transition-all">
                         DANIŞMANA SOR
                    </button>
                </div>
            </div>
        </div>
      </PageWrapper>
    </div>
  );
};
