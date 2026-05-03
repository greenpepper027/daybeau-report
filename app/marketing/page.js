'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

const COUNTRY_COLS = [
  { id: 'japan',     label: '일본' },
  { id: 'china',     label: '중국' },
  { id: 'taiwan',    label: '대만' },
  { id: 'thailand',  label: '태국' },
  { id: 'english',   label: '영어권' },
  { id: 'indonesia', label: '인도네시아' },
];
const CATEGORIES = ['SNS채널', '체험단', '인플루언서', '기타'];

export default function MarketingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/marketing')
      .then(r => r.json())
      .then(res => {
        const d = res.data || [];
        setData(d);
        const periods = [...new Set(d.map(r => r.period))];
        if (periods.length > 0) setSelectedPeriod(periods[periods.length - 1]);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [status]);

  const periods = useMemo(() => [...new Set(data.map(r => r.period))], [data]);
  const filtered = useMemo(() => data.filter(r => r.period === selectedPeriod), [data, selectedPeriod]);

  if (status === 'loading') return <div className="text-center py-20 text-gray-400">로딩 중...</div>;
  if (!session) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">마케팅 주요진행사항</h1>
          <p className="text-sm text-gray-500 mt-0.5">월별 SNS · 체험단 · 인플루언서 현황</p>
        </div>
        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-28">구분</th>
                {COUNTRY_COLS.map(c => (
                  <th key={c.id} className="text-left px-4 py-3 text-gray-500 font-medium">{c.label}</th>
                ))}
                <th className="text-right px-4 py-3 text-gray-500 font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => {
                const row = filtered.find(r => r.category === cat);
                return (
                  <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 font-medium text-gray-700">{cat}</td>
                    {COUNTRY_COLS.map(c => (
                      <td key={c.id} className="px-4 py-3 text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">
                        {row ? String(row[c.id] || '') : ''}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">
                      {row && row.total ? row.total : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 전체 월별 목록 */}
      {!loading && periods.length > 1 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {periods.map(p => (
            <button key={p} onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
