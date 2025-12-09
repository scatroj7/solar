import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CalculationResult } from '../types';

interface ProductionChartProps {
  result: CalculationResult;
}

export const ProductionChart: React.FC<ProductionChartProps> = ({ result }) => {
  const data = [
    {
      name: 'Yıllık Tüketim',
      value: result.annualConsumption,
      color: '#0A2342' // Navy
    },
    {
      name: 'Yıllık Üretim',
      value: result.annualProduction,
      color: '#FF9F1C' // Energy Orange
    }
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};