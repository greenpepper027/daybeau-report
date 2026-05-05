'use client';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils';

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function KpiCards({ total }) {
  if (!total) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard label="문의" value={formatNumber(total.inquiries)} sub="건" />
      <KpiCard label="예약" value={formatNumber(total.bookings)} sub="건" />
      <KpiCard label="예약율" value={formatPercent(total.bookingRate || 0)} color={total.bookingRate >= 0.5 ? 'text-green-600' : 'text-orange-500'} />
      <KpiCard label="매출" value={formatCurrency(total.revenue)} sub="원" color="text-blue-600" />
      <KpiCard label="수납" value={formatNumber(total.payments)} sub="건" />
      <KpiCard label="객단가" value={formatCurrency(total.avgSpend || 0)} sub="원/건" color="text-purple-600" />
    </div>
  );
}
