export function formatCurrency(value) {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDelta(value) {
  if (!isFinite(value) || isNaN(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function calcDelta(curr, prev) {
  if (!prev || prev === 0) return curr > 0 ? Infinity : 0;
  return (curr - prev) / prev;
}

export function aggregateByCountry(data) {
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.country]) {
      grouped[row.country] = { country: row.country, inquiries: 0, bookings: 0, payments: 0, revenue: 0, cancellations: 0 };
    }
    grouped[row.country].inquiries     += row.inquiries     || 0;
    grouped[row.country].bookings      += row.bookings      || 0;
    grouped[row.country].payments      += row.payments      || 0;
    grouped[row.country].revenue       += row.revenue       || 0;
    grouped[row.country].cancellations += row.cancellations || 0;
  }
  return Object.values(grouped).map(r => ({
    ...r,
    bookingRate: r.inquiries > 0 ? r.bookings / r.inquiries : 0,
    avgSpend:    r.payments  > 0 ? r.revenue  / r.payments  : 0,
  }));
}

export function aggregateTotal(data) {
  const totals = data.reduce(
    (acc, r) => ({
      inquiries:     acc.inquiries     + (r.inquiries     || 0),
      bookings:      acc.bookings      + (r.bookings      || 0),
      payments:      acc.payments      + (r.payments      || 0),
      revenue:       acc.revenue       + (r.revenue       || 0),
      cancellations: acc.cancellations + (r.cancellations || 0),
    }),
    { inquiries: 0, bookings: 0, payments: 0, revenue: 0, cancellations: 0 }
  );
  return {
    ...totals,
    bookingRate: totals.inquiries > 0 ? totals.bookings / totals.inquiries : 0,
    avgSpend:    totals.payments  > 0 ? totals.revenue  / totals.payments  : 0,
  };
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { start, end };
}

export function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

export function getWeekRange(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateStr(monday), end: toDateStr(sunday) };
}

export function getCurrentWeekRange() {
  return getWeekRange(toDateStr(new Date()));
}

export function getPrevWeekRange(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return getWeekRange(toDateStr(d));
}

export function getNextWeekRange(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + 7);
  return getWeekRange(toDateStr(d));
}

export function formatWeekLabel(start, end) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.getMonth() + 1}/${s.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
}

export function downloadCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/**
 * 전월 동기간 범위 반환
 * 오늘이 5월 15일이면:
 *   curr: { start: '2026-05-01', end: '2026-05-15' }
 *   prev: { start: '2026-04-01', end: '2026-04-15' }
 */
export function getSamePeriodRanges() {
  const today = new Date();
  const todayDay = today.getDate();
  const currYear = today.getFullYear();
  const currMonth = today.getMonth() + 1;

  const currStart = `${currYear}-${String(currMonth).padStart(2, '0')}-01`;
  const currEnd = toDateStr(today);

  // 전월 계산
  const prevMonthDate = new Date(currYear, currMonth - 2, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;

  // 전월의 마지막 날
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevDay = Math.min(todayDay, prevLastDay);

  const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;

  return {
    curr: { start: currStart, end: currEnd, label: `${currMonth}월 1일~${todayDay}일` },
    prev: { start: prevStart, end: prevEnd, label: `${prevMonth}월 1일~${prevDay}일` },
  };
}
