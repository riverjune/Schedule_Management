import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { Project } from '../types';
import { mutate, mutateProject } from '../data/store';
import { repo } from '../data/repo';
import { MEMBER_COLORS, cx, uid } from '../lib/util';

export default function SettingsDialog({ project, open, onClose }: { project: Project; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [newMember, setNewMember] = useState('');
  const [newCat, setNewCat] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (fn: (p: Project) => void) => mutateProject(project.id, fn);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) setConfirmDelete(false);
  }, [open]);

  const addMember = () => {
    const name = newMember.trim();
    if (!name) return;
    const used = new Set(project.members.map((m) => m.color));
    const color = MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[project.members.length % MEMBER_COLORS.length];
    update((p) => p.members.push({ id: uid(), name, color }));
    setNewMember('');
  };

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    update((p) => p.categories.push({ id: uid(), name }));
    setNewCat('');
  };

  const deleteProject = async () => {
    await Promise.all(project.files.map((f) => repo.deleteFile(f.id)));
    mutate((s) => {
      s.projects = s.projects.filter((p) => p.id !== project.id);
      s.activeProjectId = s.projects[0]?.id ?? null;
    });
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="settings-title"
    >
      <div className="dialog-body">
        <div className="dialog-head">
          <h2 id="settings-title">팀·설정</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <fieldset className="set-group">
          <legend>회의 링크</legend>
          <input
            className="field"
            type="url"
            placeholder="https://zoom.us/j/… 또는 Google Meet 주소"
            value={project.meetingUrl}
            onChange={(e) => update((p) => void (p.meetingUrl = e.target.value))}
          />
          <p className="set-help">넣어 두면 상단에 ‘회의 들어가기’ 버튼이 생겨요.</p>
        </fieldset>

        <fieldset className="set-group">
          <legend>팀원</legend>
          <ul className="set-list">
            {project.members.map((m) => (
              <li key={m.id} className="set-row">
                <div className="swatches" role="radiogroup" aria-label={`${m.name} 색상`}>
                  {MEMBER_COLORS.map((c) => (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={m.color === c}
                      className={cx('swatch', m.color === c && 'is-on')}
                      style={{ background: c }}
                      onClick={() => update((p) => void (p.members.find((x) => x.id === m.id)!.color = c))}
                      aria-label={c}
                    />
                  ))}
                </div>
                <input
                  className="field grow"
                  value={m.name}
                  aria-label="이름"
                  onChange={(e) => update((p) => void (p.members.find((x) => x.id === m.id)!.name = e.target.value))}
                />
                <button
                  className="icon-btn"
                  aria-label={`${m.name} 삭제`}
                  onClick={() =>
                    update((p) => {
                      p.members = p.members.filter((x) => x.id !== m.id);
                      p.tasks.forEach((t) => {
                        t.assigneeIds = t.assigneeIds.filter((x) => x !== m.id);
                        t.doneBy = t.doneBy.filter((x) => x !== m.id);
                      });
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="set-add"
            onSubmit={(e) => {
              e.preventDefault();
              addMember();
            }}
          >
            <input className="field grow" placeholder="팀원 이름" value={newMember} onChange={(e) => setNewMember(e.target.value)} />
            <button className="btn btn-sm" type="submit" disabled={!newMember.trim()}>
              <Plus size={14} /> 추가
            </button>
          </form>
        </fieldset>

        <fieldset className="set-group">
          <legend>할 일 분류</legend>
          <ul className="set-list">
            {project.categories.map((c) => {
              const count = project.tasks.filter((t) => t.categoryId === c.id).length;
              const last = project.categories.length === 1;
              return (
                <li key={c.id} className="set-row">
                  <input
                    className="field grow"
                    value={c.name}
                    aria-label="분류 이름"
                    onChange={(e) => update((p) => void (p.categories.find((x) => x.id === c.id)!.name = e.target.value))}
                  />
                  <span className="set-meta tabular">{count}개</span>
                  <button
                    className="icon-btn"
                    disabled={last}
                    title={last ? '분류는 하나 이상 있어야 해요' : count ? '할 일은 첫 번째 분류로 옮겨져요' : '삭제'}
                    aria-label={`${c.name} 삭제`}
                    onClick={() =>
                      update((p) => {
                        p.categories = p.categories.filter((x) => x.id !== c.id);
                        const fallback = p.categories[0].id;
                        p.tasks.forEach((t) => t.categoryId === c.id && (t.categoryId = fallback));
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            className="set-add"
            onSubmit={(e) => {
              e.preventDefault();
              addCategory();
            }}
          >
            <input className="field grow" placeholder="분류 이름 (예: 자료조사)" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn btn-sm" type="submit" disabled={!newCat.trim()}>
              <Plus size={14} /> 추가
            </button>
          </form>
        </fieldset>

        <fieldset className="set-group danger-zone">
          <legend>프로젝트 삭제</legend>
          {confirmDelete ? (
            <div className="confirm">
              ‘{project.name}’의 일정, 할 일, 회의록, 자료가 모두 지워져요.
              <button className="btn btn-sm btn-danger-solid" onClick={deleteProject}>
                영구 삭제
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(false)}>
                취소
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> 이 프로젝트 삭제
            </button>
          )}
        </fieldset>
      </div>
    </dialog>
  );
}
