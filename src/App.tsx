import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAppState } from './data/store';
import Sidebar from './components/Sidebar';
import ProjectView from './components/ProjectView';
import { cx } from './lib/util';

export default function App() {
  const state = useAppState();
  const [navOpen, setNavOpen] = useState(false);
  if (!state) return null;
  const project = state.projects.find((p) => p.id === state.activeProjectId) ?? state.projects[0];

  return (
    <div className={cx('app', navOpen && 'nav-open')}>
      <Sidebar state={state} onNavigate={() => setNavOpen(false)} />
      <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />
      <main className="main">
        <button className="icon-btn nav-toggle" onClick={() => setNavOpen(true)} aria-label="프로젝트 목록 열기">
          <Menu size={18} />
        </button>
        {project ? (
          <ProjectView key={project.id} project={project} />
        ) : (
          <div className="empty-page">
            <p>왼쪽에서 새 프로젝트를 만들어 시작하세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
