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
import TargetTracker from '@/components/TargetTracker';
import MonthlyMemo from '@/components/MonthlyMemo';

function YearlyComparison({ months }) {
  const totals = useMemo(
    () => months.map(m => ({ ...m, total: aggregateTotal(m.data) })),
    [months]
  );

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
            {totals.map(m => (
              <tr key={m.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white">{m.month}월</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(m.total.inquiries)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(m.total.bookings)}</td>
                <td className={`px-4 py-3 text-right font-medium ${m.total.bookingRate >= 0.5 ? 'text-green-600' : 'text-orange-500'}`}>
                  {formatPercent(m.total.bookingRate)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{formatNumber(m.total.payments)}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(m.total.revenue)}</td>
                <td className="px-4 py-3 text-right font-medium text-purple-600">{formatCurrency(m.total.avgSpend)}</td>
                <td className="px-4 py-3 text-right text-gray-400">{formatNumber(m.total.cancellations || 0)}</td>
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

  useEffect(() => {
    if (status !== 'authenticated') return;
    const { start, end } = getMonthRange(year, month);
    setMonthLoading(true);
    fetch(`/api/sheets?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(res => { setMonthData(res.data || []); setMonthLoading(false); })
      .catch(() => setMonthLoading(false));
  }, [year, month, status]);

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
          return { month: m, data: all.filter(r => r.date >= s && r.date <= e) };
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
          <h1 className="text-xl font-bold text-gray-900">KPI 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">월별 목표 설정 및 달성 현황</p>
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
          : <>
              <TargetTracker
                monthData={monthData}
                year={year}
                month={month}
                isAdmin={session?.user?.role === 'admin'}
              />
              <MonthlyMemo
                year={year}
                month={month}
                isAdmin={session?.user?.role === 'admin'}
              />
            </>
      )}

      {activeTab === 'yearly' && (
        yearLoading
          ? <div className="text-center py-20 text-gray-400 text-sm">불러오는 중...</div>
          : <YearlyComparison months={yearData} />
      )}
    </div>
  );
}
