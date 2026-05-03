import { COUNTRIES } from '@/lib/constants';
import { formatCurrency, formatNumber, formatPercent, formatDelta, calcDelta } from '@/lib/utils';

const LABEL_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c.label]));

function Delta({ curr, prev }) {
  const delta = calcDelta(curr, prev);
  if (!isFinite(delta)) return curr > 0 ? <span className="text-green-500 text-xs">NEW</span> : null;
  if (delta === 0) return <span className="text-gray-300 text-xs">-</span>;
  const color = delta > 0 ? 'text-green-500' : 'text-red-400';
  const arrow = delta > 0 ? '▲' : '▼';
  return <span className={`${color} text-xs`}>{arrow}{Math.abs(delta * 100).toFixed(1)}%</span>;
}

export default function SamePeriodComparison({ currData, prevData, currLabel, prevLabel }) {
  const aggregate = (data) => {
    const map = {};
    for (const r of data) {
      if (!map[r.country]) map[r.country] = { inquiries: 0, bookings: 0, payments: 0, revenue: 0, cancellations: 0 };
      map[r.country].inquiries     += r.inquiries || 0;
      map[r.country].bookings      += r.bookings || 0;
      map[r.country].payments      += r.payments || 0;
      map[r.country].revenue       += r.revenue || 0;
      map[r.country].cancellations += r.cancellations || 0;
    }
    return map;
  };

  const curr = aggregate(currData);
  const prev = aggregate(prevData);

  const sumAll = (map) => Object.values(map).reduce(
    (acc, r) => ({
      inquiries:     acc.inquiries     + r.inquiries,
      bookings:      acc.bookings      + r.bookings,
      payments:      acc.payments      + r.payments,
      revenue:       acc.revenue       + r.revenue,
      cancellations: acc.cancellations + r.cancellations,
    }),
    { inquiries: 0, bookings: 0, payments: 0, revenue: 0, cancellations: 0 }
  );

  const currTotal = sumAll(curr);
  const prevTotal = sumAll(prev);

  const orderedCountries = COUNTRIES.filter(c => curr[c.id] || prev[c.id]);

  const METRICS = [
    { key: 'inquiries',  label: '문의',  fmt: formatNumber,   unit: '건' },
    { key: 'bookings',   label: '예약',  fmt: formatNumber,   unit: '건' },
    { key: 'payments',   label: '수납',  fmt: formatNumber,   unit: '건' },
    { key: 'revenue',    label: '매출',  fmt: formatCurrency, unit: '원' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">전월 동기간 비교</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-blue-500 font-medium">{currLabel}</span>
            {' vs '}
            <span className="text-gray-400">{prevLabel}</span>
          </p>
        </div>
      </div>

      {/* 전체 합계 KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100">
        {METRICS.map((m, i) => {
          const c = currTotal[m.key];
          const p = prevTotal[m.key];
          return (
            <div key={m.key} className={`px-4 py-3 ${i < METRICS.length - 1 ? 'border-r border-gray-100' : ''}`}>
              <p className="text-xs text-gray-400 mb-1">{m.label}</p>
              <p className="text-base font-bold text-gray-800">
                {m.fmt(c)}<span className="text-xs text-gray-400 ml-0.5">{m.unit}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                <span>전월 {m.fmt(p)}</span>
                <Delta curr={c} prev={p} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 국가별 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {/* 지표 그룹 헤더 */}
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2 text-gray-500 font-medium" rowSpan={2}>국가</th>
              {METRICS.map((m, i) => (
                <th key={m.key}
                  colSpan={3}
                  className={`text-center py-2 text-gray-600 font-semibold ${i < METRICS.length - 1 ? 'border-r border-gray-200' : ''}`}>
                  {m.label}
                </th>
              ))}
            </tr>
            {/* 세부 헤더 */}
            <tr className="bg-gray-50 border-b border-gray-200">
              {METRICS.map((m, i) => (
                <>
                  <th key={`${m.key}-curr`} className="text-right px-3 py-1.5 text-blue-400 font-normal whitespace-nowrap">
                    {currLabel.split('~')[0]}~
                  </th>
                  <th key={`${m.key}-prev`} className="text-right px-3 py-1.5 text-gray-400 font-normal whitespace-nowrap">
                    전월
                  </th>
                  <th key={`${m.key}-delta`}
                    className={`text-right px-3 py-1.5 text-gray-400 font-normal ${i < METRICS.length - 1 ? 'border-r border-gray-200' : ''}`}>
                    증감
                  </th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedCountries.map(c => {
              const cr = curr[c.id] || {};
              const pr = prev[c.id] || {};
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{c.label}</td>
                  {METRICS.map((m, i) => (
                    <>
                      <td key={`${m.key}-curr`} className="px-3 py-2 text-right font-medium text-gray-800">
                        {m.fmt(cr[m.key] || 0)}
                      </td>
                      <td key={`${m.key}-prev`} className="px-3 py-2 text-right text-gray-400">
                        {m.fmt(pr[m.key] || 0)}
                      </td>
                      <td key={`${m.key}-delta`}
                        className={`px-3 py-2 text-right ${i < METRICS.length - 1 ? 'border-r border-gray-100' : ''}`}>
                        <Delta curr={cr[m.key]||0} prev={pr[m.key]||0} />
                      </td>
                    </>
                  ))}
                </tr>
              );
            })}
            {/* 합계 행 */}
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <td className="px-4 py-2 text-gray-800">합계</td>
              {METRICS.map((m, i) => (
                <>
                  <td key={`total-${m.key}-curr`} className="px-3 py-2 text-right text-gray-900">
                    {m.fmt(currTotal[m.key])}
                  </td>
                  <td key={`total-${m.key}-prev`} className="px-3 py-2 text-right text-gray-400">
                    {m.fmt(prevTotal[m.key])}
                  </td>
                  <td key={`total-${m.key}-delta`}
                    className={`px-3 py-2 text-right ${i < METRICS.length - 1 ? 'border-r border-gray-200' : ''}`}>
                    <Delta curr={currTotal[m.key]} prev={prevTotal[m.key]} />
                  </td>
                </>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
