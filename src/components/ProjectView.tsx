import { useMemo, useRef, useState } from 'react';
import { Settings, Video } from 'lucide-react';
import type { Project } from '../types';
import { mutateProject } from '../data/store';
import { daysFromToday } from '../lib/util';
import DdayStrip from './DdayStrip';
import Timeline from './Timeline';
import NextSteps from './NextSteps';
import MeetingNotes from './MeetingNotes';
import Library from './Library';
import SettingsDialog from './SettingsDialog';

/** 처음 보여줄 일정: 오늘 이전 중 가장 최근 것, 없으면 가장 가까운 미래 */
const pickDefaultMilestone = (p: Project) => {
  const sorted = [...p.milestones].sort((a, b) => a.date.localeCompare(b.date));
  const past = sorted.filter((m) => daysFromToday(m.date) <= 0);
  return (past.at(-1) ?? sorted[0])?.id ?? null;
};

export default function ProjectView({ project }: { project: Project }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => pickDefaultMilestone(project));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notesRef = useRef<HTMLElement>(null);

  const milestones = useMemo(
    () => [...project.milestones].sort((a, b) => a.date.localeCompare(b.date)),
    [project.milestones],
  );
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  const selectMilestone = (id: string, scroll = false) => {
    setSelectedId(id);
    if (scroll) requestAnimationFrame(() => notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const update = (fn: (p: Project) => void) => mutateProject(project.id, fn);

  return (
    <div className="project">
      <header className="project-head">
        <div className="project-titles">
          <input
            className="title-input"
            value={project.name}
            placeholder="프로젝트 이름"
            aria-label="프로젝트 이름"
            onChange={(e) => update((p) => void (p.name = e.target.value))}
          />
          <input
            className="subtitle-input"
            value={project.subtitle}
            placeholder="한 줄 설명 (과목, 팀 구성 등)"
            aria-label="한 줄 설명"
            onChange={(e) => update((p) => void (p.subtitle = e.target.value))}
          />
        </div>
        <div className="head-actions">
          {project.meetingUrl && (
            <a className="btn btn-primary" href={project.meetingUrl} target="_blank" rel="noreferrer">
              <Video size={16} /> 회의 들어가기
            </a>
          )}
          <button className="btn" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} /> 팀·설정
          </button>
        </div>
      </header>

      <DdayStrip milestones={milestones} onSelect={(id) => selectMilestone(id, true)} />

      <Timeline
        project={project}
        milestones={milestones}
        selectedId={selected?.id ?? null}
        onSelect={(id) => selectMilestone(id, true)}
        onCreated={(id) => selectMilestone(id)}
      />

      <NextSteps project={project} onOpenSettings={() => setSettingsOpen(true)} />

      <MeetingNotes
        ref={notesRef}
        project={project}
        milestones={milestones}
        milestone={selected}
        onSelect={(id) => selectMilestone(id)}
      />

      <Library project={project} />

      <SettingsDialog project={project} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
