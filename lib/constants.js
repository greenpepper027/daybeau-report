export const COUNTRIES = [
  { id: 'japan',     label: '일본',      sheetLabel: '일본' },
  { id: 'china',     label: '중국',      sheetLabel: '중국' },
  { id: 'taiwan',    label: '대만',      sheetLabel: '대만' },
  { id: 'thailand',  label: '태국',      sheetLabel: '태국' },
  { id: 'english',   label: '영어권',    sheetLabel: '영어권' },
  { id: 'indonesia', label: '인도네시아', sheetLabel: '인도네시아' },
  { id: 'vietnam',   label: '베트남',    sheetLabel: '베트남' },
];

export const COUNTRY_COLORS = {
  japan:     '#22c55e',
  china:     '#ef4444',
  taiwan:    '#f97316',
  thailand:  '#14b8a6',
  english:   '#3b82f6',
  indonesia: '#8b5cf6',
  vietnam:   '#ec4899',
};

// 시트 컬럼명 → 내부 metric id 매핑
export const METRIC_MAP = {
  '문의수': 'inquiries',
  '예약수': 'bookings',
  '수납수': 'payments',
  '매출':   'revenue',
  '객단가': 'avgSpend',
  '취소':   'cancellations',
};

export const METRICS = [
  { id: 'inquiries',     label: '문의',   unit: '건' },
  { id: 'bookings',      label: '예약',   unit: '건' },
  { id: 'payments',      label: '수납',   unit: '건' },
  { id: 'revenue',       label: '매출',   unit: '원' },
  { id: 'cancellations', label: '취소',   unit: '건' },
];

export const ROLES = {
  ADMIN:  'admin',
  VIEWER: 'viewer',
};

// 연도별 데일리 시트 탭 이름
export const DAILY_SHEET_TABS = {
  2025: '1) 2025 데일리 매출 및 문의',
  2026: '2) 2026 데일리 매출 및 문의',
};

export const MARKETING_SHEET_TAB = '2) 마케팅 주요진행사항';
export const REVIEWS_SHEET_TAB   = '구글리뷰';

// 월 리포트 탭
export const REPORT_SHEET_TABS = {
  2025: '3) 2025년 월 리포트',
  2026: '3) 2026년 월 리포트',
};
