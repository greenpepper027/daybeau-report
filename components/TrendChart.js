'use client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COUNTRY_COLORS, COUNTRIES } from '@/lib/constants';
import { formatCurrency, formatNumber } from '@/lib/utils';

const LABEL_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c.label]));
const COUNTRY_ORDER = COUNTRIES.map(c => c.id);

function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function CustomLegend({ orderedCountries }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
      {orderedCountries.map(c => (
        <span key={c} className="flex items-center gap-1 text-[11px] text-gray-600">
          <span style={{ display: 'inline-block', width: 12, height: 2, backgroundColor: COUNTRY_COLORS[c] || '#94a3b8', borderRadius: 1 }} />
          {LABEL_MAP[c] || c}
        </span>
      ))}
    </div>
  );
}

export default function TrendChart({ data, countries, metric, title }) {
  const isRevenue = metric === 'revenue';
  const formatter = isRevenue ? formatCurrency : formatNumber;
  const orderedCountries = COUNTRY_ORDER.filter(id => countries.includes(id));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={v => isRevenue ? `${(v / 10000).toFixed(0)}만` : v} tick={{ fontSize: 10 }} width={45} />
          <Tooltip
            formatter={(v, name) => [formatter(v), LABEL_MAP[name] || name]}
            labelFormatter={l => shortDate(l)}
          />
          {orderedCountries.map(c => (
            <Line
              key={c}
              type="monotone"
              dataKey={`${c}.${metric}`}
              name={LABEL_MAP[c] || c}
              stroke={COUNTRY_COLORS[c] || '#94a3b8'}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <CustomLegend orderedCountries={orderedCountries} />
    </div>
  );
}

export function RevenueBarChart({ data, title }) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="country" tickFormatter={v => LABEL_MAP[v] || v} tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={v => [formatCurrency(v) + '원', '매출']} />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
