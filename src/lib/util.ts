export const uid = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 12);

const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** 오늘 기준 날짜 차이(일). 양수 = 미래 */
export const daysFromToday = (iso: string) => {
  const t = parseISO(todayISO()).getTime();
  return Math.round((parseISO(iso).getTime() - t) / 86_400_000);
};

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export const fmtMD = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const fmtMDW = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEK[d.getDay()]})`;
};

export const ddayLabel = (iso: string) => {
  const n = daysFromToday(iso);
  if (n === 0) return 'D-day';
  return n > 0 ? `D-${n}` : `D+${-n}`;
};

export const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export const fmtStamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 멤버 색상 팔레트 — 보라 계열 제외, 흰 배경에서 구분되는 톤 */
export const MEMBER_COLORS = ['#22272e', '#8a9099', '#1f5fa8', '#7fb0e0', '#2f8f6b', '#c4762b', '#b8453b', '#5a7d8c'];

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
