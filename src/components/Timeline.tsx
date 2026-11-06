import { useEffect, useRef, useState } from 'react';
import { CalendarDays, MessageSquareText, Plus } from 'lucide-react';
import type { Milestone, MilestoneKind, Project } from '../types';
import { mutateProject } from '../data/store';
import { cx, daysFromToday, fmtMDW, todayISO, uid } from '../lib/util';

export const KIND_LABEL: Record<MilestoneKind, string> = {
  meeting: '회의',
  deadline: '마감',
  presentation: '발표',
  etc: '기타',
};

interface Props {
  project: Project;
  milestones: Milestone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreated: (id: string) => void;
}

export default function Timeline({ project, milestones, selectedId, onSelect, onCreated }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', date: todayISO(), kind: 'meeting' as MilestoneKind });

  // 처음 열 때 오늘(또는 다음 일정) 근처로 스크롤
  useEffect(() => {
    const track = trackRef.current;
    const target = track?.querySelector<HTMLElement>('[data-anchor="true"]');
    if (track && target) track.scrollLeft = Math.max(0, target.offsetLeft - track.clientWidth / 2 + target.offsetWidth / 2);
  }, []);

  const anchorId = (milestones.find((m) => daysFromToday(m.date) >= 0) ?? milestones.at(-1))?.id;

  const add = () => {
    if (!draft.title.trim()) return;
    const id = uid();
    mutateProject(project.id, (p) =>
      p.milestones.push({ id, title: draft.title.trim(), date: draft.date, kind: draft.kind, pinned: draft.kind !== 'meeting', notes: [] }),
    );
    setDraft({ title: '', date: draft.date, kind: draft.kind });
    setAdding(false);
    onCreated(id);
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">
          <CalendarDays size={17} /> 타임라인
        </h2>
        <span className="card-hint">일정을 누르면 그날 회의록이 열려요</span>
        <button className="btn btn-sm head-right" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          <Plus size={15} /> 일정 추가
        </button>
      </div>

      {adding && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            autoFocus
            className="field grow"
            placeholder="일정 이름 (예: 5차 교수님 미팅)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
          />
          <input type="date" className="field" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
          <select className="field" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MilestoneKind })}>
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit" disabled={!draft.title.trim()}>
            추가
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setAdding(false)}>
            취소
          </button>
        </form>
      )}

      {milestones.length === 0 ? (
        <div className="empty">
          <p>아직 일정이 없어요. 교수님 미팅, 중간발표, 제출 마감처럼 팀 전체가 맞춰야 하는 날을 먼저 넣어 보세요.</p>
        </div>
      ) : (
        <div className="timeline" ref={trackRef}>
          <ol className="timeline-track">
            {milestones.map((m) => {
              const d = daysFromToday(m.date);
              const state = d < 0 ? 'past' : d === 0 ? 'today' : 'future';
              return (
                <li key={m.id} className={cx('tl-item', `is-${state}`)} data-anchor={m.id === anchorId}>
                  <span className="tl-dot" aria-hidden />
                  <button
                    className={cx('tl-card', m.id === selectedId && 'is-selected')}
                    onClick={() => onSelect(m.id)}
                    aria-current={m.id === selectedId ? 'true' : undefined}
                  >
                    <span className="tl-date">
                      {fmtMDW(m.date)}
                      <span className="tl-kind">{KIND_LABEL[m.kind]}</span>
                    </span>
                    <span className="tl-title">{m.title}</span>
                    <span className="tl-meta">
                      {state === 'today' && <span className="badge badge-accent">오늘</span>}
                      {m.notes.length > 0 && (
                        <span className="tl-notes" title={`회의록 ${m.notes.length}개 섹션`}>
                          <MessageSquareText size={13} /> {m.notes.length}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
