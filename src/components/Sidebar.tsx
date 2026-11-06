import { useRef } from 'react';
import { FileDown, FileUp, Plus } from 'lucide-react';
import type { AppState } from '../types';
import { mutate, replaceState, useSaveStatus } from '../data/store';
import { emptyProject } from '../data/seed';
import { cx, todayISO } from '../lib/util';

const STATUS: Record<string, string> = {
  idle: '',
  saving: '저장 중…',
  saved: '이 브라우저에 저장됨',
  error: '저장 실패 — 백업을 내보내 두세요',
};

export default function Sidebar({ state, onNavigate }: { state: AppState; onNavigate: () => void }) {
  const status = useSaveStatus();
  const importRef = useRef<HTMLInputElement>(null);

  const addProject = () => {
    const p = emptyProject();
    mutate((s) => {
      s.projects.push(p);
      s.activeProjectId = p.id;
    });
    onNavigate();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `teamplay-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJSON = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppState;
      if (!Array.isArray(data.projects)) throw new Error('형식 오류');
      if (!confirm(`백업의 프로젝트 ${data.projects.length}개로 지금 데이터를 바꿀까요? 자료실 파일은 백업에 포함되지 않아요.`)) return;
      replaceState({ version: 1, projects: data.projects, activeProjectId: data.activeProjectId ?? data.projects[0]?.id ?? null });
    } catch {
      alert('이 파일은 팀플 보드 백업 형식이 아니에요.');
    }
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        팀플 보드
      </div>

      <nav className="project-nav" aria-label="프로젝트">
        <div className="nav-label">프로젝트</div>
        {state.projects.map((p) => (
          <button
            key={p.id}
            className={cx('nav-item', p.id === state.activeProjectId && 'active')}
            onClick={() => {
              mutate((s) => void (s.activeProjectId = p.id));
              onNavigate();
            }}
          >
            <span className="nav-item-name">{p.name || '이름 없는 프로젝트'}</span>
          </button>
        ))}
        <button className="nav-item nav-add" onClick={addProject}>
          <Plus size={15} /> 새 프로젝트
        </button>
      </nav>

      <div className="sidebar-foot">
        <button className="foot-btn" onClick={exportJSON}>
          <FileDown size={15} /> 백업 내보내기
        </button>
        <button className="foot-btn" onClick={() => importRef.current?.click()}>
          <FileUp size={15} /> 백업 가져오기
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJSON(f);
            e.target.value = '';
          }}
        />
        <div className={cx('save-status', status === 'error' && 'is-error')} role="status">
          {STATUS[status]}
        </div>
      </div>
    </aside>
  );
}
