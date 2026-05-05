'use client';
import { formatNumber, formatCurrency, formatPercent, formatDelta, calcDelta } from '@/lib/utils';

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  if (!isFinite(delta)) return <span className="text-xs text-green-500 font-medium">신규</span>;
  if (delta === 0) return <span className="text-xs text-gray-400">-</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-green-500' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(1)}%
    </span>
  );
}

function WeekKpiCard({ label, curr, prev, format }) {
  const delta = calcDelta(curr, prev);
  const formatted = format === 'currency' ? formatCurrency(curr)
    : format === 'percent' ? formatPercent(curr)
    : formatNumber(curr);
  const prevFormatted = format === 'currency' ? formatCurrency(prev)
    : format === 'percent' ? formatPercent(prev)
    : formatNumber(prev);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-2xl font-bold text-gray-900">{formatted}</p>
        <DeltaBadge delta={delta} />
      </div>
      <p className="text-xs text-gray-400 mt-1">전주 {prevFormatted}</p>
    </div>
  );
}

export default function WeeklyKpiCards({ curr, prev }) {
  if (!curr || !prev) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <WeekKpiCard label="문의" curr={curr.inquiries} prev={prev.inquiries} format="number" />
      <WeekKpiCard label="예약" curr={curr.bookings} prev={prev.bookings} format="number" />
      <WeekKpiCard label="예약율" curr={curr.bookingRate} prev={prev.bookingRate} format="percent" />
      <WeekKpiCard label="매출" curr={curr.revenue} prev={prev.revenue} format="currency" />
      <WeekKpiCard label="수납" curr={curr.payments} prev={prev.payments} format="number" />
      <WeekKpiCard label="객단가" curr={curr.avgSpend} prev={prev.avgSpend} format="currency" />
    </div>
  );
}
