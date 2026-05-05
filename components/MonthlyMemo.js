'use client';
import { useEffect, useState } from 'react';

export default function MonthlyMemo({ year, month, isAdmin }) {
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/memo?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(res => { setContent(res.content || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  function startEdit() {
    setEditText(content);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, content: editText }),
      });
      setContent(editText);
      setEditing(false);
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">📝 월별 특이사항</h3>
          <p className="text-xs text-gray-400 mt-0.5">캠페인, 이슈, 주요 이벤트 등 기록</p>
        </div>
        {isAdmin && !editing && (
          <button onClick={startEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            ✏️ {content ? '수정' : '작성'}
          </button>
        )}
        {isAdmin && editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-500 hover:bg-gray-50">
              취소
            </button>
            <button onClick={save} disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : editing ? (
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            placeholder={`${year}년 ${month}월 특이사항을 입력하세요.\n예) 일본 봄 시즌 프로모션 진행, 태국 SNS 캠페인 집중 투입 등`}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : content ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <p className="text-sm text-gray-300 italic">
            {isAdmin ? '✏️ 작성 버튼을 눌러 이달의 특이사항을 기록해보세요.' : '작성된 내용이 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
}
