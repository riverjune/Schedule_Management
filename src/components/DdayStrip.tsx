import type { Milestone } from '../types';
import { cx, ddayLabel, daysFromToday, fmtMDW } from '../lib/util';

export default function DdayStrip({ milestones, onSelect }: { milestones: Milestone[]; onSelect: (id: string) => void }) {
  const upcoming = milestones.filter((m) => m.pinned && daysFromToday(m.date) >= 0).slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <p className="dday-empty">
        타임라인에서 일정을 고르고 <strong>D-day 고정</strong>을 켜면 여기에 남은 날짜가 표시돼요.
      </p>
    );
  }

  return (
    <section className="dday-strip" aria-label="다가오는 일정">
      {upcoming.map((m, i) => (
        <button key={m.id} className={cx('dday', i === 0 && 'is-next')} onClick={() => onSelect(m.id)}>
          <span className="dday-count">{ddayLabel(m.date)}</span>
          <span className="dday-date">{fmtMDW(m.date)}</span>
          <span className="dday-title">{m.title}</span>
        </button>
      ))}
    </section>
  );
}
