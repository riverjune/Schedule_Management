export type ID = string;

export interface Member {
  id: ID;
  name: string;
  color: string;
}

export interface Category {
  id: ID;
  name: string;
}

export type MilestoneKind = 'meeting' | 'deadline' | 'presentation' | 'etc';

export interface NoteSection {
  id: ID;
  title: string;
  body: string; // markdown
}

export interface Milestone {
  id: ID;
  date: string; // YYYY-MM-DD
  title: string;
  kind: MilestoneKind;
  pinned: boolean; // D-day 카드에 고정
  notes: NoteSection[];
}

export interface Task {
  id: ID;
  categoryId: ID;
  title: string;
  due: string | null; // YYYY-MM-DD
  assigneeIds: ID[];
  doneBy: ID[]; // 완료한 담당자
  optional: boolean;
  createdAt: number;
}

export interface FileMeta {
  id: ID;
  name: string;
  size: number;
  type: string;
  addedAt: number;
}

export interface Project {
  id: ID;
  name: string;
  subtitle: string;
  meetingUrl: string;
  members: Member[];
  categories: Category[];
  milestones: Milestone[];
  tasks: Task[];
  files: FileMeta[];
  createdAt: number;
}

export interface AppState {
  version: 1;
  projects: Project[];
  activeProjectId: ID | null;
}
