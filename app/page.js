'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import KpiCards from '@/components/KpiCards';
import WeeklyKpiCards from '@/components/WeeklyKpiCards';
import WeeklyCountryTable from '@/components/WeeklyCountryTable';
import CountryTable from '@/components/CountryTable';
import TrendChart, { RevenueBarChart } from '@/components/TrendChart';
import SamePeriodComparison from '@/components/SamePeriodComparison';
import { COUNTRIES } from '@/lib/constants';
import {
  aggregateByCountry, aggregateTotal,
  getCurrentYearMonth, getMonthRange,
  getCurrentWeekRange, getPrevWeekRange, getNextWeekRange,
  formatWeekLabel, toDateStr, getSamePeriodRanges,
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

  // 일별
  const [dailyDate, setDailyDate] = useState(toDateStr(new Date()));
  const [dailyData, setDailyData] = useState({ curr: [], prev: [] });
  const [dailyLoading, setDailyLoading] = useState(true);

  // 전월 동기간
  const samePeriod = useMemo(() => getSamePeriodRanges(), []);
  const [sameCurrData, setSameCurrData] = useState([]);
  const [samePrevData, setSamePrevData] = useState([]);
  const [sameLoading, setSameLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // 전월 동기간 데이터 로드 (최초 1회)
  useEffect(() => {
    if (status !== 'authenticated') return;
    setSameLoading(true);
    Promise.all([
      fetch(`/api/sheets?start=${samePeriod.curr.start}&end=${samePeriod.curr.end}`).then(r => r.json()),
      fetch(`/api/sheets?start=${samePeriod.prev.start}&end=${samePeriod.prev.end}`).then(r => r.json()),
    ]).then(([curr, prev]) => {
      setSameCurrData(curr.data || []);
      setSamePrevData(prev.data || []);
      setSameLoading(false);
    }).catch(() => setSameLoading(false));
  }, [status]);

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

  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'daily') return;
    setDailyLoading(true);
    const prev = new Date(dailyDate);
    prev.setDate(prev.getDate() - 1);
    const prevDate = toDateStr(prev);
    fetch(`/api/sheets?start=${prevDate}&end=${dailyDate}`)
      .then(r => r.json())
      .then(res => {
        const all = res.data || [];
        setDailyData({
          curr: all.filter(r => r.date === dailyDate),
          prev: all.filter(r => r.date === prevDate),
        });
        setDailyLoading(false);
      }).catch(() => setDailyLoading(false));
  }, [dailyDate, activeTab, status]);

  const filteredMonthData = useMemo(
    () => monthData.filter(r => selectedCountries.includes(r.country)),
    [monthData, selectedCountries]
  );
  const orderedSelected = useMemo(
    () => COUNTRIES.map(c => c.id).filter(id => selectedCountries.includes(id)),
    [selectedCountries]
  );
  const byCountry  = useMemo(() => aggregateByCountry(filteredMonthData), [filteredMonthData]);
  const total      = useMemo(() => aggregateTotal(filteredMonthData), [filteredMonthData]);
  const trendData  = useMemo(() => {
    const dateMap = {};
    filteredMonthData.forEach(r => {
      if (!dateMap[r.date]) dateMap[r.date] = {};
      if (!dateMap[r.date][r.country]) dateMap[r.date][r.country] = { inquiries: 0, revenue: 0 };
      dateMap[r.date][r.country].inquiries += r.inquiries;
      dateMap[r.date][r.country].revenue   += r.revenue;
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, countries]) => ({ date, ...countries }));
  }, [filteredMonthData]);

  const currByCountry = useMemo(() => aggregateByCountry(weekData.curr), [weekData.curr]);
  const prevByCountry = useMemo(() => aggregateByCountry(weekData.prev), [weekData.prev]);
  const currTotal     = useMemo(() => aggregateTotal(weekData.curr), [weekData.curr]);
  const prevTotal     = useMemo(() => aggregateTotal(weekData.prev), [weekData.prev]);
  const prevWeek      = useMemo(() => getPrevWeekRange(currWeek.start), [currWeek]);
  const today         = toDateStr(new Date());
  const years         = Array.from({ length: 3 }, (_, i) => now.year - 1 + i);
  const months        = Array.from({ length: 12 }, (_, i) => i + 1);

  function toggleCountry(id) {
    setSelectedCountries(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  if (status === 'loading') return <div className="text-center py-20 text-gray-400">로딩 중...</div>;
  if (!session) return null;

  return (
    <div className="space-y-5">
      {/* 헤더 + 탭 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">글로벌 마케팅 현황</p>
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
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() - 1); setDailyDate(toDateStr(d)); }}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">◀</button>
              <input type="date" value={dailyDate} max={today}
                onChange={e => setDailyDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => { const d = new Date(dailyDate); d.setDate(d.getDate() + 1); setDailyDate(toDateStr(d)); }}
                disabled={dailyDate >= today}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40">▶</button>
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
              {!sameLoading && (
                <SamePeriodComparison
                  currData={sameCurrData}
                  prevData={samePrevData}
                  currLabel={samePeriod.curr.label}
                  prevLabel={samePeriod.prev.label}
                />
              )}
            </>
          )}
        </>
      )}

      {/* 주별 뷰 */}
      {activeTab === 'weekly' && (
        weekLoading ? (
          <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
        ) : (
          <>
            <p className="text-xs text-gray-400">전주 대비 증감 표시</p>
            <WeeklyKpiCards curr={currTotal} prev={prevTotal} />
            <WeeklyCountryTable currByCountry={currByCountry} prevByCountry={prevByCountry} />
          </>
        )
      )}

      {/* 일별 뷰 */}
      {activeTab === 'daily' && (
        dailyLoading ? (
          <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
        ) : (
          <>
            <p className="text-xs text-gray-400">전일 대비 증감 표시</p>
            <WeeklyKpiCards curr={aggregateTotal(dailyData.curr)} prev={aggregateTotal(dailyData.prev)} />
            <WeeklyCountryTable
              currByCountry={aggregateByCountry(dailyData.curr)}
              prevByCountry={aggregateByCountry(dailyData.prev)}
            />
          </>
        )
      )}
    </div>
  );
}
