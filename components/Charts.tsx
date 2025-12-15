import React from 'react';
import { 
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { ScenarioResult } from '../types';

const COLORS = {
  NAVY: '#0A2342',
  GOLD: '#FF9F1C',
  GREEN: '#10B981',
  RED: '#EF4444',
  GRAY: '#94a3b8',
  BG_GOLD: '#fffbeb', // amber-50 equivalent
  BG_NAVY: '#f0f9ff', // sky-50 equivalent
  BG_GREEN: '#ecfdf5', // emerald-50 equivalent
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200 text-sm z-50">
        <p className="font-bold text-navy-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 font-medium">{entry.name}:</span>
            <span className="font-bold text-slate-800">
              {entry.value.toLocaleString('tr-TR')} {entry.unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Ortak Stil Wrapper
const ChartWrapper = ({ title, subtitle, children }: React.PropsWithChildren<{ title: string, subtitle?: string }>) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col w-full">
    <div className="mb-6">
      <h3 className="text-lg font-bold text-navy-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className="flex-1 w-full min-h-[300px]">
      {children}
    </div>
  </div>
);

// 1. Aylık Üretim vs Tüketim
export const ProductionChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <ChartWrapper title="Aylık Enerji Dengesi" subtitle="Üretim ve Tüketim Karşılaştırması (kWh)">
      {/* 99% width prevents Recharts from infinite resizing loops or overflow */}
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={result.monthlyProduction} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.GOLD} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.GOLD} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.NAVY} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.NAVY} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            tickLine={false} 
            axisLine={false} 
            tickMargin={10}
            minTickGap={5} // Ensure labels don't hide
            interval="preserveStartEnd" // Force start and end months
          />
          <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} verticalAlign="top" height={36}/>
          
          <Area 
            type="monotone" 
            dataKey="production" 
            stroke={COLORS.GOLD} 
            strokeWidth={3}
            fill="url(#colorProd)" 
            name="Güneş Üretimi" 
            unit=" kWh"
          />
          <Area 
            type="monotone" 
            dataKey="consumption" 
            stroke={COLORS.NAVY} 
            strokeWidth={3}
            fill="url(#colorCons)" 
            name="Ev Tüketimi" 
            unit=" kWh"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// 2. Finansal Karşılaştırma (Güneşli vs Güneşsiz Hayat)
export const FinancialComparisonChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <ChartWrapper title="25 Yıllık Nakit Akışı" subtitle="SolarSmart Sistemi vs Şebeke Faturası">
      <ResponsiveContainer width="99%" height="100%">
        <LineChart data={result.yearlyAnalysis} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            tickLine={false} 
            axisLine={false} 
            tickMargin={10} 
            interval="preserveStartEnd"
          />
          <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} verticalAlign="top" height={36} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          
          <Line 
            type="monotone" 
            dataKey="netProfit" 
            stroke={COLORS.GREEN} 
            strokeWidth={4} 
            dot={false}
            activeDot={{ r: 6 }}
            name="SolarSmart ile Kâr"
            unit=" TL"
          />
          <Line 
            type="monotone" 
            dataKey="cashFlowWithoutSolar" 
            stroke={COLORS.RED} 
            strokeWidth={3} 
            strokeDasharray="5 5"
            dot={false}
            name="Güneşsiz Fatura Yükü"
            unit=" TL"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

// 3. ROI Analizi
export const ROIChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <ChartWrapper title="Yatırım Geri Dönüş Analizi" subtitle="Tasarrufun Maliyeti Karşılama Süresi">
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={result.yearlyAnalysis} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.GREEN} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={COLORS.GREEN} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            tick={{fontSize: 12, fill: '#64748b'}} 
            tickLine={false} 
            axisLine={false} 
            tickMargin={10} 
            interval="preserveStartEnd"
          />
          <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} verticalAlign="top" height={36}/>
          
          <Area 
            type="monotone" 
            dataKey="cumulativeSavings" 
            stroke={COLORS.GREEN} 
            strokeWidth={3}
            fill="url(#colorSavings)" 
            name="Kümülatif Tasarruf" 
            unit=" TL"
          />
          <Line 
            type="monotone" 
            dataKey="cumulativeCost" 
            stroke={COLORS.RED} 
            strokeWidth={3}
            strokeDasharray="3 3"
            dot={false} 
            name="Maliyet Hattı" 
            unit=" TL"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};