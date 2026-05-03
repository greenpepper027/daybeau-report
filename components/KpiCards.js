import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export default function KpiCards({ total }) {
  const cards = [
    { label: '총 문의', value: formatNumber(total.inquiries), unit: '건', color: 'text-blue-600' },
    { label: '총 예약', value: formatNumber(total.bookings), unit: '건', color: 'text-green-600' },
    { label: '예약율', value: formatPercent(total.bookingRate || 0), unit: '', color: 'text-purple-600' },
    { label: '총 수납', value: formatNumber(total.payments), unit: '건', color: 'text-teal-600' },
    { label: '총 매출', value: formatCurrency(total.revenue), unit: '원', color: 'text-orange-600' },
    { label: '객단가', value: formatCurrency(total.avgSpend || 0), unit: '원', color: 'text-rose-600' },
    { label: '취소', value: formatNumber(total.cancellations || 0), unit: '건', color: 'text-gray-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          {card.unit && <p className="text-xs text-gray-400">{card.unit}</p>}
        </div>
      ))}
    </div>
  );
}
