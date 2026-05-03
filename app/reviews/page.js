'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | active | deleted

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/reviews')
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  const filtered = useMemo(() => {
    if (filter === 'active')  return data.filter(r => !r.deleted);
    if (filter === 'deleted') return data.filter(r => r.deleted);
    return data;
  }, [data, filter]);

  const deletedCount = data.filter(r => r.deleted).length;
  const activeCount  = data.length - deletedCount;

  if (status === 'loading') return <div className="text-center py-20 text-gray-400">로딩 중...</div>;
  if (!session) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">구글리뷰</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            전체 {data.length}건 · 삭제완료 {deletedCount}건 · 미삭제 {activeCount}건
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ id: 'all', label: '전체' }, { id: 'active', label: '미삭제' }, { id: 'deleted', label: '삭제완료' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">데이터 불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">데이터가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row, idx) => (
            <div key={idx} className={`bg-white rounded-xl border p-4 shadow-sm ${row.deleted ? 'border-green-100 bg-green-50' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">#{row.no}</span>
                  {row.deleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">삭제완료</span>
                  )}
                </div>
                {row.link && (
                  <a href={row.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline truncate max-w-xs">
                    리뷰 링크 →
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{row.content}</p>
              {row.note && (
                <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{row.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
