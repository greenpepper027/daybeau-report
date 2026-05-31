'use client';
import { useEffect, useState, useMemo } from 'react';
import { COUNTRIES } from '@/lib/constants';
import { aggregateByCountry, formatCurrency, formatNumber } from '@/lib/utils';

function TrafficLight({ rate }) {
  if (rate === null || rate === 0) return <span className="text-gray-300 text-xs">-</span>;
  if (rate >= 0.9) return <span title="목표 달성 가능">🟢</span>;
  if (rate >= 0.7) return <span title="달성 주의">🟡</span>;
  return <span title="달성 위험">🔴</span>;
}

function RateBar({ rate }) {
  if (!rate) return <div className="w-full bg-gray-100 rounded-full h-1.5" />;
  const pct = Math.min(rate * 100, 100);
  const color = rate >= 0.9 ? 'bg-green-500' : rate >= 0.7 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RateText({ rate, bold }) {
  if (!rate) return <span className="text-gray-300 text-xs">-</span>;
  const color = rate >= 0.9 ? 'text-green-600' : rate >= 0.7 ? 'text-yellow-600' : 'text-red-500';
  return (
    <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>
      {(rate * 100).toFixed(1)}%
    </span>
  );
}

function parseNum(str) {
  return Number(String(str).replace(/,/g, '')) || 0;
}

export default function TargetTracker({ monthData, year, month, isAdmin }) {
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingTargets(true);
    fetch(`/api/targets?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(res => { setTargets(res.targets || []); setLoadingTargets(false); })
      .catch(() => setLoadingTargets(false));
  }, [year, month]);

  function startEdit() {
    const vals = {};
    COUNTRIES.forEach(c => {
      const t = targets.find(t => t.country === c.id);
      vals[c.id] = {
        targetBookings: t ? String(t.targetBookings) : '',
        targetAvgSpend: t ? String(t.targetAvgSpend) : '',
        memo: t ? t.memo : '',
      };
    });
    setEditValues(vals);
    setEditing(true);
  }

  async function saveTargets() {
    setSaving(true);
    const payload = COUNTRIES
      .map(c => ({
        country: c.id,
        targetBookings: parseNum(editValues[c.id]?.targetBookings),
        targetAvgSpend: parseNum(editValues[c.id]?.targetAvgSpend),
        memo: editValues[c.id]?.memo || '',
      }))
      .filter(t => t.targetBookings > 0 || t.targetAvgSpend > 0);
    try {
      await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, targets: payload }),
      });
      setTargets(payload.map(t => ({ year, month, ...t })));
      setEditing(false);
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const byCountry = useMemo(() => {
    const map = {};
    aggregateByCountry(monthData).forEach(r => { map[r.country] = r; });
    return map;
  }, [monthData]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysElapsed = useMemo(() => {
    if (!monthData.length) return 0;
    const max = monthData.reduce((m, r) => r.date > m ? r.date : m, '');
    return max ? parseInt(max.split('-')[2]) : 0;
  }, [monthData]);

  const rows = useMemo(() => {
    const MERGED_IDS = ['english', 'indonesia'];
    const HIDDEN_IDS = ['vietnam'];
    const baseRows = COUNTRIES
      .filter(c => !MERGED_IDS.includes(c.id) && !HIDDEN_IDS.includes(c.id))
      .map(c => {
        const actual = byCountry[c.id];
        const target = targets.find(t => t.country === c.id);
        const actualPayments = actual?.payments || 0;
        const actualRevenue = actual?.revenue || 0;
        const actualAvgSpend = actualPayments > 0 ? actualRevenue / actualPayments : 0;
        const targetBookings = target?.targetBookings || 0;
        const targetAvgSpend = target?.targetAvgSpend || 0;
        const targetRevenue = targetBookings * targetAvgSpend;
        const dailyAvg = daysInMonth > 0 ? (targetBookings / daysInMonth) : 0;
        const revenueRate = targetRevenue > 0 ? actualRevenue / targetRevenue : null;
        const projectedRevenue = daysElapsed > 0 ? (actualRevenue / daysElapsed) * daysInMonth : null;
        const projectedRevenueRate = targetRevenue > 0 && projectedRevenue !== null
          ? projectedRevenue / targetRevenue : null;
        return {
          country: c,
          targetBookings, targetAvgSpend, targetRevenue, dailyAvg,
          actualPayments, actualRevenue, actualAvgSpend,
          revenueRate, projectedRevenue, projectedRevenueRate,
          memo: target?.memo || '',
          hasData: !!(actual || target),
        };
      })
      .filter(r => r.hasData);

    // 영어권 + 인도네시아 합산 행
    const mergedActualPayments = MERGED_IDS.reduce((s, id) => s + (byCountry[id]?.payments || 0), 0);
    const mergedActualRevenue  = MERGED_IDS.reduce((s, id) => s + (byCountry[id]?.revenue  || 0), 0);
    const mergedTargetBookings = MERGED_IDS.reduce((s, id) => s + (targets.find(t => t.country === id)?.targetBookings || 0), 0);
    const mergedTargetRevenue  = MERGED_IDS.reduce((s, id) => {
      const t = targets.find(t => t.country === id);
      return s + ((t?.targetBookings || 0) * (t?.targetAvgSpend || 0));
    }, 0);
    const mergedHasData = MERGED_IDS.some(id => byCountry[id] || targets.find(t => t.country === id));

    if (mergedHasData) {
      const mergedTargetAvgSpend   = mergedTargetBookings > 0 ? mergedTargetRevenue / mergedTargetBookings : 0;
      const mergedActualAvgSpend   = mergedActualPayments > 0 ? mergedActualRevenue / mergedActualPayments : 0;
      const mergedDailyAvg         = daysInMonth > 0 ? mergedTargetBookings / daysInMonth : 0;
      const mergedRevenueRate      = mergedTargetRevenue > 0 ? mergedActualRevenue / mergedTargetRevenue : null;
      const mergedProjected        = daysElapsed > 0 ? (mergedActualRevenue / daysElapsed) * daysInMonth : null;
      const mergedProjectedRate    = mergedTargetRevenue > 0 && mergedProjected !== null
        ? mergedProjected / mergedTargetRevenue : null;
      baseRows.push({
        country: { id: 'english+indonesia', label: '영어권+인니' },
        targetBookings: mergedTargetBookings,
        targetAvgSpend: mergedTargetAvgSpend,
        targetRevenue:  mergedTargetRevenue,
        dailyAvg:       mergedDailyAvg,
        actualPayments: mergedActualPayments,
        actualRevenue:  mergedActualRevenue,
        actualAvgSpend: mergedActualAvgSpend,
        revenueRate:    mergedRevenueRate,
        projectedRevenue:     mergedProjected,
        projectedRevenueRate: mergedProjectedRate,
        memo: '',
        hasData: true,
      });
    }

    return baseRows;
  }, [byCountry, targets, daysInMonth, daysElapsed]);

  const totals = useMemo(() => {
    const targetBookings = rows.reduce((s, r) => s + r.targetBookings, 0);
    const targetRevenue = rows.reduce((s, r) => s + r.targetRevenue, 0);
    const actualPayments = rows.reduce((s, r) => s + r.actualPayments, 0);
    const actualRevenue = rows.reduce((s, r) => s + r.actualRevenue, 0);
    const actualAvgSpend = actualPayments > 0 ? actualRevenue / actualPayments : 0;
    const projectedRevenue = daysElapsed > 0 ? (actualRevenue / daysElapsed) * daysInMonth : null;
    const targetAvgSpend = targetBookings > 0 ? targetRevenue / targetBookings : 0;
    const dailyAvg = daysInMonth > 0 ? targetBookings / daysInMonth : 0;
    return {
      targetBookings, targetRevenue, targetAvgSpend, dailyAvg,
      actualPayments, actualRevenue, actualAvgSpend,
      revenueRate: targetRevenue > 0 ? actualRevenue / targetRevenue : null,
      projectedRevenue,
      projectedRevenueRate: targetRevenue > 0 && projectedRevenue !== null ? projectedRevenue / targetRevenue : null,
    };
  }, [rows, daysElapsed, daysInMonth]);

  const hasTargets = targets.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">
            월 KPI 목표 및 달성 현황
            {daysElapsed > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({daysElapsed}일 경과 / {daysInMonth}일)
              </span>
            )}
          </h3>
          {!hasTargets && !loadingTargets && (
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdmin ? '✏️ 목표 수정 버튼을 눌러 목표를 설정하세요.' : '목표가 설정되지 않았습니다.'}
            </p>
          )}
        </div>
        {isAdmin && !editing && (
          <button onClick={startEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            ✏️ 목표 수정
          </button>
        )}
        {isAdmin && editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-500 hover:bg-gray-50">
              취소
            </button>
            <button onClick={saveTargets} disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>

      {loadingTargets ? (
        <div className="py-10 text-center text-gray-400 text-sm">불러오는 중...</div>
      ) : editing ? (
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400 mb-2">예약 목표와 평균 객단가를 입력하면 매출 목표가 자동 계산됩니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-3 py-2.5 font-medium">국가</th>
                  <th className="text-right px-3 py-2.5 font-medium">예약 목표(월)</th>
                  <th className="text-right px-3 py-2.5 font-medium">평균 객단가(원)</th>
                  <th className="text-right px-3 py-2.5 font-medium text-blue-600">월 매출 목표 (자동)</th>
                  <th className="text-left px-3 py-2.5 font-medium">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COUNTRIES.filter(c => c.id !== 'vietnam').map(c => {
                  const v = editValues[c.id] || {};
                  const calcRevenue = parseNum(v.targetBookings) * parseNum(v.targetAvgSpend);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{c.label}</td>
                      <td className="px-3 py-2">
                        <input type="number" min="0"
                          value={v.targetBookings || ''}
                          onChange={e => setEditValues(prev => ({
                            ...prev, [c.id]: { ...prev[c.id], targetBookings: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0"
                          value={v.targetAvgSpend || ''}
                          onChange={e => setEditValues(prev => ({
                            ...prev, [c.id]: { ...prev[c.id], targetAvgSpend: e.target.value }
                          }))}
                          placeholder="0"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2 text-right text-blue-600 font-medium text-sm">
                        {calcRevenue > 0 ? formatCurrency(calcRevenue) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text"
                          value={v.memo || ''}
                          onChange={e => setEditValues(prev => ({
                            ...prev, [c.id]: { ...prev[c.id], memo: e.target.value }
                          }))}
                          placeholder="메모"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">구분</th>
                <th className="text-right px-3 py-3 font-medium">예약 목표(월)</th>
                <th className="text-right px-3 py-3 font-medium">일 평균</th>
                <th className="text-right px-3 py-3 font-medium">평균 객단가</th>
                <th className="text-right px-3 py-3 font-medium">월 매출 목표</th>
                <th className="text-right px-3 py-3 font-medium">현재 수납</th>
                <th className="text-right px-3 py-3 font-medium">현재 객단가</th>
                <th className="text-right px-3 py-3 font-medium">현재 매출</th>
                <th className="px-3 py-3 font-medium min-w-[110px]">매출 달성률</th>
                <th className="text-right px-3 py-3 font-medium">월말 예상 매출</th>
                <th className="text-right px-3 py-3 font-medium">예상 달성률</th>
                <th className="text-center px-3 py-3 font-medium">상태</th>
                <th className="text-left px-3 py-3 font-medium">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.country.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.country.label}</td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {r.targetBookings > 0 ? formatNumber(r.targetBookings) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500 text-xs">
                    {r.dailyAvg > 0 ? r.dailyAvg.toFixed(1) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500 text-xs">
                    {r.targetAvgSpend > 0 ? formatCurrency(r.targetAvgSpend) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-gray-700">
                    {r.targetRevenue > 0 ? formatCurrency(r.targetRevenue) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">{formatNumber(r.actualPayments)}</td>
                  <td className="px-3 py-3 text-right text-purple-600 font-medium text-xs">
                    {r.actualAvgSpend > 0 ? formatCurrency(r.actualAvgSpend) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-blue-600">{formatCurrency(r.actualRevenue)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <RateText rate={r.revenueRate} />
                      <RateBar rate={r.revenueRate} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600 text-xs">
                    {r.projectedRevenue !== null ? formatCurrency(r.projectedRevenue) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-3 text-right"><RateText rate={r.projectedRevenueRate} /></td>
                  <td className="px-3 py-3 text-center">
                    <TrafficLight rate={r.projectedRevenueRate ?? r.revenueRate} />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 max-w-[140px]">
                    {r.memo || <span className="text-gray-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200 text-gray-900">
                <td className="px-4 py-3">합계</td>
                <td className="px-3 py-3 text-right">{totals.targetBookings > 0 ? formatNumber(totals.targetBookings) : '-'}</td>
                <td className="px-3 py-3 text-right text-xs font-normal">{totals.dailyAvg > 0 ? totals.dailyAvg.toFixed(1) : '-'}</td>
                <td className="px-3 py-3 text-right text-xs font-normal">{totals.targetAvgSpend > 0 ? formatCurrency(totals.targetAvgSpend) : '-'}</td>
                <td className="px-3 py-3 text-right">{totals.targetRevenue > 0 ? formatCurrency(totals.targetRevenue) : '-'}</td>
                <td className="px-3 py-3 text-right">{formatNumber(totals.actualPayments)}</td>
                <td className="px-3 py-3 text-right text-purple-600 font-normal text-xs">
                  {totals.actualAvgSpend > 0 ? formatCurrency(totals.actualAvgSpend) : '-'}
                </td>
                <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(totals.actualRevenue)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <RateText rate={totals.revenueRate} bold />
                    <RateBar rate={totals.revenueRate} />
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-xs font-normal">
                  {totals.projectedRevenue !== null ? formatCurrency(totals.projectedRevenue) : '-'}
                </td>
                <td className="px-3 py-3 text-right"><RateText rate={totals.projectedRevenueRate} bold /></td>
                <td className="px-3 py-3 text-center">
                  <TrafficLight rate={totals.projectedRevenueRate ?? totals.revenueRate} />
                </td>
                <td className="px-3 py-3">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
