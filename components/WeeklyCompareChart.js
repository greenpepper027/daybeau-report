'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { COUNTRIES } from '@/lib/constants';
import { formatCurrency, formatNumber, formatWeekLabel } from '@/lib/utils';

export default function WeeklyCompareChart({ currByCountry, prevByCountry, currWeek, prevWeek, metric, title }) {
  if (!currByCountry || currByCountry.length === 0) return null;

  const prevMap = Object.fromEntries((prevByCountry || []).map(r => [r.country, r]));

  const chartData = [...currByCountry]
    .sort((a, b) => b[metric] - a[metric])
    .map(row => {
      const country = COUNTRIES.find(c => c.id === row.country);
      return {
        name: country?.label || row.country,
        이번주: row[metric],
        전주: prevMap[row.country]?.[metric] || 0,
      };
    });

  const fmt = v => metric === 'revenue' || metric === 'avgSpend' ? formatCurrency(v) : formatNumber(v);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">
        이번주 {formatWeekLabel(currWeek.start, currWeek.end)} vs 전주 {formatWeekLabel(prevWeek.start, prevWeek.end)}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => fmt(v)} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="이번주" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="전주" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
