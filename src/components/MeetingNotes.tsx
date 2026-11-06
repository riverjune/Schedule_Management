import { forwardRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquareText, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import type { Milestone, MilestoneKind, NoteSection, Project } from '../types';
import { mutateProject } from '../data/store';
import { renderMarkdown } from '../lib/markdown';
import { cx, fmtMDW, uid } from '../lib/util';
import { KIND_LABEL } from './Timeline';

interface Props {
  project: Project;
  milestones: Milestone[];
  milestone: Milestone | null;
  onSelect: (id: string) => void;
}

/** n번째 체크박스 토글 */
const toggleNthCheckbox = (src: string, n: number) => {
  let i = -1;
  return src.replace(/^(\s*[-*+]\s+\[)( |x|X)(\])/gm, (all, a, mark, b) => {
    i += 1;
    if (i !== n) return all;
    return `${a}${mark === ' ' ? 'x' : ' '}${b}`;
  });
};

const MeetingNotes = forwardRef<HTMLElement, Props>(function MeetingNotes({ project, milestones, milestone, onSelect }, ref) {
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setIndex(0);
    setEditing(false);
    setConfirmDelete(false);
  }, [milestone?.id]);

  const updateMilestone = (fn: (m: Milestone) => void) =>
    mutateProject(project.id, (p) => {
      const m = p.milestones.find((x) => x.id === milestone?.id);
      if (m) fn(m);
    });

  const sections = milestone?.notes ?? [];
  const current: NoteSection | undefined = sections[Math.min(index, sections.length - 1)];
  const at = Math.min(index, Math.max(0, sections.length - 1));

  const updateSection = (fn: (s: NoteSection) => void) =>
    updateMilestone((m) => {
      const s = m.notes.find((x) => x.id === current?.id);
      if (s) fn(s);
    });

  const addSection = () => {
    updateMilestone((m) => m.notes.push({ id: uid(), title: sections.length ? '새 섹션' : '회의 개요', body: '' }));
    setIndex(sections.length);
    setEditing(true);
  };

  return (
    <section className="card" ref={ref}>
      <div className="card-head">
        <h2 className="card-title">
          <MessageSquareText size={17} /> 회의록
        </h2>
        {milestones.length > 0 && (
          <select
            className="field field-quiet"
            value={milestone?.id ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="회의록을 볼 일정"
          >
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {fmtMDW(m.date)} · {m.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {!milestone ? (
        <div className="empty">
          <p>회의록은 일정에 묶여요. 타임라인에서 일정을 먼저 추가해 주세요.</p>
        </div>
      ) : (
        <>
          <div className="ms-bar">
            <input
              className="field grow"
              value={milestone.title}
              aria-label="일정 이름"
              onChange={(e) => updateMilestone((m) => void (m.title = e.target.value))}
            />
            <input
              type="date"
              className="field"
              value={milestone.date}
              aria-label="날짜"
              onChange={(e) => e.target.value && updateMilestone((m) => void (m.date = e.target.value))}
            />
            <select
              className="field"
              value={milestone.kind}
              aria-label="종류"
              onChange={(e) => updateMilestone((m) => void (m.kind = e.target.value as MilestoneKind))}
            >
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <button
              className={cx('btn btn-sm', milestone.pinned && 'is-on')}
              aria-pressed={milestone.pinned}
              onClick={() => updateMilestone((m) => void (m.pinned = !m.pinned))}
            >
              {milestone.pinned ? <Pin size={14} /> : <PinOff size={14} />} D-day 고정
            </button>
            {confirmDelete ? (
              <span className="confirm">
                일정과 회의록을 지울까요?
                <button
                  className="btn btn-sm btn-danger-solid"
                  onClick={() => mutateProject(project.id, (p) => void (p.milestones = p.milestones.filter((x) => x.id !== milestone.id)))}
                >
                  삭제
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(false)}>
                  취소
                </button>
              </span>
            ) : (
              <button className="icon-btn" onClick={() => setConfirmDelete(true)} aria-label="일정 삭제" title="일정 삭제">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {sections.length > 0 && (
            <div className="tabs" role="tablist">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === at}
                  className={cx('tab', i === at && 'is-active')}
                  onClick={() => setIndex(i)}
                >
                  {s.title || '제목 없음'}
                </button>
              ))}
              <button className="tab tab-add" onClick={addSection} aria-label="섹션 추가">
                <Plus size={14} />
              </button>
            </div>
          )}

          {!current ? (
            <div className="empty">
              <p>이 일정의 회의록이 아직 없어요. 개요, 피드백, 팀원 과제처럼 섹션을 나눠 적으면 나중에 찾기 쉬워요.</p>
              <button className="btn btn-sm" onClick={addSection}>
                <Plus size={14} /> 회의록 쓰기
              </button>
            </div>
          ) : editing ? (
            <div className="note-editor">
              <input
                className="field note-title-input"
                value={current.title}
                placeholder="섹션 제목"
                aria-label="섹션 제목"
                onChange={(e) => updateSection((s) => void (s.title = e.target.value))}
              />
              <textarea
                className="field note-body-input"
                value={current.body}
                autoFocus
                placeholder={'마크다운으로 적을 수 있어요.\n- 목록\n- [ ] 체크 항목\n**굵게**, | 표 | 도 돼요'}
                aria-label="섹션 내용"
                onChange={(e) => updateSection((s) => void (s.body = e.target.value))}
              />
              <div className="editor-row">
                <button
                  className="btn btn-ghost btn-danger btn-sm"
                  onClick={() => {
                    updateMilestone((m) => void (m.notes = m.notes.filter((x) => x.id !== current.id)));
                    setIndex(Math.max(0, at - 1));
                    setEditing(false);
                  }}
                >
                  <Trash2 size={14} /> 섹션 삭제
                </button>
                <button className="btn btn-primary btn-sm head-right" onClick={() => setEditing(false)}>
                  완료
                </button>
              </div>
            </div>
          ) : (
            <div className="note-view">
              <button className="icon-btn note-edit" onClick={() => setEditing(true)} aria-label="이 섹션 편집" title="편집">
                <Pencil size={15} />
              </button>
              {current.body.trim() ? (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(current.body).replace(/ disabled=""/g, '') }}
                  onClick={(e) => {
                    const el = e.target as HTMLElement;
                    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
                      const all = Array.from(e.currentTarget.querySelectorAll('input[type="checkbox"]'));
                      const n = all.indexOf(el);
                      updateSection((s) => void (s.body = toggleNthCheckbox(s.body, n)));
                    }
                  }}
                />
              ) : (
                <button className="note-placeholder" onClick={() => setEditing(true)}>
                  비어 있어요. 눌러서 내용을 적어 주세요.
                </button>
              )}
              {sections.length > 1 && (
                <div className="pager">
                  <span className="tabular">
                    {at + 1} / {sections.length}
                  </span>
                  <button className="icon-btn" disabled={at === 0} onClick={() => setIndex(at - 1)} aria-label="이전 섹션">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    disabled={at === sections.length - 1}
                    onClick={() => setIndex(at + 1)}
                    aria-label="다음 섹션"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
});

export default MeetingNotes;
