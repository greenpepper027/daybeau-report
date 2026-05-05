'use client';
import { useMemo, useState } from 'react';
import { COUNTRIES } from '@/lib/constants';
import { aggregateByCountry, aggregateTotal, formatNumber, formatCurrency } from '@/lib/utils';

function delta(curr, prev) {
  if (!prev || prev === 0) return null;
  return (curr - prev) / prev;
}

function DeltaBadge({ curr, prev }) {
  const d = delta(curr, prev);
  if (d === null) return <span className="text-gray-300 text-xs">-</span>;
  if (d === 0) return <span className="text-gray-400 text-xs">-</span>;
  const up = d > 0;
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-500' : 'text-red-400'}`}>
      {up ? '▲' : '▼'}{Math.abs(d * 100).toFixed(1)}%
    </span>
  );
}

export default function MoMComparison({ currData, prevData, year, month }) {
  const todayDay = new Date().getDate();

  const maxAvailableDay = useMemo(() => {
    if (!currData.length) return todayDay;
    const days = currData.map(r => parseInt(r.date.split('-')[2]));
    return Math.max(...days);
  }, [currData]);

  const [endDay, setEndDay] = useState(() => Math.min(todayDay, 31));
  const effectiveEndDay = Math.min(endDay, maxAvailableDay);

  const currFiltered = useMemo(() =>
    currData.filter(r => parseInt(r.date.split('-')[2]) <= effectiveEndDay),
    [currData, effectiveEndDay]
  );

  const prevSamePeriod = useMemo(() =>
    prevData.filter(r => {
      const day = parseInt(r.date.split('-')[2]);
      return day >= 1 && day <= effectiveEndDay;
    }),
    [prevData, effectiveEndDay]
  );

  const currTotal = useMemo(() => aggregateTotal(currFiltered), [currFiltered]);
  const prevTotal = useMemo(() => aggregateTotal(prevSamePeriod), [prevSamePeriod]);

  const currByCountry = useMemo(() => aggregateByCountry(currFiltered), [currFiltered]);
  const prevByCountry = useMemo(() => aggregateByCountry(prevSamePeriod), [prevSamePeriod]);
  const prevMap = useMemo(() => Object.fromEntries(prevByCountry.map(r => [r.country, r])), [prevByCountry]);

  const sorted = useMemo(() =>
    [...currByCountry].sort((a, b) => b.revenue - a.revenue),
    [currByCountry]
  );

  const prevMonth = month === 1 ? 12 : month - 1;
  const currLabel = `${month}월 1일~${effectiveEndDay}일`;
  const prevLabel = `${prevMonth}월 1일~${effectiveEndDay}일`;

  if (!currData.length) return null;

  const summaryItems = [
    { label: '문의', curr: currTotal.inquiries, prev: prevTotal.inquiries, fmt: formatNumber, unit: '건' },
    { label: '예약', curr: currTotal.bookings, prev: prevTotal.bookings, fmt: formatNumber, unit: '건' },
    { label: '수납', curr: currTotal.payments, prev: prevTotal.payments, fmt: formatNumber, unit: '건' },
    { label: '매출', curr: currTotal.revenue, prev: prevTotal.revenue, fmt: formatCurrency, unit: '원' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">전월 동기간 비교</h3>
          <p className="text-xs text-gray-400 mt-0.5">{currLabel} vs {prevLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">1일~</span>
          <button
            onClick={() => setEndDay(d => Math.max(1, d - 1))}
            className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50"
          >◀</button>
          <span className="text-sm font-semibold text-gray-800 min-w-[32px] text-center">{effectiveEndDay}일</span>
          <button
            onClick={() => setEndDay(d => Math.min(31, d + 1))}
            className="px-2 py-1 rounded border border-gray-300 text-xs hover:bg-gray-50"
          >▶</button>
        </div>
      </div>

      {/* 요약 KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-gray-100">
        {summaryItems.map((item, i) => (
          <div key={i} className={`p-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{item.fmt(item.curr)}<span className="text-xs font-normal text-gray-400 ml-0.5">{item.unit}</span></p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-400">전월 {item.fmt(item.prev)}</span>
              <DeltaBadge curr={item.curr} prev={item.prev} />
            </div>
          </div>
        ))}
      </div>

      {/* 국가별 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-4 py-2.5 font-medium">국가</th>
              <th className="text-right px-3 py-2.5 font-medium" colSpan={3}>문의</th>
              <th className="text-right px-3 py-2.5 font-medium" colSpan={3}>예약</th>
              <th className="text-right px-3 py-2.5 font-medium" colSpan={3}>수납</th>
              <th className="text-right px-3 py-2.5 font-medium" colSpan={3}>매출</th>
            </tr>
            <tr className="bg-gray-50 text-[11px] text-gray-400 border-b border-gray-100">
              <th className="px-4 pb-2"></th>
              {['문의','예약','수납','매출'].map(m => (
                <>
                  <th key={`${m}-c`} className="text-right px-2 pb-2 font-normal text-gray-600">{month}월~</th>
                  <th key={`${m}-p`} className="text-right px-2 pb-2 font-normal">전월</th>
                  <th key={`${m}-d`} className="text-right px-3 pb-2 font-normal">증감</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(row => {
              const prev = prevMap[row.country] || { inquiries: 0, bookings: 0, payments: 0, revenue: 0 };
              const country = COUNTRIES.find(c => c.id === row.country);
              return (
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{country?.label || row.country}</td>
                  <td className="px-2 py-2.5 text-right text-gray-800 font-medium">{formatNumber(row.inquiries)}</td>
                  <td className="px-2 py-2.5 text-right text-gray-400">{formatNumber(prev.inquiries)}</td>
                  <td className="px-3 py-2.5 text-right"><DeltaBadge curr={row.inquiries} prev={prev.inquiries} /></td>
                  <td className="px-2 py-2.5 text-right text-gray-800 font-medium">{formatNumber(row.bookings)}</td>
                  <td className="px-2 py-2.5 text-right text-gray-400">{formatNumber(prev.bookings)}</td>
                  <td className="px-3 py-2.5 text-right"><DeltaBadge curr={row.bookings} prev={prev.bookings} /></td>
                  <td className="px-2 py-2.5 text-right text-gray-800 font-medium">{formatNumber(row.payments)}</td>
                  <td className="px-2 py-2.5 text-right text-gray-400">{formatNumber(prev.payments)}</td>
                  <td className="px-3 py-2.5 text-right"><DeltaBadge curr={row.payments} prev={prev.payments} /></td>
                  <td className="px-2 py-2.5 text-right text-blue-600 font-medium">{formatCurrency(row.revenue)}</td>
                  <td className="px-2 py-2.5 text-right text-gray-400">{formatCurrency(prev.revenue)}</td>
                  <td className="px-3 py-2.5 text-right"><DeltaBadge curr={row.revenue} prev={prev.revenue} /></td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
              <td className="px-4 py-2.5">합계</td>
              <td className="px-2 py-2.5 text-right">{formatNumber(currTotal.inquiries)}</td>
              <td className="px-2 py-2.5 text-right text-gray-400 font-normal">{formatNumber(prevTotal.inquiries)}</td>
              <td className="px-3 py-2.5 text-right"><DeltaBadge curr={currTotal.inquiries} prev={prevTotal.inquiries} /></td>
              <td className="px-2 py-2.5 text-right">{formatNumber(currTotal.bookings)}</td>
              <td className="px-2 py-2.5 text-right text-gray-400 font-normal">{formatNumber(prevTotal.bookings)}</td>
              <td className="px-3 py-2.5 text-right"><DeltaBadge curr={currTotal.bookings} prev={prevTotal.bookings} /></td>
              <td className="px-2 py-2.5 text-right">{formatNumber(currTotal.payments)}</td>
              <td className="px-2 py-2.5 text-right text-gray-400 font-normal">{formatNumber(prevTotal.payments)}</td>
              <td className="px-3 py-2.5 text-right"><DeltaBadge curr={currTotal.payments} prev={prevTotal.payments} /></td>
              <td className="px-2 py-2.5 text-right text-blue-600">{formatCurrency(currTotal.revenue)}</td>
              <td className="px-2 py-2.5 text-right text-gray-400 font-normal">{formatCurrency(prevTotal.revenue)}</td>
              <td className="px-3 py-2.5 text-right"><DeltaBadge curr={currTotal.revenue} prev={prevTotal.revenue} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
