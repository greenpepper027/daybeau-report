'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import KpiCards from '@/components/KpiCards';
import WeeklyKpiCards from '@/components/WeeklyKpiCards';
import WeeklyCountryTable from '@/components/WeeklyCountryTable';
import WeeklyCompareChart from '@/components/WeeklyCompareChart';
import CountryTable from '@/components/CountryTable';
import TrendChart, { RevenueBarChart } from '@/components/TrendChart';
import DayOfWeekHeatmap from '@/components/DayOfWeekHeatmap';
import GrowthRanking from '@/components/GrowthRanking';
import MoMComparison from '@/components/MoMComparison';
import { COUNTRIES } from '@/lib/constants';
import {
  aggregateByCountry, aggregateTotal,
  getCurrentYearMonth, getMonthRange,
  getCurrentWeekRange, getPrevWeekRange, getNextWeekRange,
  formatWeekLabel, toDateStr, downloadCSV,
} from '@/lib/utils';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const now = getCurrentYearMonth();

  const [activeTab, setActiveTab] = useState('monthly');

  // 월별
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [monthData, setMonthData] = useState([]);
  const [prevMonthData, setPrevMonthData] = useState([]);
  const [monthLoading, setMonthLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState(COUNTRIES.map(c => c.id));

  // 주별
  const [currWeek, setCurrWeek] = useState(getCurrentWeekRange());
  const [weekData, setWeekData] = useState({ curr: [], prev: [] });
  const [weekLoading, setWeekLoading] = useState(true);
  const [weeklyCountries, setWeeklyCountries] = useState(COUNTRIES.map(c => c.id));

  // 일별
  const [dailyStart, setDailyStart] = useState(toDateStr(new Date()));
  const [dailyEnd, setDailyEnd] = useState(toDateStr(new Date()));
  const [dailyData, setDailyData] = useState({ curr: [], prev: [] });
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyCountries, setDailyCountries] = useState(COUNTRIES.map(c => c.id));

  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // 월별 데이터 로드
  useEffect(() => {
    if (status !== 'authenticated') return;
    const { start, end } = getMonthRange(year, month);
    const prevM = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    const { start: pStart, end: pEnd } = getMonthRange(prevM.year, prevM.month);
    setMonthLoading(true);
    Promise.all([
      fetch(`/api/sheets?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/sheets?start=${pStart}&end=${pEnd}`).then(r => r.json()),
    ]).then(([curr, prev]) => {
      setMonthData(curr.data || []);
      setPrevMonthData(prev.data || []);
      setMonthLoading(false);
    }).catch(() => setMonthLoading(false));
  }, [year, month, status]);

  // 주별 데이터 로드
  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'weekly') return;
    const prevWeek = getPrevWeekRange(currWeek.start);
    setWeekLoading(true);
    fetch(`/api/sheets?start=${prevWeek.start}&end=${currWeek.end}`)
      .then(r => r.json())
      .then(res => {
        const all = res.data || [];
        setWeekData({
          curr: all.filter(r => r.date >= currWeek.start && r.date <= currWeek.end),
          prev: all.filter(r => r.date >= prevWeek.start && r.date <= prevWeek.end),
        });
        setWeekLoading(false);
      }).catch(() => setWeekLoading(false));
  }, [currWeek, activeTab, status]);

  // 일별 데이터 로드
  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'daily') return;
    setDailyLoading(true);
    const startD = new Date(dailyStart);
    const endD = new Date(dailyEnd);
    const duration = Math.round((endD - startD) / 86400000) + 1;
    const prevEnd = new Date(startD); prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - duration + 1);
    const ps = toDateStr(prevStart), pe = toDateStr(prevEnd);
    fetch(`/api/sheets?start=${ps}&end=${dailyEnd}`)
      .then(r => r.json())
      .then(res => {
        const all = res.data || [];
        setDailyData({
          curr: all.filter(r => r.date >= dailyStart && r.date <= dailyEnd),
          prev: all.filter(r => r.date >= ps && r.date <= pe),
        });
        setDailyLoading(false);
      }).catch(() => setDailyLoading(false));
  }, [dailyStart, dailyEnd, activeTab, status]);

  // 월별 계산
  const filteredMonthData = useMemo(
    () => monthData.filter(r => selectedCountries.includes(r.country)),
    [monthData, selectedCountries]
  );
  const orderedSelected = useMemo(
    () => COUNTRIES.map(c => c.id).filter(id => selectedCountries.includes(id)),
    [selectedCountries]
  );
  const byCountry = useMemo(() => aggregateByCountry(filteredMonthData), [filteredMonthData]);
  const total = useMemo(() => aggregateTotal(filteredMonthData), [filteredMonthData]);
  const trendData = useMemo(() => {
    const dateMap = {};
    filteredMonthData.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = {};
      if (!dateMap[r.date][r.country]) dateMap[r.date][r.country] = { inquiries: 0, revenue: 0 };
      dateMap[r.date][r.country].inquiries += r.inquiries;
      dateMap[r.date][r.country].revenue += r.revenue;
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, countries]) => ({ date, ...countries }));
  }, [filteredMonthData]);

  // 주별 계산
  const filteredWeekCurr = useMemo(() => weekData.curr.filter(r => weeklyCountries.includes(r.country)), [weekData.curr, weeklyCountries]);
  const filteredWeekPrev = useMemo(() => weekData.prev.filter(r => weeklyCountries.includes(r.country)), [weekData.prev, weeklyCountries]);
  const currByCountry = useMemo(() => aggregateByCountry(filteredWeekCurr), [filteredWeekCurr]);
  const prevByCountry = useMemo(() => aggregateByCountry(filteredWeekPrev), [filteredWeekPrev]);
  const currTotal = useMemo(() => aggregateTotal(filteredWeekCurr), [filteredWeekCurr]);
  const prevTotal = useMemo(() => aggregateTotal(filteredWeekPrev), [filteredWeekPrev]);

  // 일별 계산
  const filteredDailyCurr = useMemo(() => dailyData.curr.filter(r => dailyCountries.includes(r.country)), [dailyData.curr, dailyCountries]);
  const filteredDailyPrev = useMemo(() => dailyData.prev.filter(r => dailyCountries.includes(r.country)), [dailyData.prev, dailyCountries]);
  const dailyCurrTotal = useMemo(() => aggregateTotal(filteredDailyCurr), [filteredDailyCurr]);
  const dailyPrevTotal = useMemo(() => aggregateTotal(filteredDailyPrev), [filteredDailyPrev]);
  const dailyCurrByCountry = useMemo(() => aggregateByCountry(filteredDailyCurr), [filteredDailyCurr]);
  const dailyPrevByCountry = useMemo(() => aggregateByCountry(filteredDailyPrev), [filteredDailyPrev]);

  const prevWeek = useMemo(() => getPrevWeekRange(currWeek.start), [currWeek]);
  const today = toDateStr(new Date());
  const prevMonthLabel = month === 1 ? `${year - 1}년 12월` : `${year}년 ${month - 1}월`;
  const years = Array.from({ length: 3 }, (_, i) => now.year - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  function toggleCountry(id) {
    setSelectedCountries(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }
  function toggleWeeklyCountry(id) {
    setWeeklyCountries(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }
  function toggleDailyCountry(id) {
    setDailyCountries(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function handleBackup() {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/sheets');
      const { data } = await res.json();
      downloadCSV(data || [], `daybeau-backup-${toDateStr(new Date())}.csv`);
    } catch (e) {
      alert('백업 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
    }
  }

  if (status === 'loading') return <div className="text-center py-20 text-gray-400">로딩 중...</div>;
  if (!session) return null;

  const role = session?.user?.role;

  return (
    <div className="space-y-5">
      {/* 헤더 + 탭 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
            <p className="text-sm text-gray-500 mt-0.5">글로벌 마케팅 현황</p>
          </div>
          {role === 'admin' && (
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {backupLoading ? <span className="animate-spin">⏳</span> : <span>⬇️</span>}
              CSV 백업
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[{ id: 'monthly', label: '월별' }, { id: 'weekly', label: '주별' }, { id: 'daily', label: '일별' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {months.map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
            </div>
          )}
          {activeTab === 'weekly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrWeek(getPrevWeekRange(currWeek.start))}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">◀</button>
              <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center">
                {formatWeekLabel(currWeek.start, currWeek.end)}
              </span>
              <button onClick={() => setCurrWeek(getNextWeekRange(currWeek.start))}
                disabled={currWeek.end >= today}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40">▶</button>
            </div>
          )}
          {activeTab === 'daily' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={dailyStart} max={dailyEnd}
                onChange={e => setDailyStart(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-sm text-gray-400">~</span>
              <input type="date" value={dailyEnd} min={dailyStart} max={today}
                onChange={e => setDailyEnd(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* 월별 뷰 */}
      {activeTab === 'monthly' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCountries(
                selectedCountries.length === COUNTRIES.length ? [] : COUNTRIES.map(c => c.id)
              )}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedCountries.length === COUNTRIES.length
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
              }`}
            >전체</button>
            {COUNTRIES.map(c => (
              <button key={c.id} onClick={() => toggleCountry(c.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedCountries.includes(c.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          {monthLoading ? (
            <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
          ) : (
            <>
              <KpiCards total={total} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendChart data={trendData} countries={orderedSelected} metric="inquiries" title="일별 문의 추이" />
                <TrendChart data={trendData} countries={orderedSelected} metric="revenue" title="일별 매출 추이" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevenueBarChart data={byCountry} title="국가별 매출" />
                <CountryTable data={byCountry} />
              </div>
              <MoMComparison
                currData={filteredMonthData}
                prevData={prevMonthData.filter(r => selectedCountries.includes(r.country))}
                year={year}
                month={month}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DayOfWeekHeatmap data={filteredMonthData} selectedCountries={selectedCountries} />
                <GrowthRanking
                  currData={filteredMonthData}
                  prevData={prevMonthData.filter(r => selectedCountries.includes(r.country))}
                  prevMonthLabel={prevMonthLabel}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* 주별 뷰 */}
      {activeTab === 'weekly' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setWeeklyCountries(
                weeklyCountries.length === COUNTRIES.length ? [] : COUNTRIES.map(c => c.id)
              )}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                weeklyCountries.length === COUNTRIES.length
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
              }`}
            >전체</button>
            {COUNTRIES.map(c => (
              <button key={c.id} onClick={() => toggleWeeklyCountry(c.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  weeklyCountries.includes(c.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          {weekLoading ? (
            <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>이번주 {formatWeekLabel(currWeek.start, currWeek.end)}
                <span className="inline-block w-3 h-3 rounded-full bg-slate-300 ml-2"></span>전주 {formatWeekLabel(prevWeek.start, prevWeek.end)}
              </div>
              <WeeklyKpiCards curr={currTotal} prev={prevTotal} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WeeklyCompareChart
                  currByCountry={currByCountry} prevByCountry={prevByCountry}
                  currWeek={currWeek} prevWeek={prevWeek}
                  metric="revenue" title="국가별 매출 비교"
                />
                <WeeklyCompareChart
                  currByCountry={currByCountry} prevByCountry={prevByCountry}
                  currWeek={currWeek} prevWeek={prevWeek}
                  metric="inquiries" title="국가별 문의 비교"
                />
              </div>
              <WeeklyCountryTable currByCountry={currByCountry} prevByCountry={prevByCountry} />
            </>
          )}
        </>
      )}

      {/* 일별 뷰 */}
      {activeTab === 'daily' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setDailyCountries(
                dailyCountries.length === COUNTRIES.length ? [] : COUNTRIES.map(c => c.id)
              )}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                dailyCountries.length === COUNTRIES.length
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
              }`}
            >전체</button>
            {COUNTRIES.map(c => (
              <button key={c.id} onClick={() => toggleDailyCountry(c.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  dailyCountries.includes(c.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          {dailyLoading ? (
            <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
          ) : (
            <>
              <p className="text-xs text-gray-400">직전 동기간 대비 증감 표시</p>
              <WeeklyKpiCards curr={dailyCurrTotal} prev={dailyPrevTotal} />
              <WeeklyCountryTable
                currByCountry={dailyCurrByCountry}
                prevByCountry={dailyPrevByCountry}
                title="국가별 현황"
                subtitle="직전 동기간 대비 증감"
                emptyMessage="선택 기간 데이터가 없습니다"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
