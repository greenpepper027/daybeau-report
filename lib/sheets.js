import { google } from 'googleapis';
import { COUNTRIES, METRIC_MAP, DAILY_SHEET_TABS, MARKETING_SHEET_TAB, REVIEWS_SHEET_TAB, REPORT_SHEET_TABS } from './constants';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

// 국가 sheetLabel → id 변환 맵
const COUNTRY_LABEL_TO_ID = Object.fromEntries(
  COUNTRIES.map(c => [c.sheetLabel, c.id])
);

/**
 * 시트 row1(국가), row2(지표)를 읽어 컬럼 인덱스 → {countryId, metricId} 맵 반환
 */
function buildColumnMap(row1, row2) {
  const map = {};
  let currentCountry = null;
  for (let i = 0; i < Math.max(row1.length, row2.length); i++) {
    const cell1 = (row1[i] || '').trim();
    const cell2 = (row2[i] || '').trim();
    if (cell1 && COUNTRY_LABEL_TO_ID[cell1]) {
      currentCountry = COUNTRY_LABEL_TO_ID[cell1];
    }
    if (currentCountry && cell2 && METRIC_MAP[cell2]) {
      map[i] = { countryId: currentCountry, metricId: METRIC_MAP[cell2] };
    }
  }
  return map;
}

/**
 * 날짜 셀 값을 YYYY-MM-DD 로 변환
 * Google Sheets는 날짜를 시리얼 숫자(1899-12-30 기준)로 저장함
 */
function parseSheetDate(rawDate, year) {
  if (rawDate === null || rawDate === undefined || rawDate === '') return null;

  // 숫자 시리얼 → 날짜 변환 (Google Sheets 기준: 1899-12-30)
  if (typeof rawDate === 'number') {
    const date = new Date(1899, 11, 30 + Math.floor(rawDate));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 텍스트 "9월 16일" 형태 (fallback)
  const match = String(rawDate).match(/(\d+)월\s*(\d+)일/);
  if (!match) return null;
  const m = String(match[1]).padStart(2, '0');
  const d = String(match[2]).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** 합계 행인지 판별 */
function isSubtotalRow(rawDate) {
  if (rawDate === null || rawDate === undefined || rawDate === '') return true;
  if (typeof rawDate === 'number') return false;
  const str = String(rawDate).trim();
  return !str || str.includes('합계') || str.includes('합 계');
}

/**
 * 특정 연도의 데일리 데이터를 파싱해서 반환
 * 반환: [{ date, country, inquiries, bookings, payments, revenue, avgSpend, cancellations }]
 */
async function getDailyDataForYear(sheets, year) {
  const tabName = DAILY_SHEET_TABS[year];
  if (!tabName) return [];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tabName}'!A1:BZ`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  if (rows.length < 3) return [];

  const row1 = rows[0];
  const row2 = rows[1];
  const columnMap = buildColumnMap(row1, row2);

  // 날짜 컬럼 인덱스: row2에서 '날짜' 위치 탐색 (없으면 1번 컬럼 사용)
  const dateColIndex = row2.findIndex(c => String(c || '').trim() === '날짜');
  const dateCol = dateColIndex >= 0 ? dateColIndex : 1;

  const result = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;  // 빈 행 스킵

    const rawDate = row[dateCol];
    if (isSubtotalRow(rawDate)) continue;

    const date = parseSheetDate(rawDate, year);
    if (!date) continue;

    // 국가별로 데이터 수집
    const byCountry = {};
    for (const [colIdx, { countryId, metricId }] of Object.entries(columnMap)) {
      if (!byCountry[countryId]) {
        byCountry[countryId] = { inquiries: 0, bookings: 0, payments: 0, revenue: 0, avgSpend: 0, cancellations: 0 };
      }
      byCountry[countryId][metricId] = Number(row[colIdx]) || 0;
    }

    for (const [country, metrics] of Object.entries(byCountry)) {
      result.push({ date, country, ...metrics });
    }
  }
  return result;
}

/**
 * 날짜 범위로 데일리 데이터 조회 (연도를 자동 판별해서 필요한 탭만 조회)
 */
