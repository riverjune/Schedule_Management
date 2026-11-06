import { useState } from 'react';
import { Check, ListChecks, Plus, Trash2, X } from 'lucide-react';
import type { Member, Project, Task } from '../types';
import { mutateProject } from '../data/store';
import { cx, daysFromToday, fmtMD, uid } from '../lib/util';

export const isDone = (t: Task) =>
  t.assigneeIds.length ? t.assigneeIds.every((id) => t.doneBy.includes(id)) : t.doneBy.includes('*');

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

const sortTasks = (a: Task, b: Task) =>
  Number(a.optional) - Number(b.optional) ||
  (a.due ?? '9999').localeCompare(b.due ?? '9999') ||
  a.createdAt - b.createdAt;

function DueLabel({ task }: { task: Task }) {
  if (!task.due) return null;
  const d = daysFromToday(task.due);
  const late = d < 0 && !isDone(task);
  const soon = d >= 0 && d <= 3 && !isDone(task);
  return (
    <span className={cx('due', late && 'is-late', soon && 'is-soon')} title={late ? `${-d}일 지남` : `${d}일 남음`}>
      ~{fmtMD(task.due)}
    </span>
  );
}

export default function NextSteps({ project, onOpenSettings }: { project: Project; onOpenSettings: () => void }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const update = (fn: (p: Project) => void) => mutateProject(project.id, fn);
  const memberById = new Map(project.members.map((m) => [m.id, m]));
  const member = memberId ? memberById.get(memberId) ?? null : null;

  const setTask = (id: string, fn: (t: Task) => void) =>
    update((p) => {
      const t = p.tasks.find((x) => x.id === id);
      if (t) fn(t);
    });

  const addTask = (categoryId: string, title: string) =>
    update((p) =>
      p.tasks.push({
        id: uid(),
        categoryId,
        title,
        due: null,
        assigneeIds: memberId ? [memberId] : [],
        doneBy: [],
        optional: false,
        createdAt: Date.now(),
      }),
    );

  const total = project.tasks.length;
  const doneCount = project.tasks.filter(isDone).length;

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">
          <ListChecks size={17} /> 다음 스텝
        </h2>
        <span className="card-hint tabular">
          {doneCount}/{total} 완료
        </span>
        <div className="head-right legend" role="group" aria-label="담당자별 보기">
          {project.members.map((m) => (
            <button
              key={m.id}
              className={cx('legend-chip', memberId === m.id && 'is-active')}
              onClick={() => setMemberId(memberId === m.id ? null : m.id)}
              aria-pressed={memberId === m.id}
            >
              <span className="m-dot" style={{ background: m.color }} />
              {m.name}
            </button>
          ))}
          <label className="toggle-inline">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> 완료 숨기기
          </label>
        </div>
      </div>

      <div className="steps-layout">
        <div className="steps-main">
          {project.categories.map((c) => {
            const tasks = project.tasks
              .filter((t) => t.categoryId === c.id)
              .sort(sortTasks)
              .filter((t) => !hideDone || !isDone(t));
            return (
              <div key={c.id} className="cat-group">
                <div className="cat-head">
                  <span className="cat-chip">{c.name}</span>
                  <span className="cat-count tabular">{tasks.length}개</span>
                </div>
                <ol className="task-list">
                  {tasks.map((t, i) => (
                    <TaskRow
                      key={t.id}
                      index={i + 1}
                      task={t}
                      project={project}
                      memberById={memberById}
                      highlightId={memberId}
                      editing={editingId === t.id}
                      onEdit={() => setEditingId(editingId === t.id ? null : t.id)}
                      onChange={(fn) => setTask(t.id, fn)}
                      onDelete={() => {
                        update((p) => void (p.tasks = p.tasks.filter((x) => x.id !== t.id)));
                        setEditingId(null);
                      }}
                    />
                  ))}
                </ol>
                <AddTask onAdd={(title) => addTask(c.id, title)} />
              </div>
            );
          })}
        </div>

        <aside className="steps-side" aria-live="polite">
          {project.members.length === 0 ? (
            <div className="side-empty">
              <p>팀원을 추가하면 할 일마다 담당자를 지정하고, 사람별로 체크할 수 있어요.</p>
              <button className="btn btn-sm" onClick={onOpenSettings}>
                팀원 추가
              </button>
            </div>
          ) : member ? (
            <MemberPanel project={project} member={member} onToggle={(t) => setTask(t.id, (x) => void (x.doneBy = toggle(x.doneBy, member.id)))} />
          ) : (
            <TeamSummary project={project} onPick={setMemberId} />
          )}
        </aside>
      </div>
    </section>
  );
}

interface RowProps {
  index: number;
  task: Task;
  project: Project;
  memberById: Map<string, Member>;
  highlightId: string | null;
  editing: boolean;
  onEdit: () => void;
  onChange: (fn: (t: Task) => void) => void;
  onDelete: () => void;
}

