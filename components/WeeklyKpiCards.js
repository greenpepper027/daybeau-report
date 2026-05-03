import { formatCurrency, formatNumber, formatPercent, formatDelta, calcDelta } from '@/lib/utils';

function DeltaBadge({ delta }) {
  if (delta === null || delta === undefined) return null;
  if (!isFinite(delta)) return <span className="text-xs text-green-500 ml-1">NEW</span>;
  const formatted = formatDelta(delta);
  const color = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-gray-400';
  return <span className={`text-xs ml-1 ${color}`}>{formatted}</span>;
}

export default function WeeklyKpiCards({ curr, prev }) {
  const cards = [
    {
      label: '문의',
      value: formatNumber(curr.inquiries),
      unit: '건',
      delta: calcDelta(curr.inquiries, prev.inquiries),
      color: 'text-blue-600',
    },
    {
      label: '예약',
      value: formatNumber(curr.bookings),
      unit: '건',
      delta: calcDelta(curr.bookings, prev.bookings),
      color: 'text-green-600',
    },
    {
      label: '예약율',
      value: formatPercent(curr.bookingRate || 0),
      unit: '',
      delta: calcDelta(curr.bookingRate, prev.bookingRate),
      color: 'text-purple-600',
    },
    {
      label: '수납',
      value: formatNumber(curr.payments),
      unit: '건',
      delta: calcDelta(curr.payments, prev.payments),
      color: 'text-teal-600',
    },
    {
      label: '매출',
      value: formatCurrency(curr.revenue),
      unit: '원',
      delta: calcDelta(curr.revenue, prev.revenue),
      color: 'text-orange-600',
    },
    {
      label: '객단가',
      value: formatCurrency(curr.avgSpend || 0),
      unit: '원',
      delta: calcDelta(curr.avgSpend, prev.avgSpend),
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <div className="flex items-baseline flex-wrap">
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            <DeltaBadge delta={card.delta} />
          </div>
          {card.unit && <p className="text-xs text-gray-400">{card.unit}</p>}
        </div>
      ))}
    </div>
  );
}
