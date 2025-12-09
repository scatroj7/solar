import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { ScenarioResult } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow border border-slate-100 text-xs">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('tr-TR')} {entry.unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Aylık Üretim vs Tüketim
export const ProductionChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-full">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Aylık Enerji Dengesi (kWh)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={result.monthlyProduction}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
          <Area type="monotone" dataKey="production" stroke="#f59e0b" fill="#fef3c7" name="Güneş Üretimi" />
          <Area type="monotone" dataKey="consumption" stroke="#0ea5e9" fill="#e0f2fe" name="Ev Tüketimi" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Finansal Karşılaştırma (Güneşli vs Güneşsiz Hayat)
export const FinancialComparisonChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-full">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">25 Yıllık Nakit Akışı</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={result.yearlyAnalysis}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          
          <Line 
            type="monotone" 
            dataKey="netProfit" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={false}
            name="SolarSmart ile Kâr"
            unit=" TL"
          />
          <Line 
            type="monotone" 
            dataKey="cashFlowWithoutSolar" 
            stroke="#ef4444" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false}
            name="Güneşsiz Fatura Yükü"
            unit=" TL"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-slate-400 text-center">
        * Kırmızı çizgi, sistem kurmazsanız 25 yılda ödeyeceğiniz kümülatif fatura tutarını gösterir.
      </div>
    </div>
  );
};

// 3. ROI Analizi
export const ROIChart = ({ result }: { result: ScenarioResult }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-full">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Yatırım Geri Dönüş Analizi</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={result.yearlyAnalysis}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="cumulativeSavings" 
            stroke="#10b981" 
            fill="#d1fae5" 
            name="Kümülatif Tasarruf" 
            unit=" TL"
          />
          <Line 
            type="monotone" 
            dataKey="cumulativeCost" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={false} 
            name="Maliyet Hattı" 
            unit=" TL"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};