function TaskRow({ index, task, project, memberById, highlightId, editing, onEdit, onChange, onDelete }: RowProps) {
  const done = isDone(task);
  const dim = highlightId && !task.assigneeIds.includes(highlightId);

  return (
    <li className={cx('task', done && 'is-done', dim && 'is-dim', editing && 'is-editing')}>
      <div className="task-row">
        <span className="task-num tabular">{index}.</span>
        <button className="task-title" onClick={onEdit} aria-expanded={editing}>
          {task.optional && <span className="opt">(선택)</span>} {task.title}
        </button>
        <span className="task-people">
          {task.assigneeIds.length === 0 ? (
            <button
              className={cx('solo-check', done && 'is-on')}
              onClick={() => onChange((t) => void (t.doneBy = done ? [] : ['*']))}
              aria-label={done ? '완료 취소' : '완료 표시'}
            >
              {done && <Check size={12} strokeWidth={3} />}
            </button>
          ) : (
            task.assigneeIds.map((id) => {
              const m = memberById.get(id);
              if (!m) return null;
              const mine = task.doneBy.includes(id);
              return (
                <button
                  key={id}
                  className={cx('p-dot', mine && 'is-done', highlightId === id && 'is-focus')}
                  style={{ ['--c' as string]: m.color }}
                  title={`${m.name} · ${mine ? '완료' : '진행 중'} (눌러서 바꾸기)`}
                  aria-label={`${m.name} ${mine ? '완료 취소' : '완료 표시'}`}
                  onClick={() => onChange((t) => void (t.doneBy = toggle(t.doneBy, id)))}
                />
              );
            })
          )}
        </span>
        <DueLabel task={task} />
      </div>

      {editing && (
        <div className="task-editor">
          <input
            className="field grow"
            value={task.title}
            aria-label="할 일 내용"
            autoFocus
            onChange={(e) => onChange((t) => void (t.title = e.target.value))}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && onEdit()}
          />
          <div className="editor-row">
            <label className="mini-label">
              마감
              <input
                type="date"
                className="field"
                value={task.due ?? ''}
                onChange={(e) => onChange((t) => void (t.due = e.target.value || null))}
              />
            </label>
            <label className="mini-label">
              분류
              <select className="field" value={task.categoryId} onChange={(e) => onChange((t) => void (t.categoryId = e.target.value))}>
                {project.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle-inline">
              <input type="checkbox" checked={task.optional} onChange={(e) => onChange((t) => void (t.optional = e.target.checked))} />
              선택 과제
            </label>
          </div>
          {project.members.length > 0 && (
            <div className="editor-row" role="group" aria-label="담당자">
              <span className="mini-label">담당</span>
              {project.members.map((m) => {
                const on = task.assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={cx('legend-chip', on && 'is-active')}
                    aria-pressed={on}
                    onClick={() =>
                      onChange((t) => {
                        t.assigneeIds = toggle(t.assigneeIds, m.id);
                        t.doneBy = t.doneBy.filter((x) => t.assigneeIds.includes(x));
                      })
                    }
                  >
                    <span className="m-dot" style={{ background: m.color }} />
                    {m.name}
                  </button>
                );
              })}
            </div>
          )}
          <div className="editor-row editor-actions">
            <button className="btn btn-ghost btn-danger btn-sm" onClick={onDelete}>
              <Trash2 size={14} /> 삭제
            </button>
            <button className="btn btn-sm head-right" onClick={onEdit}>
              <Check size={14} /> 닫기
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  if (!open)
    return (
      <button className="add-row" onClick={() => setOpen(true)}>
        <Plus size={14} /> 할 일 추가
      </button>
    );
  const submit = () => {
    if (value.trim()) onAdd(value.trim());
    setValue('');
  };
  return (
    <div className="add-input">
      <input
        autoFocus
        className="field grow"
        placeholder="할 일을 입력하고 Enter (Esc로 닫기)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <button className="icon-btn" onClick={() => setOpen(false)} aria-label="닫기">
        <X size={15} />
      </button>
    </div>
  );
}

function MemberPanel({ project, member, onToggle }: { project: Project; member: Member; onToggle: (t: Task) => void }) {
  const mine = project.tasks.filter((t) => t.assigneeIds.includes(member.id)).sort(sortTasks);
  const done = mine.filter((t) => t.doneBy.includes(member.id)).length;
  return (
    <div className="member-panel">
      <div className="side-head">
        <span className="m-dot" style={{ background: member.color }} />
        <strong>{member.name}</strong>
        <span className="tabular side-count">
          {done}/{mine.length}
        </span>
      </div>
      {mine.length === 0 ? (
        <p className="side-note">맡은 할 일이 없어요. 할 일을 눌러 담당자로 지정해 보세요.</p>
      ) : (
        <ul className="check-list">
          {mine.map((t) => {
            const on = t.doneBy.includes(member.id);
            return (
              <li key={t.id}>
                <label className={cx('check-item', on && 'is-on')}>
                  <input type="checkbox" checked={on} onChange={() => onToggle(t)} />
                  <span className="check-box" aria-hidden>
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="check-text">
                    {t.title}
                    {t.due && <span className="due-inline tabular"> ~{fmtMD(t.due)}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TeamSummary({ project, onPick }: { project: Project; onPick: (id: string) => void }) {
  return (
    <div>
      <div className="side-head">
        <strong>팀원별 진행</strong>
      </div>
      <ul className="summary-list">
        {project.members.map((m) => {
          const mine = project.tasks.filter((t) => t.assigneeIds.includes(m.id));
          const done = mine.filter((t) => t.doneBy.includes(m.id)).length;
          const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
          return (
            <li key={m.id}>
              <button className="summary-row" onClick={() => onPick(m.id)}>
                <span className="m-dot" style={{ background: m.color }} />
                <span className="summary-name">{m.name}</span>
                <span className="summary-bar" aria-hidden>
                  <span style={{ width: `${pct}%`, background: m.color }} />
                </span>
                <span className="tabular summary-num">
                  {done}/{mine.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="side-note">이름을 누르면 그 사람의 체크리스트가 열려요.</p>
    </div>
  );
}