export async function getDailyData(startDate, endDate) {
  const sheets = getSheets();
  const startYear = Number(startDate.slice(0, 4));
  const endYear = Number(endDate.slice(0, 4));

  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    if (DAILY_SHEET_TABS[y]) years.push(y);
  }

  const allData = (await Promise.all(years.map(y => getDailyDataForYear(sheets, y)))).flat();
  return allData.filter(r => r.date >= startDate && r.date <= endDate);
}

/**
 * 마케팅 주요진행사항 전체 조회
 * 반환: [{ period, category, japan, china, taiwan, thailand, english, indonesia, total }]
 */
export async function getMarketingData() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${MARKETING_SHEET_TAB}'!A1:I`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  // 헤더 행(row 0): A=기간, B=일본, C=중국, D=대만, E=태국, F=영어권, G=인도네시아, H=합계(?)
  // 구조: 각 월이 5개 행(SNS채널, 체험단, 인플루언서, 기타, 빈행)
  const result = [];
  let currentPeriod = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const col0 = String(row[0] || '').trim();

    // 기간 행 판별 (예: "24년 10월", "25년 1월")
    if (col0.match(/\d+년\s*\d+월/)) {
      currentPeriod = col0;
      continue;
    }

    if (!currentPeriod || !col0) continue;

    const categories = ['SNS채널', '체험단', '인플루언서', '기타'];
    if (!categories.includes(col0)) continue;

    result.push({
      period: currentPeriod,
      category: col0,
      japan:     row[1] ?? '',
      china:     row[2] ?? '',
      taiwan:    row[3] ?? '',
      thailand:  row[4] ?? '',
      english:   row[5] ?? '',
      indonesia: row[6] ?? '',
      total:     Number(row[7]) || 0,
    });
  }
  return result;
}

/**
 * 구글리뷰 전체 조회
 * 반환: [{ no, link, content, deleted, note }]
 */
export async function getReviewsData() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${REVIEWS_SHEET_TAB}'!A2:F`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  return rows
    .filter(r => r[0] || r[1])
    .map(r => ({
      no:      Number(r[0]) || 0,
      link:    String(r[1] || ''),
      content: String(r[2] || ''),
      deleted: !!(r[3]),
      note:    String(r[4] || ''),
    }));
}

/**
 * 월 리포트 데이터 조회
 * 반환: { inquiries: [...], revenue: [...] }
 */
export async function getReportData(year) {
  const sheets = getSheets();
  const tabName = REPORT_SHEET_TABS[year];
  if (!tabName) return { inquiries: [], revenue: [] };

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tabName}'!A1:V`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const rows = res.data.values || [];
  // 월 리포트 탭 구조: 행1=국가 헤더(일본/중국/대만/태국/영어권/인도네시아/합계)
  // 행2=지표 헤더(문의수/예약수/예약율, 수납수/매출/객단가/비율)
  // 데이터 행: "2025년 1월" 등

  const result = [];
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const label = String(row[0] || '').trim();
    if (!label.match(/\d{4}년\s*\d+월/)) continue;

    const yearMatch = label.match(/(\d{4})년\s*(\d+)월/);
    if (!yearMatch) continue;
    const ry = Number(yearMatch[1]);
    const rm = Number(yearMatch[2]);

    result.push({
      year: ry, month: rm, label,
      japan:     { inquiries: Number(row[1])||0, bookings: Number(row[2])||0, bookingRate: Number(row[3])||0 },
      china:     { inquiries: Number(row[4])||0, bookings: Number(row[5])||0, bookingRate: Number(row[6])||0 },
      taiwan:    { inquiries: Number(row[7])||0, bookings: Number(row[8])||0, bookingRate: Number(row[9])||0 },
      thailand:  { inquiries: Number(row[10])||0, bookings: Number(row[11])||0, bookingRate: Number(row[12])||0 },
      english:   { inquiries: Number(row[13])||0, bookings: Number(row[14])||0, bookingRate: Number(row[15])||0 },
      indonesia: { inquiries: Number(row[16])||0, bookings: Number(row[17])||0, bookingRate: Number(row[18])||0 },
      total:     { inquiries: Number(row[19])||0, bookings: Number(row[20])||0 },
    });
  }
  return result;
}
