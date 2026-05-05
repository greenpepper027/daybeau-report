'use client';
import React from 'react';
import { COUNTRIES } from '@/lib/constants';
import { aggregateByCountry, calcDelta, formatCurrency, formatNumber } from '@/lib/utils';

const METRICS = [
  { id: 'revenue', label: '매출' },
  { id: 'inquiries', label: '문의' },
  { id: 'bookings', label: '예약' },
  { id: 'payments', label: '수납' },
];

function GrowthBar({ delta }) {
  if (!isFinite(delta) || isNaN(delta)) {
    return <span className="text-xs text-green-500 font-medium">신규</span>;
  }
  const pct = delta * 100;
  const absW = Math.min(Math.abs(pct), 100);
  const up = pct >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex items-center">
        <div
          className={`h-2 rounded-full ${up ? 'bg-green-400' : 'bg-red-400'}`}
          style={{ width: `${absW}%` }}
        />
      </div>
      <span className={`text-xs font-semibold min-w-[48px] ${up ? 'text-green-600' : 'text-red-500'}`}>
        {up ? '+' : ''}{pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function GrowthRanking({ currData, prevData, prevMonthLabel }) {
  const [metric, setMetric] = React.useState('revenue');

  const todayDay = new Date().getDate();
  const maxDay = React.useMemo(() => {
    if (!currData.length) return todayDay;
    const dataMax = Math.max(...currData.map(r => parseInt(r.date.split('-')[2])));
    return Math.min(dataMax, todayDay);
  }, [currData, todayDay]);

  const prevSamePeriod = React.useMemo(() =>
    prevData.filter(r => parseInt(r.date.split('-')[2]) <= maxDay),
    [prevData, maxDay]
  );

  const validIds = React.useMemo(() => new Set(COUNTRIES.map(c => c.id)), []);
  const currFiltered = React.useMemo(() => currData.filter(r => validIds.has(r.country)), [currData, validIds]);
  const prevFiltered = React.useMemo(() => prevSamePeriod.filter(r => validIds.has(r.country)), [prevSamePeriod, validIds]);

  const currByCountry = React.useMemo(() => aggregateByCountry(currFiltered), [currFiltered]);
  const prevByCountry = React.useMemo(() => aggregateByCountry(prevFiltered), [prevFiltered]);
  const prevMap = Object.fromEntries(prevByCountry.map(r => [r.country, r]));

  const ranked = currByCountry
    .map(row => {
      const prev = prevMap[row.country];
      const currVal = row[metric] || 0;
      const prevVal = prev?.[metric] || 0;
      const delta = calcDelta(currVal, prevVal);
      return { ...row, currVal, prevVal, delta };
    })
    .filter(row => !(row.currVal === 0 && row.prevVal === 0))
    .sort((a, b) => {
      if (!isFinite(a.delta) && !isFinite(b.delta)) return b.currVal - a.currVal;
      if (!isFinite(a.delta)) return -1;
      if (!isFinite(b.delta)) return 1;
      return b.delta - a.delta;
    });

  const fmt = (v) => metric === 'revenue' ? formatCurrency(v) + '원' : formatNumber(v) + '건';

  if (ranked.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">국가별 성장률 랭킹</h3>
          <p className="text-xs text-gray-400 mt-0.5">전월({prevMonthLabel}) 1~{maxDay}일 대비</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                metric === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {ranked.map((row, idx) => {
          const country = COUNTRIES.find(c => c.id === row.country);
          const isTop = idx === 0;
          return (
            <div key={row.country} className={`flex items-center gap-3 p-2.5 rounded-lg ${isTop ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <span className={`text-sm font-bold w-5 text-center ${idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-gray-500' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                {idx + 1}
              </span>
              <span className={`text-sm font-medium w-16 ${isTop ? 'text-blue-700' : 'text-gray-700'}`}>
                {country?.label || row.country}
              </span>
              <GrowthBar delta={row.delta} />
              <div className="ml-auto text-right">
                <p className="text-xs font-semibold text-gray-800">{fmt(row.currVal)}</p>
                <p className="text-xs text-gray-400">전월 {fmt(row.prevVal)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
