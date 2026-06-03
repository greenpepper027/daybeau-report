'use client';
import { COUNTRIES } from '@/lib/constants';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function getColor(value, max) {
  if (max === 0 || value === 0) return 'bg-gray-100 text-gray-300';
  const ratio = value / max;
  if (ratio >= 0.8) return 'bg-blue-600 text-white';
  if (ratio >= 0.6) return 'bg-blue-400 text-white';
  if (ratio >= 0.4) return 'bg-blue-300 text-white';
  if (ratio >= 0.2) return 'bg-blue-200 text-blue-800';
  return 'bg-blue-100 text-blue-600';
}

export default function DayOfWeekHeatmap({ data, selectedCountries }) {
  if (!data || data.length === 0) return null;

  const filtered = selectedCountries
    ? data.filter(r => selectedCountries.includes(r.country))
    : data;

  const matrix = {};
  const dayTotals = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);  // 요일별 날짜 등장 횟수
  const seenDates = new Set();

  filtered.forEach(r => {
    const day = getDayOfWeek(r.date);
    if (!matrix[r.country]) matrix[r.country] = Array(7).fill(0);
    matrix[r.country][day] += r.payments;
    dayTotals[day] += r.payments;
    if (!seenDates.has(r.date)) {
      seenDates.add(r.date);
      dayCounts[day]++;
    }
  });

  const dayAvgs = dayTotals.map((total, i) => dayCounts[i] > 0 ? total / dayCounts[i] : 0);

  const activeCountries = COUNTRIES.filter(c => matrix[c.id]);
  const allValues = Object.values(matrix).flatMap(row => row);
  const maxVal = Math.max(...allValues, 1);
  const maxDayIdx = dayTotals.indexOf(Math.max(...dayTotals));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">요일별 내원 히트맵</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            내원이 가장 많은 요일: <span className="font-medium text-blue-600">{DAYS[maxDayIdx]}요일</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="w-3 h-3 rounded bg-blue-100 inline-block"></span>
          <span className="w-3 h-3 rounded bg-blue-300 inline-block"></span>
          <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
          <span className="ml-1">낮음 → 높음</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left pb-2 pr-3 font-medium text-gray-500 w-20">국가</th>
              {DAYS.map((d, i) => (
                <th key={d} className={`pb-2 text-center font-medium w-12 ${i === maxDayIdx ? 'text-blue-600' : 'text-gray-500'}`}>
                  {d}
                </th>
              ))}
              <th className="pb-2 text-right font-medium text-gray-500 pl-3">합계</th>
            </tr>
          </thead>
          <tbody>
            {activeCountries.map(c => {
              const row = matrix[c.id] || Array(7).fill(0);
              const rowTotal = row.reduce((a, b) => a + b, 0);
              const rowDailyAvg = seenDates.size > 0 ? rowTotal / seenDates.size : 0;
              return (
                <tr key={c.id}>
                  <td className="py-1 pr-3 font-medium text-gray-700">{c.label}</td>
                  {row.map((val, i) => {
                    const avg = dayCounts[i] > 0 ? val / dayCounts[i] : 0;
                    return (
                      <td key={i} className="py-1 px-0.5">
                        <div className={`rounded text-center py-1 font-medium ${getColor(val, maxVal)}`}>
                          <div>{val > 0 ? val : ''}</div>
                          {avg > 0 && <div className="text-[9px] opacity-75 leading-tight">{avg.toFixed(1)}</div>}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-1 text-right pl-3">
                    <div className="font-semibold text-gray-700">{rowTotal}</div>
                    <div className="text-gray-400 text-[10px]">{rowDailyAvg.toFixed(1)}/일</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-100">
              <td className="pt-2 pr-3 text-xs font-semibold text-gray-500">합계</td>
              {dayTotals.map((v, i) => (
                <td key={i} className={`pt-2 text-center font-semibold ${i === maxDayIdx ? 'text-blue-600' : 'text-gray-600'}`}>
                  {v}
                </td>
              ))}
              <td className="pt-2 text-right font-bold text-gray-800 pl-3">
                {dayTotals.reduce((a, b) => a + b, 0)}
              </td>
            </tr>
            <tr>
              <td className="pt-1 pr-3 text-xs font-semibold text-gray-400">일평균</td>
              {dayAvgs.map((v, i) => (
                <td key={i} className={`pt-1 text-center text-xs ${i === maxDayIdx ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
                  {v > 0 ? v.toFixed(1) : '-'}
                </td>
              ))}
              <td className="pt-1 text-right text-xs text-gray-400 pl-3">
                {dayCounts.some(c => c > 0)
                  ? (dayTotals.reduce((a, b) => a + b, 0) / [...seenDates].length).toFixed(1)
                  : '-'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
