'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { COUNTRIES } from '@/lib/constants';
import {
  aggregateByCountry, aggregateTotal,
  getCurrentYearMonth, getMonthRange,
  formatNumber, formatCurrency, formatPercent,
} from '@/lib/utils';

function MonthlyTable({ data, label }) {
  const byCountry = useMemo(() => aggregateByCountry(data), [data]);
  const total = useMemo(() => aggregateTotal(data), [data]);

  // COUNTRIES 순서대로 정렬
  const sorted = useMemo(() =>
    COUNTRIES.map(c => byCountry.find(r => r.country === c.id)).filter(Boolean),
    [byCountry]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">데이터가 없습니다</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">국가</th>
                <th className="text-right px-4 py-3 font-medium">문의</th>
                <th className="text-right px-4 py-3 font-medium">예약</th>
                <th className="text-right px-4 py-3 font-medium">예약율</th>
                <th className="text-right px-4 py-3 font-medium">수납</th>
                <th className="text-right px-4 py-3 font-medium">매출(원)</th>
                <th className="text-right px-4 py-3 font-medium">객단가(원)</th>
                <th className="text-right px-4 py-3 font-medium">취소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(row => {
                const country = COUNTRIES.find(c => c.id === row.country);
                return (
                  <tr key={row.country} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{country?.label || row.country}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.inquiries)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.bookings)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${row.bookingRate >= 0.5 ? 'text-green-600' : 'text-orange-500'}`}>
                      {formatPercent(row.bookingRate)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(row.payments)}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right font-medium text-purple-600">{formatCurrency(row.avgSpend)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatNumber(row.cancellations || 0)}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-semibold text-gray-900 border-t-2 border-gray-200">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">{formatNumber(total.inquiries)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(total.bookings)}</td>
                <td className={`px-4 py-3 text-right ${total.bookingRate >= 0.5 ? 'text-green-600' : 'text-orange-500'}`}>
                  {formatPercent(total.bookingRate)}
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(total.payments)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(total.revenue)}</td>
                <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(total.avgSpend)}</td>
                <td className="px-4 py-3 text-right text-gray-400">{formatNumber(total.cancellations || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function YearlyComparison({ yearData }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">월별 비교 (연간)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="text-left px-4 py-3 font-medium sticky left-0 bg-gray-50">월</th>
              <th className="text-right px-4 py-3 font-medium">문의</th>
              <th className="text-right px-4 py-3 font-medium">예약</th>
              <th className="text-right px-4 py-3 font-medium">예약율</th>
              <th className="text-right px-4 py-3 font-medium">수납</th>
              <th className="text-right px-4 py-3 font-medium">매출(원)</th>
              <th className="text-right px-4 py-3 font-medium">객단가(원)</th>
              <th className="text-right px-4 py-3 font-medium">취소</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {yearData.map(({ month, total }) => (
              <tr key={month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white">{month}월</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(total.inquiries)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(total.bookings)}</td>
                <td className={`px-4 py-3 text-right font-medium ${total.bookingRate >= 0.5 ? 'text-green-600' : 'text-orange-500'}`}>
                  {formatPercent(total.bookingRate)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(total.payments)}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(total.revenue)}</td>
                <td className="px-4 py-3 text-right font-medium text-purple-600">{formatCurrency(total.avgSpend)}</td>
                <td className="px-4 py-3 text-right text-gray-400">{formatNumber(total.cancellations || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const now = getCurrentYearMonth();
  const [activeTab, setActiveTab] = useState('monthly');
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [monthData, setMonthData] = useState([]);
  const [monthLoading, setMonthLoading] = useState(true);
  const [yearData, setYearData] = useState([]);
  const [yearLoading, setYearLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // 월별 데이터
  useEffect(() => {
    if (status !== 'authenticated') return;
    const { start, end } = getMonthRange(year, month);
    setMonthLoading(true);
    fetch(`/api/sheets?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(res => { setMonthData(res.data || []); setMonthLoading(false); })
      .catch(() => setMonthLoading(false));
  }, [year, month, status]);

  // 연간 데이터
  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'yearly') return;
    setYearLoading(true);
    const { start } = getMonthRange(year, 1);
    const { end } = getMonthRange(year, 12);
    fetch(`/api/sheets?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(res => {
        const all = res.data || [];
        const byMonth = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const { start: s, end: e } = getMonthRange(year, m);
          const data = all.filter(r => r.date >= s && r.date <= e);
          return { month: m, total: aggregateTotal(data) };
        });
        setYearData(byMonth);
        setYearLoading(false);
      })
      .catch(() => setYearLoading(false));
  }, [year, activeTab, status]);

  const years = [2025, 2026];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (status === 'loading') return <div className="text-center py-20 text-gray-400">로딩 중...</div>;
  if (!session) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">월 리포트</h1>
          <p className="text-sm text-gray-500 mt-0.5">국가별 월간 성과 요약</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          {activeTab === 'monthly' && (
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ id: 'monthly', label: '월별 상세' }, { id: 'yearly', label: '연간 비교' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'monthly' && (
        monthLoading
          ? <div className="text-center py-20 text-gray-400 text-sm">불러오는 중...</div>
          : <MonthlyTable data={monthData} label={`${year}년 ${month}월 리포트`} />
      )}

      {activeTab === 'yearly' && (
        yearLoading
          ? <div className="text-center py-20 text-gray-400 text-sm">불러오는 중...</div>
          : <YearlyComparison yearData={yearData} />
      )}
    </div>
  );
}
