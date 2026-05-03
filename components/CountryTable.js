import { COUNTRIES } from '@/lib/constants';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const LABEL_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c.label]));

export default function CountryTable({ data }) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sorted.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">국가별 실적</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-500 font-medium">국가</th>
            <th className="text-right py-2 text-gray-500 font-medium">문의</th>
            <th className="text-right py-2 text-gray-500 font-medium">예약율</th>
            <th className="text-right py-2 text-gray-500 font-medium">수납</th>
            <th className="text-right py-2 text-gray-500 font-medium">매출</th>
            <th className="text-right py-2 text-gray-500 font-medium">비율</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row.country} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 font-medium text-gray-700">{LABEL_MAP[row.country] || row.country}</td>
              <td className="py-2 text-right text-gray-600">{formatNumber(row.inquiries)}</td>
              <td className="py-2 text-right text-gray-600">{formatPercent(row.bookingRate)}</td>
              <td className="py-2 text-right text-gray-600">{formatNumber(row.payments)}</td>
              <td className="py-2 text-right text-gray-800 font-medium">{formatCurrency(row.revenue)}</td>
              <td className="py-2 text-right text-gray-500">
                {totalRevenue > 0 ? formatPercent(row.revenue / totalRevenue) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
