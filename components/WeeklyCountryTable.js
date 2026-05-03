import { COUNTRIES } from '@/lib/constants';
import { formatCurrency, formatNumber, formatPercent, formatDelta, calcDelta } from '@/lib/utils';

const LABEL_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c.label]));

function Delta({ curr, prev }) {
  const delta = calcDelta(curr, prev);
  if (!isFinite(delta)) return curr > 0 ? <span className="text-green-500 text-xs ml-1">NEW</span> : null;
  if (delta === 0) return null;
  const color = delta > 0 ? 'text-green-500' : 'text-red-400';
  return <span className={`${color} text-xs ml-1`}>{formatDelta(delta)}</span>;
}

export default function WeeklyCountryTable({ currByCountry, prevByCountry }) {
  const prevMap = Object.fromEntries((prevByCountry || []).map(r => [r.country, r]));

  const orderedData = COUNTRIES
    .map(c => currByCountry.find(r => r.country === c.id))
    .filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-500 font-medium">국가</th>
            <th className="text-right py-2 text-gray-500 font-medium">문의</th>
            <th className="text-right py-2 text-gray-500 font-medium">예약</th>
            <th className="text-right py-2 text-gray-500 font-medium">예약율</th>
            <th className="text-right py-2 text-gray-500 font-medium">수납</th>
            <th className="text-right py-2 text-gray-500 font-medium">매출</th>
            <th className="text-right py-2 text-gray-500 font-medium">객단가</th>
          </tr>
        </thead>
        <tbody>
          {orderedData.map(row => {
            const prev = prevMap[row.country] || {};
            return (
              <tr key={row.country} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 font-medium text-gray-700">{LABEL_MAP[row.country] || row.country}</td>
                <td className="py-2 text-right text-gray-600">
                  {formatNumber(row.inquiries)}<Delta curr={row.inquiries} prev={prev.inquiries} />
                </td>
                <td className="py-2 text-right text-gray-600">
                  {formatNumber(row.bookings)}<Delta curr={row.bookings} prev={prev.bookings} />
                </td>
                <td className="py-2 text-right text-gray-600">{formatPercent(row.bookingRate)}</td>
                <td className="py-2 text-right text-gray-600">
                  {formatNumber(row.payments)}<Delta curr={row.payments} prev={prev.payments} />
                </td>
                <td className="py-2 text-right text-gray-800 font-medium">
                  {formatCurrency(row.revenue)}<Delta curr={row.revenue} prev={prev.revenue} />
                </td>
                <td className="py-2 text-right text-gray-600">{formatCurrency(row.avgSpend)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
